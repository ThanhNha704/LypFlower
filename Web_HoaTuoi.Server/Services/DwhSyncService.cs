using System.Data;
using System.Text;
using Microsoft.Data.SqlClient;
using Dapper;

namespace Web_HoaTuoi.Server.Services
{
    public class DwhSyncService
    {
        private readonly string _defaultConnectionString;
        private readonly string _dwhConnectionString;

        public DwhSyncService(IConfiguration configuration)
        {
            _defaultConnectionString = DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null) 
                                       ?? configuration.GetConnectionString("DefaultConnection")!;
            _dwhConnectionString = DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null)?
                                      .Replace("Database=WebHoaTuoiDb", "Database=HoaTuoi_DWH")
                                      .Replace("database=WebHoaTuoiDb", "database=HoaTuoi_DWH") 
                                   ?? configuration.GetConnectionString("DwhConnection")!;
        }

        public async Task SyncAsync()
        {
            // 1. Fetch data from OLTP (transaction database)
            using var oltpConn = new SqlConnection(_defaultConnectionString);
            await oltpConn.OpenAsync();

            var users = (await oltpConn.QueryAsync<(string Id, string FullName, string Email, string Phone, string Address, DateTime CreatedAt)>(
                "SELECT Id, FullName, Email, Phone, DefaultAddress AS Address, CreatedAt FROM AspNetUsers")).ToList();

            var products = (await oltpConn.QueryAsync<(int Id, string Name, decimal Price, string CategoryName)>(
                @"SELECT p.Id, p.Name, p.Price, c.Name AS CategoryName 
                  FROM Products p 
                  LEFT JOIN Categories c ON p.CategoryId = c.Id")).ToList();

            var orders = (await oltpConn.QueryAsync<(int Id, string UserId, int Status, decimal TotalAmount, decimal DiscountAmount, DateTime CreatedAt)>(
                "SELECT Id, UserId, ISNULL(Status, 0) AS Status, ISNULL(TotalAmount, 0) AS TotalAmount, ISNULL(DiscountAmount, 0) AS DiscountAmount, CreatedAt FROM Orders WHERE CreatedAt IS NOT NULL")).ToList();

            var orderItems = (await oltpConn.QueryAsync<(int Id, int OrderId, int ProductId, string ProductName, decimal UnitPrice, int Quantity)>(
                "SELECT Id, OrderId, ProductId, ProductName, UnitPrice, Quantity FROM OrderItems")).ToList();

            // 2. Connect to DWH (analytical database)
            using var dwhConn = new SqlConnection(_dwhConnectionString);
            await dwhConn.OpenAsync();

            // ── Clean old DWH data in correct order (Tránh lỗi khóa ngoại) ───
            await dwhConn.ExecuteAsync("DELETE FROM Fact_Sales");
            await dwhConn.ExecuteAsync("DELETE FROM Dim_Customer");
            await dwhConn.ExecuteAsync("DELETE FROM Dim_Product");
            await dwhConn.ExecuteAsync("DELETE FROM Dim_Time");

            // ── A. Bulk Insert Dim_Customer ───────────────────────────
            var customersToInsert = users.Select(u => new {
                Id = u.Id,
                FullName = u.FullName ?? "Unknown",
                Email = u.Email ?? "N/A",
                Phone = u.Phone,
                Address = u.Address,
                CreatedAt = u.CreatedAt
            }).ToList();

            if (customersToInsert.Any())
            {
                await dwhConn.ExecuteAsync(
                    @"INSERT INTO Dim_Customer (CustomerId, FullName, Email, Phone, Address, CreatedAt) 
                      VALUES (@Id, @FullName, @Email, @Phone, @Address, @CreatedAt)", customersToInsert);
            }

            // Ensure dummy customer exists
            await dwhConn.ExecuteAsync(
                "INSERT INTO Dim_Customer (CustomerId, FullName, Email, Phone, Address, City) VALUES ('-1', 'Unknown Guest', 'N/A', 'N/A', 'N/A', 'N/A')");

            // ── B. Bulk Insert Dim_Product ────────────────────────────
            var productsToInsert = products.Select(p => new {
                Id = p.Id,
                ProductName = p.Name,
                CategoryName = p.CategoryName ?? "Uncategorized",
                Price = p.Price,
                Cost = p.Price * 0.7m,
                Status = "Active"
            }).ToList();

            if (productsToInsert.Any())
            {
                await dwhConn.ExecuteAsync(
                    @"INSERT INTO Dim_Product (ProductId, ProductName, CategoryName, Price, Cost, Status) 
                      VALUES (@Id, @ProductName, @CategoryName, @Price, @Cost, @Status)", productsToInsert);
            }

            // ── C. Bulk Insert Dim_Time ───────────────────────────────
            var timesToInsert = new List<(int TimeKey, DateTime FullDate, int Day, int Month, string MonthName, int Quarter, int Year, string DayOfWeek, int IsWeekend)>();
            var seenTimeKeys = new HashSet<int>();

            foreach (var o in orders)
            {
                int timeKey = int.Parse(o.CreatedAt.ToString("yyyyMMdd"));
                if (seenTimeKeys.Add(timeKey))
                {
                    var date = o.CreatedAt.Date;
                    timesToInsert.Add((
                        timeKey,
                        date,
                        date.Day,
                        date.Month,
                        date.ToString("MMMM", System.Globalization.CultureInfo.InvariantCulture),
                        (date.Month - 1) / 3 + 1,
                        date.Year,
                        date.DayOfWeek.ToString(),
                        (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) ? 1 : 0
                    ));
                }
            }

            if (timesToInsert.Any())
            {
                int batchSize = 100;
                for (int i = 0; i < timesToInsert.Count; i += batchSize)
                {
                    var batch = timesToInsert.Skip(i).Take(batchSize).ToList();
                    var sb = new StringBuilder();
                    sb.Append("INSERT INTO Dim_Time (TimeKey, FullDate, Day, Month, MonthName, Quarter, Year, DayOfWeek, IsWeekend) VALUES ");
                    for (int j = 0; j < batch.Count; j++)
                    {
                        var t = batch[j];
                        if (j > 0) sb.Append(", ");
                        sb.Append($"({t.TimeKey}, '{t.FullDate:yyyy-MM-dd}', {t.Day}, {t.Month}, '{t.MonthName.Replace("'", "''")}', {t.Quarter}, {t.Year}, '{t.DayOfWeek}', {t.IsWeekend})");
                    }
                    await dwhConn.ExecuteAsync(sb.ToString());
                }
            }

            // ── D. Bulk Insert Fact_Sales ─────────────────────────────
            // Load key mappings
            var customerMap = (await dwhConn.QueryAsync<(string CustomerId, int CustomerKey)>(
                "SELECT CustomerId, CustomerKey FROM Dim_Customer"))
                .ToDictionary(x => x.CustomerId, x => x.CustomerKey);

            var productMap = (await dwhConn.QueryAsync<(int ProductId, int ProductKey, decimal Cost)>(
                "SELECT ProductId, ProductKey, ISNULL(Cost, 0) AS Cost FROM Dim_Product"))
                .ToDictionary(x => x.ProductId, x => (x.ProductKey, x.Cost));

            var guestCustomerKey = customerMap.TryGetValue("-1", out var gk) ? gk : -1;

            var activeOrders = orders.Where(o => o.Status != 4 && o.Status != 5).ToDictionary(o => o.Id);
            var activeOrderItems = orderItems.Where(oi => activeOrders.ContainsKey(oi.OrderId)).ToList();

            var factsToInsert = new List<(int CustomerKey, int ProductKey, int TimeKey, int OrderId, int OrderDetailId, int Quantity, decimal UnitPrice, decimal DiscountAmount, decimal TotalAmount, decimal Profit)>();

            foreach (var oi in activeOrderItems)
            {
                var o = activeOrders[oi.OrderId];
                int timeKey = int.Parse(o.CreatedAt.ToString("yyyyMMdd"));

                int customerKey = (o.UserId != null && customerMap.TryGetValue(o.UserId, out var ck)) ? ck : guestCustomerKey;
                
                int productKey = -1;
                decimal cost = oi.UnitPrice * 0.7m;
                if (productMap.TryGetValue(oi.ProductId, out var pk))
                {
                    productKey = pk.ProductKey;
                    cost = pk.Cost;
                }

                decimal discountAmount = 0;
                if (o.TotalAmount > 0)
                {
                    discountAmount = Math.Round((oi.Quantity * oi.UnitPrice * o.DiscountAmount) / o.TotalAmount, 2);
                }
                decimal totalAmount = oi.Quantity * oi.UnitPrice;
                decimal profit = totalAmount - discountAmount - (oi.Quantity * cost);

                factsToInsert.Add((customerKey, productKey, timeKey, oi.OrderId, oi.Id, oi.Quantity, oi.UnitPrice, discountAmount, totalAmount, profit));
            }

            if (factsToInsert.Any())
            {
                int batchSize = 400;
                for (int i = 0; i < factsToInsert.Count; i += batchSize)
                {
                    var batch = factsToInsert.Skip(i).Take(batchSize).ToList();
                    var sb = new StringBuilder();
                    sb.Append("INSERT INTO Fact_Sales (CustomerKey, ProductKey, TimeKey, OrderId, OrderDetailId, Quantity, UnitPrice, DiscountAmount, TotalAmount, Profit) VALUES ");
                    
                    for (int j = 0; j < batch.Count; j++)
                    {
                        var f = batch[j];
                        if (j > 0) sb.Append(", ");
                        sb.Append($"({f.CustomerKey}, {f.ProductKey}, {f.TimeKey}, {f.OrderId}, {f.OrderDetailId}, {f.Quantity}, {f.UnitPrice.ToString(System.Globalization.CultureInfo.InvariantCulture)}, {f.DiscountAmount.ToString(System.Globalization.CultureInfo.InvariantCulture)}, {f.TotalAmount.ToString(System.Globalization.CultureInfo.InvariantCulture)}, {f.Profit.ToString(System.Globalization.CultureInfo.InvariantCulture)})");
                    }
                    
                    await dwhConn.ExecuteAsync(sb.ToString());
                }
            }
        }
    }
}
