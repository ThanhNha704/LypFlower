using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using MongoDB.Driver;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;

namespace Web_HoaTuoi.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly VectorDbService _vectorDb;
        private readonly HttpClient _httpClient;
        private readonly string _mongoConnString;
        private readonly string _geminiApiKey;
        private readonly IConfiguration _configuration;

        public ChatController(AppDbContext db, VectorDbService vectorDb, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _vectorDb = vectorDb;
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();

            try { DotNetEnv.Env.Load(".env.local"); } catch { }

            var mongoConn = configuration["MONGO_CONNECTION_STRING"]
                            ?? Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING")
                            ?? DotNetEnv.Env.GetString("MONGO_CONNECTION_STRING", null)
                            ?? configuration.GetConnectionString("MongoDB");

            if (string.IsNullOrWhiteSpace(mongoConn))
            {
                mongoConn = "mongodb+srv://truongnha474:mongoDb@cluster0.r2doavc.mongodb.net/";
            }
            _mongoConnString = mongoConn;

            var rawKey = configuration["GEMINI_API_KEY"]
                         ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                         ?? DotNetEnv.Env.GetString("GEMINI_API_KEY", null)
                         ?? string.Empty;

            _geminiApiKey = rawKey.Trim().Trim('"', '\'');
        }

        // DTOs
        public class ChatRequest
        {
            public Guid? SessionId { get; set; }
            public string Message { get; set; } = string.Empty;
        }

        public class ChatResponse
        {
            public Guid SessionId { get; set; }
            public string ResponseText { get; set; } = string.Empty;
            public List<ProductRecommendDto> RecommendedProducts { get; set; } = new();
        }

        public class ProductRecommendDto
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public decimal SalePrice { get; set; }
            public string MainImageUrl { get; set; } = string.Empty;
        }

        public class ChatSettingsDto
        {
            public bool Enabled { get; set; }
            public string Greeting { get; set; } = string.Empty;
            public string SystemPrompt { get; set; } = string.Empty;
        }

        // =========================================================================
        // USER ENDPOINTS
        // =========================================================================

        [HttpGet("config")]
        public async Task<IActionResult> GetChatConfig()
        {
            var enabledSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Enabled");
            var greetingSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Greeting");

            bool enabled = enabledSetting == null || enabledSetting.Value.ToLower() == "true";
            string greeting = greetingSetting?.Value ?? "Xin chào! Lyp AI có thể giúp gì cho bạn hôm nay?";

            return Ok(new { enabled, greeting });
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Message))
            {
                return BadRequest(new { message = "Tin nhắn không được để trống." });
            }

            // 1. Kiểm tra trạng thái chatbot
            var enabledSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Enabled");
            if (enabledSetting != null && enabledSetting.Value.ToLower() == "false")
            {
                return BadRequest(new { message = "Trợ lý ảo Lyp AI hiện đang bảo trì." });
            }

            // 2. Tìm hoặc tạo ChatSession
            ChatSession? session = null;
            if (request.SessionId.HasValue && request.SessionId != Guid.Empty)
            {
                session = await _db.ChatSessions
                    .Include(s => s.Messages)
                    .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value);
            }

            if (session == null)
            {
                session = new ChatSession
                {
                    Id = request.SessionId ?? Guid.NewGuid(),
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                // Gán UserId nếu đã đăng nhập
                if (User.Identity?.IsAuthenticated == true)
                {
                    var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                    if (userIdClaim != null)
                    {
                        session.UserId = userIdClaim.Value;
                    }
                }

                _db.ChatSessions.Add(session);
            }

            session.LastMessageAt = DateTime.UtcNow;

            // 3. Lưu tin nhắn của User
            var userMsg = new ChatMessage
            {
                ChatSessionId = session.Id,
                Sender = "User",
                Content = request.Message,
                CreatedAt = DateTime.UtcNow
            };
            _db.ChatMessages.Add(userMsg);
            await _db.SaveChangesAsync();

            // 4. Phân tích giới hạn giá từ câu query tiếng Việt (Lọc Hybrid)
            decimal? minPrice = null;
            decimal? maxPrice = null;
            var lowerMsg = request.Message.ToLower();

            var priceRegex = new System.Text.RegularExpressions.Regex(
                @"(dưới|rẻ hơn|ít hơn|nhỏ hơn|thấp hơn|trên|hơn|từ|lớn hơn|cao hơn)\s+([0-9\.,]+)\s*(k|tr|triệu|tỷ|đ|đồng|ngàn|nghìn)?",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            var matchResult = priceRegex.Match(lowerMsg);
            if (matchResult.Success)
            {
                var direction = matchResult.Groups[1].Value;
                var numStr = matchResult.Groups[2].Value.Replace(".", "").Replace(",", "");
                var unit = matchResult.Groups[3].Value;

                if (decimal.TryParse(numStr, out decimal numVal))
                {
                    if (unit == "k" || unit == "ngàn" || unit == "nghìn")
                    {
                        numVal *= 1000;
                    }
                    else if (unit == "tr" || unit == "triệu")
                    {
                        numVal *= 1000000;
                    }
                    else if (numVal < 1000)
                    {
                        numVal *= 1000;
                    }

                    if (direction == "dưới" || direction == "rẻ hơn" || direction == "ít hơn" || direction == "nhỏ hơn" || direction == "thấp hơn")
                    {
                        maxPrice = numVal;
                    }
                    else if (direction == "trên" || direction == "hơn" || direction == "từ" || direction == "lớn hơn" || direction == "cao hơn")
                    {
                        minPrice = numVal;
                    }
                }
            }

            List<ProductRecommendDto> recommendedProducts = new();
            try
            {
                var queryVector = await _vectorDb.GetEmbeddingFromGeminiAsync(request.Message);
                if (queryVector != null && queryVector.Count > 0 && !string.IsNullOrWhiteSpace(_mongoConnString))
                {
                    var mongoSettings = MongoClientSettings.FromConnectionString(_mongoConnString);
                    mongoSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(3);
                    var client = new MongoClient(mongoSettings);
                    var database = client.GetDatabase("HoaTuoiSearchDB");
                    var collection = database.GetCollection<BsonDocument>("flower_embeddings");

                    var vectorSearchStage = new BsonDocument("$vectorSearch", new BsonDocument
                    {
                        { "index", "vector_index" },
                        { "path", "flower_vector" },
                        { "queryVector", new BsonArray(queryVector) },
                        { "numCandidates", 30 },
                        { "limit", 5 }
                    });

                    var projectStage = new BsonDocument("$project", new BsonDocument
                    {
                        { "ProductId", 1 },
                        { "Name", 1 },
                        { "Slug", 1 },
                        { "Price", 1 },
                        { "SalePrice", 1 },
                        { "MainImageUrl", 1 },
                        { "IsActive", 1 },
                        { "Stock", 1 },
                        { "score", new BsonDocument("$meta", "vectorSearchScore") }
                    });

                    var matchQuery = new BsonDocument
                    {
                        { "score", new BsonDocument("$gte", 0.50) },
                        { "IsActive", true },
                        { "Stock", new BsonDocument("$gt", 0) }
                    };

                    if (minPrice.HasValue || maxPrice.HasValue)
                    {
                        var priceFilter = new BsonDocument();
                        if (minPrice.HasValue)
                        {
                            priceFilter.Add("$gte", new BsonDecimal128(minPrice.Value));
                        }
                        if (maxPrice.HasValue)
                        {
                            priceFilter.Add("$lte", new BsonDecimal128(maxPrice.Value));
                        }
                        matchQuery.Add("Price", priceFilter);
                    }

                    var matchStage = new BsonDocument("$match", matchQuery);

                    var pipeline = new[] { vectorSearchStage, projectStage, matchStage };
                    var resultsBson = await collection.Aggregate<BsonDocument>(pipeline).ToListAsync();

                    if (resultsBson != null && resultsBson.Count > 0)
                    {
                        recommendedProducts = resultsBson.Select(doc => new ProductRecommendDto
                        {
                            Id = doc.GetValue("ProductId", 0).AsInt32,
                            Name = doc.GetValue("Name", "").AsString,
                            Slug = doc.GetValue("Slug", "").AsString,
                            Price = doc.GetValue("Price", 0).AsDecimal,
                            SalePrice = doc.GetValue("SalePrice", 0).AsDecimal,
                            MainImageUrl = doc.GetValue("MainImageUrl", "").AsString
                        }).ToList();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Chat Vector Search Warning]: {ex.Message}");
            }

            // Fallback SQL Search nếu vector search không trả về gì hoặc khi có bộ lọc giá cụ thể
            if (recommendedProducts.Count == 0 && (minPrice.HasValue || maxPrice.HasValue || request.Message.Contains("mua") || request.Message.Contains("tìm") || request.Message.Contains("hoa") || request.Message.Contains("giá")))
            {
                var keywords = request.Message.ToLower().Split(' ');
                var sqlQuery = _db.Products.Where(p => p.IsActive);

                if (minPrice.HasValue)
                {
                    sqlQuery = sqlQuery.Where(p => p.Price >= minPrice.Value);
                }
                if (maxPrice.HasValue)
                {
                    sqlQuery = sqlQuery.Where(p => p.Price <= maxPrice.Value);
                }

                var sqlProducts = await sqlQuery
                    .OrderByDescending(p => p.SoldCount)
                    .Take(50)
                    .ToListAsync();

                recommendedProducts = sqlProducts
                    .Where(p => keywords.Any(k => k.Length > 2 && p.Name.ToLower().Contains(k)) || (minPrice.HasValue || maxPrice.HasValue))
                    .Take(4)
                    .Select(p => new ProductRecommendDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Price = p.Price,
                        SalePrice = p.SalePrice ?? 0,
                        MainImageUrl = p.MainImageUrl
                    }).ToList();
            }

            // 5. Gọi Gemini để sinh câu trả lời
            string aiResponseText = string.Empty;
            if (!string.IsNullOrWhiteSpace(_geminiApiKey))
            {
                try
                {
                    string geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={_geminiApiKey}";

                    // Lấy Cấu hình System Prompt
                    var promptSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_SystemPrompt");
                    string systemInstruction = promptSetting?.Value ?? "Bạn là chuyên gia tư vấn hoa tươi cao cấp của Lyp Flower. Trò chuyện thật ấm áp, lịch sự. Trả lời súc tích dưới 120 từ.";

                    // Lịch sử trò chuyện gần nhất (6 tin nhắn gần đây)
                    var recentMessages = await _db.ChatMessages
                        .Where(m => m.ChatSessionId == session.Id && m.Id != userMsg.Id)
                        .OrderByDescending(m => m.CreatedAt)
                        .Take(6)
                        .OrderBy(m => m.CreatedAt)
                        .ToListAsync();

                    // Chuẩn bị bối cảnh sản phẩm hoa để AI tư vấn
                    string productContext = "";
                    if (recommendedProducts.Count > 0)
                    {
                        var productDetails = recommendedProducts.Select(p => $"- {p.Name} (Giá: {p.Price:N0}đ, Giá khuyến mãi: {(p.SalePrice > 0 ? p.SalePrice.ToString("N0") + "đ" : "Không sale")})");
                        productContext = "\nSản phẩm hoa phù hợp hiện có tại cửa hàng:\n" + string.Join("\n", productDetails);
                    }

                    // Xây dựng Prompt
                    StringBuilder promptBuilder = new StringBuilder();
                    promptBuilder.AppendLine($"Instruction: {systemInstruction}");
                    promptBuilder.AppendLine("Lịch sử hội thoại:");
                    foreach (var msg in recentMessages)
                    {
                        promptBuilder.AppendLine($"{msg.Sender}: {msg.Content}");
                    }
                    promptBuilder.AppendLine($"{productContext}");
                    promptBuilder.AppendLine($"Khách hàng: {request.Message}");
                    promptBuilder.AppendLine("AI:");

                    var requestBody = new
                    {
                        contents = new[]
                        {
                            new { parts = new[] { new { text = promptBuilder.ToString() } } }
                        }
                    };

                    var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                    var response = await _httpClient.PostAsync(geminiUrl, jsonContent, cts.Token);

                    if (response.IsSuccessStatusCode)
                    {
                        using var jsonDoc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cts.Token));
                        var candidates = jsonDoc.RootElement.GetProperty("candidates");
                        if (candidates.GetArrayLength() > 0)
                        {
                            var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                aiResponseText = text.Trim();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Chatbot AI Generation Error]: {ex.Message}");
                }
            }

            if (string.IsNullOrWhiteSpace(aiResponseText))
            {
                aiResponseText = "Lyp Flower xin lỗi vì sự bất tiện này, hệ thống AI của cửa hàng hiện đang bận. Tôi có thể giúp gì thêm cho bạn?";
            }

            // 6. Lưu tin nhắn của AI kèm danh sách sản phẩm gợi ý dạng JSON
            var aiMsg = new ChatMessage
            {
                ChatSessionId = session.Id,
                Sender = "AI",
                Content = aiResponseText,
                CreatedAt = DateTime.UtcNow,
                RecommendedProductsJson = recommendedProducts.Count > 0 ? JsonSerializer.Serialize(recommendedProducts) : null
            };
            _db.ChatMessages.Add(aiMsg);
            await _db.SaveChangesAsync();

            return Ok(new ChatResponse
            {
                SessionId = session.Id,
                ResponseText = aiResponseText,
                RecommendedProducts = recommendedProducts
            });
        }

        [HttpGet("sessions/{sessionId}/messages")]
        public async Task<IActionResult> GetSessionMessages(Guid sessionId)
        {
            var messages = await _db.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.Sender,
                    m.Content,
                    m.CreatedAt,
                    RecommendedProducts = string.IsNullOrEmpty(m.RecommendedProductsJson)
                        ? new List<ProductRecommendDto>()
                        : JsonSerializer.Deserialize<List<ProductRecommendDto>>(m.RecommendedProductsJson, JsonSerializerOptions.Default)
                })
                .ToListAsync();

            return Ok(messages);
        }

        // =========================================================================
        // ADMIN ENDPOINTS
        // =========================================================================

        [HttpGet("sessions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetChatSessions([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _db.ChatSessions
                .Include(s => s.User)
                .OrderByDescending(s => s.LastMessageAt);

            var total = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.Id,
                    s.StartedAt,
                    s.LastMessageAt,
                    s.IpAddress,
                    s.UserAgent,
                    UserEmail = s.User != null ? s.User.Email : null,
                    UserFullName = s.User != null ? s.User.FullName : "Khách vãng lai",
                    MessageCount = _db.ChatMessages.Count(m => m.ChatSessionId == s.Id)
                })
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                items
            });
        }

        [HttpDelete("sessions/{sessionId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteChatSession(Guid sessionId)
        {
            var session = await _db.ChatSessions.FindAsync(sessionId);
            if (session == null)
            {
                return NotFound();
            }

            _db.ChatSessions.Remove(session);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSettings()
        {
            var enabledSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Enabled");
            var greetingSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Greeting");
            var promptSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_SystemPrompt");

            var dto = new ChatSettingsDto
            {
                Enabled = enabledSetting == null || enabledSetting.Value.ToLower() == "true",
                Greeting = greetingSetting?.Value ?? "Xin chào! Lyp AI có thể giúp gì cho bạn hôm nay?",
                SystemPrompt = promptSetting?.Value ?? "Bạn là chuyên gia tư vấn hoa tươi cao cấp của Lyp Flower. Trò chuyện thật ấm áp, lịch sự. Trả lời súc tích dưới 120 từ."
            };

            return Ok(dto);
        }

        [HttpPut("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSettings([FromBody] ChatSettingsDto dto)
        {
            var enabledSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Enabled");
            if (enabledSetting == null)
            {
                enabledSetting = new SystemSetting { Key = "Chatbot_Enabled", Value = dto.Enabled.ToString(), UpdatedAt = DateTime.UtcNow };
                _db.SystemSettings.Add(enabledSetting);
            }
            else
            {
                enabledSetting.Value = dto.Enabled.ToString();
                enabledSetting.UpdatedAt = DateTime.UtcNow;
            }

            var greetingSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_Greeting");
            if (greetingSetting == null)
            {
                greetingSetting = new SystemSetting { Key = "Chatbot_Greeting", Value = dto.Greeting, UpdatedAt = DateTime.UtcNow };
                _db.SystemSettings.Add(greetingSetting);
            }
            else
            {
                greetingSetting.Value = dto.Greeting;
                greetingSetting.UpdatedAt = DateTime.UtcNow;
            }

            var promptSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Chatbot_SystemPrompt");
            if (promptSetting == null)
            {
                promptSetting = new SystemSetting { Key = "Chatbot_SystemPrompt", Value = dto.SystemPrompt, UpdatedAt = DateTime.UtcNow };
                _db.SystemSettings.Add(promptSetting);
            }
            else
            {
                promptSetting.Value = dto.SystemPrompt;
                promptSetting.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("vectordb/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetVectorDbStatus()
        {
            var sqlCount = await _db.Products.CountAsync(p => p.IsActive);
            var mongoCount = await _vectorDb.GetVectorDbCountAsync();

            return Ok(new
            {
                sqlCount,
                mongoCount,
                isSynced = sqlCount == mongoCount
            });
        }

        [HttpPost("vectordb/sync")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SyncVectorDb()
        {
            // 1. Chạy quy trình ETL Data Warehouse đồng thời
            try
            {
                var dwhConnStr = DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null)?
                                    .Replace("Database=WebHoaTuoiDb", "Database=HoaTuoi_DWH")
                                    .Replace("database=WebHoaTuoiDb", "database=HoaTuoi_DWH") 
                                 ?? _configuration.GetConnectionString("DwhConnection");
                if (!string.IsNullOrEmpty(dwhConnStr))
                {
                    using var conn = new Microsoft.Data.SqlClient.SqlConnection(dwhConnStr);
                    await conn.OpenAsync();
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "sp_ETL_Load_HoaTuoi_DWH";
                    cmd.CommandType = System.Data.CommandType.StoredProcedure;
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine("[SyncVectorDb] DWH ETL completed successfully.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SyncVectorDb] DWH ETL failed: {ex.Message}");
                // Vẫn tiếp tục đồng bộ sang Vector DB cho dù DWH ETL có bị lỗi
            }

            // 2. Đồng bộ Vector Database (MongoDB Atlas)
            var count = await _vectorDb.SyncAllProductsToVectorDbAsync();
            return Ok(new { message = "Đồng bộ thành công dữ liệu sản phẩm lên Data Warehouse và Vector Database.", count });
        }
    }
}
