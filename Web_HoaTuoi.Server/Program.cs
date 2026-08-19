using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;
using System.Text.Json.Serialization;

// Nạp cấu hình biến môi trường từ các tệp tin .env.local hoặc .env mặc định
try
{
    DotNetEnv.Env.Load(".env.local");
}
catch
{
    DotNetEnv.Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

// Cấu hình kết nối cơ sở dữ liệu SQL Server (Entity Framework Core)
var defaultConnStr = (DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null) 
                     ?? builder.Configuration.GetConnectionString("DefaultConnection"))?.Trim('"');
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(defaultConnStr));

// Đăng ký kết nối Redis Cache phục vụ quản lý số lượng tồn kho (Inventory)
var redisConn = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(redisConn + ",abortConnect=false"));
builder.Services.AddScoped<IInventoryService, RedisInventoryService>();

// Cấu hình giới hạn tần suất yêu cầu (Rate Limiting) ngăn chặn spam đặt hàng
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("OrderLimit", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

// Cấu hình ASP.NET Core Identity để quản lý tài khoản người dùng và mật khẩu bảo mật
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Password.RequiredUniqueChars = 1;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Cấu hình Xác thực dựa trên JWT (JSON Web Token) cho các API yêu cầu đăng nhập
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Cấu hình chia sẻ tài nguyên nguồn gốc chéo (CORS) cho môi trường dev và nhận webhook
builder.Services.AddCors(options =>
{
    // Cấu hình cho phép kết nối từ Front-end client (Vite/React)
    options.AddPolicy("AllowViteClient", policy =>
        policy
            .WithOrigins(
                "https://localhost:61348",
                "http://localhost:61348",
                "http://localhost:5173",
                "https://localhost:5173",
                "http://localhost:5174",
                "https://localhost:5174"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
            
    // Cấu hình mở rộng cho các bên thứ ba gửi Webhook thanh toán (ví dụ: Sepay)
    options.AddPolicy("AllowAll", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Đăng ký các dịch vụ hệ thống và tích hợp bên thứ ba (VnPay, ZaloPay, Email)
builder.Services.AddHttpClient(); // Đăng ký IHttpClientFactory
builder.Services.AddScoped<IVnPayService, VnPayService>();
builder.Services.AddScoped<IZaloPayService, ZaloPayService>();

builder.Services.AddHostedService<SepayPollingService>();

builder.Services.Configure<EmailSettings>(options =>
{
    var section = builder.Configuration.GetSection("EmailSettings");
    
    var senderEmail = DotNetEnv.Env.GetString("EmailSettings__SenderEmail", null) ?? section["SenderEmail"];
    var senderPassword = DotNetEnv.Env.GetString("EmailSettings__SenderPassword", null) ?? section["SenderPassword"];
    var smtpServer = DotNetEnv.Env.GetString("EmailSettings__SmtpServer", null) ?? section["SmtpServer"];
    var smtpPortStr = DotNetEnv.Env.GetString("EmailSettings__SmtpPort", null) ?? section["SmtpPort"];
    var senderName = DotNetEnv.Env.GetString("EmailSettings__SenderName", null) ?? section["SenderName"];

    options.SenderEmail = senderEmail?.Trim('"') ?? string.Empty;
    options.SenderPassword = senderPassword?.Trim('"') ?? string.Empty;
    options.SmtpServer = smtpServer?.Trim('"') ?? "smtp.gmail.com";
    options.SenderName = senderName?.Trim('"') ?? "LypFlower";
    options.SmtpPort = int.TryParse(smtpPortStr?.Trim('"'), out var port) ? port : 587;
});
builder.Services.AddTransient<IEmailSenderService, EmailSenderService>();

builder.Services.AddScoped<Web_HoaTuoi.Server.Services.VectorDbService>();
builder.Services.AddScoped<Web_HoaTuoi.Server.Services.DwhSyncService>();
builder.Services.AddSingleton<ICloudinaryService, CloudinaryService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Web Hoa Tươi API",
        Version = "v1",
        Description = "API cho nền tảng thương mại điện tử hoa tươi"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization: nhập 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddSignalR();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web Hoa Tươi API v1");
        c.RoutePrefix = "swagger";
    });
}



// Sử dụng cấu hình CORS để cho phép các nguồn gốc bên ngoài kết nối
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHub<Web_HoaTuoi.Server.Hubs.OrderHub>("/hubs/orders");
app.MapFallbackToFile("/index.html");

// Tự động cập nhật cơ sở dữ liệu (Auto Migration) và nạp dữ liệu mẫu khi khởi động ứng dụng
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    try { db.Database.Migrate(); } catch (Exception ex) { Console.WriteLine($"[Migrate Warning] Bỏ qua lỗi migrate: {ex.Message}"); }
    await DbSeeder.SeedAsync(db, userManager, roleManager);

    var inventory = scope.ServiceProvider.GetRequiredService<IInventoryService>();
    await inventory.SyncFromDatabaseAsync(db);

    // Tiến hành đồng bộ luồng nền: Cập nhật Data Warehouse (DWH) và MongoDB Vector Database
    var rootServiceProvider = app.Services;
    _ = Task.Run(async () =>
    {
        try
        {
            using (var dwhScope = rootServiceProvider.CreateScope())
            {
                var config = dwhScope.ServiceProvider.GetRequiredService<IConfiguration>();
                var dwhConnStr = (DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null)?
                                    .Replace("Database=WebHoaTuoiDb", "Database=HoaTuoi_DWH")
                                    .Replace("database=WebHoaTuoiDb", "database=HoaTuoi_DWH") 
                                 ?? config.GetConnectionString("DwhConnection"))?.Trim('"');
                if (!string.IsNullOrEmpty(dwhConnStr))
                {
                    // Tự động khởi tạo database và schema nếu chưa có
                    await EnsureDwhInitializedAsync(dwhConnStr);

                    var dwhSync = dwhScope.ServiceProvider.GetRequiredService<Web_HoaTuoi.Server.Services.DwhSyncService>();
                    await dwhSync.SyncAsync();
                    Console.WriteLine("[Auto-Sync Startup] DWH ETL completed successfully using C# Sync.");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Auto-Sync Startup] DWH ETL failed: {ex.Message}");
        }

        try
        {
            using (var vectorScope = rootServiceProvider.CreateScope())
            {
                var vectorDb = vectorScope.ServiceProvider.GetRequiredService<VectorDbService>();
                var count = await vectorDb.SyncAllProductsToVectorDbAsync();
                Console.WriteLine($"[Auto-Sync Startup] Vector DB sync completed: {count} products synced.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Auto-Sync Startup] Vector DB sync failed: {ex.Message}");
        }
    });
}

async Task EnsureDwhInitializedAsync(string dwhConnStr)
{
    try
    {
        // 1. Kết nối tới cơ sở dữ liệu hệ thống (master) để kiểm tra và khởi tạo database HoaTuoi_DWH
        var builder = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(dwhConnStr);
        builder.InitialCatalog = "master";
        var masterConnStr = builder.ConnectionString;

        using (var conn = new Microsoft.Data.SqlClient.SqlConnection(masterConnStr))
        {
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'HoaTuoi_DWH') CREATE DATABASE HoaTuoi_DWH;";
            await cmd.ExecuteNonQueryAsync();
        }

        // 2. Kết nối trực tiếp tới HoaTuoi_DWH để khởi tạo các bảng (Dimension/Fact) và stored procedure
        using (var conn = new Microsoft.Data.SqlClient.SqlConnection(dwhConnStr))
        {
            await conn.OpenAsync();

            // Cập nhật kiểu dữ liệu cho cột khóa chính CustomerId sang NVARCHAR(450) nếu là DB cũ
            try
            {
                using var upgradeCmd = conn.CreateCommand();
                upgradeCmd.CommandText = @"
                    IF EXISTS (
                        SELECT * FROM sys.columns 
                        WHERE object_id = OBJECT_ID('Dim_Customer') 
                          AND name = 'CustomerId' 
                          AND system_type_id = 56
                    )
                    BEGIN
                        ALTER TABLE Dim_Customer ALTER COLUMN CustomerId NVARCHAR(450) NOT NULL;
                    END
                ";
                await upgradeCmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DWH Auto-Init Warning] Khong the nang cap cot CustomerId: {ex.Message}");
            }

            // Kiểm tra sự tồn tại của bảng Dim_Customer để quyết định khởi tạo cấu trúc dữ liệu
            bool tableExists = false;
            try
            {
                using var checkCmd = conn.CreateCommand();
                checkCmd.CommandText = "SELECT OBJECT_ID('Dim_Customer', 'U')";
                var objId = await checkCmd.ExecuteScalarAsync();
                tableExists = objId != DBNull.Value && objId != null;
            }
            catch { }

            if (!tableExists)
            {
                Console.WriteLine("[DWH Auto-Init] Khoi tao cac bang trong database HoaTuoi_DWH...");
                var sqlDataDir = FindSqlDataDir();
                var createDwhPath = Path.Combine(sqlDataDir, "create_dwh.sql");
                if (File.Exists(createDwhPath))
                {
                    var script = await File.ReadAllTextAsync(createDwhPath);
                    var commands = System.Text.RegularExpressions.Regex.Split(script, @"^\s*GO\s*$", System.Text.RegularExpressions.RegexOptions.Multiline);
                    foreach (var cmdText in commands)
                    {
                        if (string.IsNullOrWhiteSpace(cmdText)) continue;
                        using var cmd = conn.CreateCommand();
                        cmd.CommandText = cmdText;
                        await cmd.ExecuteNonQueryAsync();
                    }
                    Console.WriteLine("[DWH Auto-Init] Tao cac bang thanh cong.");
                }
            }

            // Cập nhật hoặc tạo mới stored procedure ETL cho kho dữ liệu
            var etlPath = Path.Combine(FindSqlDataDir(), "etl_procedure_fixed.sql");
            if (File.Exists(etlPath))
            {
                Console.WriteLine("[DWH Auto-Init] Nap hoac cap nhat stored procedure sp_ETL_Load_HoaTuoi_DWH...");
                var script = await File.ReadAllTextAsync(etlPath);
                var commands = System.Text.RegularExpressions.Regex.Split(script, @"^\s*GO\s*$", System.Text.RegularExpressions.RegexOptions.Multiline);
                foreach (var cmdText in commands)
                {
                    if (string.IsNullOrWhiteSpace(cmdText)) continue;
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = cmdText;
                    await cmd.ExecuteNonQueryAsync();
                }
                Console.WriteLine("[DWH Auto-Init] Nap stored procedure thanh cong.");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DWH Auto-Init Error]: {ex.Message}");
    }
}

string FindSqlDataDir()
{
    var current = Directory.GetCurrentDirectory();
    var path1 = Path.Combine(current, "..", "sql_data");
    if (Directory.Exists(path1)) return path1;
    
    var path2 = Path.Combine(current, "sql_data");
    if (Directory.Exists(path2)) return path2;

    var baseDir = AppDomain.CurrentDomain.BaseDirectory;
    var di = new DirectoryInfo(baseDir);
    while (di != null)
    {
        var target = Path.Combine(di.FullName, "sql_data");
        if (Directory.Exists(target)) return target;
        
        var target2 = Path.Combine(di.FullName, "Web_HoaTuoi", "sql_data");
        if (Directory.Exists(target2)) return target2;

        di = di.Parent;
    }
    
    return path1;
}

app.Run();