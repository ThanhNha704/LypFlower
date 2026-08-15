using System.Data;
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

            // ── A. Sync Dim_Customer ───────────────────────────────────
            foreach (var u in users)
            {
                var customerKey = await dwhConn.ExecuteScalarAsync<int?>(
                    "SELECT CustomerKey FROM Dim_Customer WHERE CustomerId = @Id", new { Id = u.Id });

                var param = new {
                    Id = u.Id,
                    FullName = u.FullName ?? "Unknown",
                    Email = u.Email ?? "N/A",
                    Phone = u.Phone,
                    Address = u.Address,
                    CreatedAt = u.CreatedAt
                };

                if (customerKey.HasValue)
                {
                    await dwhConn.ExecuteAsync(
                        @"UPDATE Dim_Customer SET FullName = @FullName, Email = @Email, Phone = @Phone, Address = @Address 
                          WHERE CustomerKey = @CustomerKey", 
                        new { CustomerKey = customerKey.Value, FullName = param.FullName, Email = param.Email, Phone = param.Phone, Address = param.Address });
                }
                else
                {
                    await dwhConn.ExecuteAsync(
                        @"INSERT INTO Dim_Customer (CustomerId, FullName, Email, Phone, Address, CreatedAt) 
                          VALUES (@Id, @FullName, @Email, @Phone, @Address, @CreatedAt)", param);
                }
            }

            // Ensure dummy customer exists
            var hasDummy = await dwhConn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Dim_Customer WHERE CustomerId = '-1'");
            if (hasDummy == 0)
            {
                await dwhConn.ExecuteAsync(
                    "INSERT INTO Dim_Customer (CustomerId, FullName, Email, Phone, Address, City) VALUES ('-1', 'Unknown Guest', 'N/A', 'N/A', 'N/A', 'N/A')");
            }

            // ── B. Sync Dim_Product ────────────────────────────────────
            foreach (var p in products)
            {
                var productKey = await dwhConn.ExecuteScalarAsync<int?>(
                    "SELECT ProductKey FROM Dim_Product WHERE ProductId = @Id", new { Id = p.Id });

                var param = new {
                    Id = p.Id,
                    ProductName = p.Name,
                    CategoryName = p.CategoryName ?? "Uncategorized",
                    Price = p.Price,
                    Cost = p.Price * 0.7m,
                    Status = "Active"
                };

                if (productKey.HasValue)
                {
                    await dwhConn.ExecuteAsync(
                        @"UPDATE Dim_Product SET ProductName = @ProductName, CategoryName = @CategoryName, Price = @Price 
                          WHERE ProductKey = @ProductKey", 
                        new { ProductKey = productKey.Value, ProductName = param.ProductName, CategoryName = param.CategoryName, Price = param.Price });
                }
                else
                {
                    await dwhConn.ExecuteAsync(
                        @"INSERT INTO Dim_Product (ProductId, ProductName, CategoryName, Price, Cost, Status) 
                          VALUES (@Id, @ProductName, @CategoryName, @Price, @Cost, @Status)", param);
                }
            }

            // ── C. Sync Dim_Time ───────────────────────────────────────
            var orderDates = orders.Select(o => o.CreatedAt.Date).Distinct().ToList();
            foreach (var date in orderDates)
            {
                int timeKey = int.Parse(date.ToString("yyyyMMdd"));
                var timeExists = await dwhConn.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM Dim_Time WHERE TimeKey = @TimeKey", new { TimeKey = timeKey });

                if (timeExists == 0)
                {
                    var param = new {
                        TimeKey = timeKey,
                        FullDate = date,
                        Day = date.Day,
                        Month = date.Month,
                        MonthName = date.ToString("MMMM", System.Globalization.CultureInfo.InvariantCulture),
                        Quarter = (date.Month - 1) / 3 + 1,
                        Year = date.Year,
                        DayOfWeek = date.DayOfWeek.ToString(),
                        IsWeekend = (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) ? 1 : 0
                    };
                    await dwhConn.ExecuteAsync(
                        @"INSERT INTO Dim_Time (TimeKey, FullDate, Day, Month, MonthName, Quarter, Year, DayOfWeek, IsWeekend) 
                          VALUES (@TimeKey, @FullDate, @Day, @Month, @MonthName, @Quarter, @Year, @DayOfWeek, @IsWeekend)", param);
                }
            }

            // ── D. Sync Fact_Sales ─────────────────────────────────────
            var customerMap = (await dwhConn.QueryAsync<(string CustomerId, int CustomerKey)>(
                "SELECT CustomerId, CustomerKey FROM Dim_Customer")).ToDictionary(x => x.CustomerId, x => x.CustomerKey);

            var productMap = (await dwhConn.QueryAsync<(int ProductId, int ProductKey, decimal Cost)>(
                "SELECT ProductId, ProductKey, ISNULL(Cost, 0) AS Cost FROM Dim_Product")).ToDictionary(x => x.ProductId, x => (x.ProductKey, x.Cost));

            var guestCustomerKey = customerMap.TryGetValue("-1", out var gk) ? gk : -1;

            var activeOrders = orders.Where(o => o.Status != 4 && o.Status != 5).ToDictionary(o => o.Id);
            var activeOrderItems = orderItems.Where(oi => activeOrders.ContainsKey(oi.OrderId)).ToList();

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

                var factExists = await dwhConn.ExecuteScalarAsync<int?>(
                    "SELECT SalesKey FROM Fact_Sales WHERE OrderId = @OrderId AND OrderDetailId = @OrderDetailId", 
                    new { OrderId = oi.OrderId, OrderDetailId = oi.Id });

                var param = new {
                    CustomerKey = customerKey,
                    ProductKey = productKey,
                    TimeKey = timeKey,
                    OrderId = oi.OrderId,
                    OrderDetailId = oi.Id,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    DiscountAmount = discountAmount,
                    TotalAmount = totalAmount,
                    Profit = profit
                };

                if (factExists.HasValue)
                {
                    await dwhConn.ExecuteAsync(
                        @"UPDATE Fact_Sales SET 
                            CustomerKey = @CustomerKey, ProductKey = @ProductKey, TimeKey = @TimeKey, 
                            Quantity = @Quantity, UnitPrice = @UnitPrice, DiscountAmount = @DiscountAmount, 
                            TotalAmount = @TotalAmount, Profit = @Profit 
                          WHERE SalesKey = @SalesKey", 
                        new { SalesKey = factExists.Value, CustomerKey = param.CustomerKey, ProductKey = param.ProductKey, TimeKey = param.TimeKey, Quantity = param.Quantity, UnitPrice = param.UnitPrice, DiscountAmount = param.DiscountAmount, TotalAmount = param.TotalAmount, Profit = param.Profit });
                }
                else
                {
                    await dwhConn.ExecuteAsync(
                        @"INSERT INTO Fact_Sales (CustomerKey, ProductKey, TimeKey, OrderId, OrderDetailId, Quantity, UnitPrice, DiscountAmount, TotalAmount, Profit) 
                          VALUES (@CustomerKey, @ProductKey, @TimeKey, @OrderId, @OrderDetailId, @Quantity, @UnitPrice, @DiscountAmount, @TotalAmount, @Profit)", param);
                }
            }

            // Remove cancelled/refunded order items from DWH
            var cancelledOrderIds = orders.Where(o => o.Status == 4 || o.Status == 5).Select(o => o.Id).ToList();
            if (cancelledOrderIds.Any())
            {
                await dwhConn.ExecuteAsync("DELETE FROM Fact_Sales WHERE OrderId IN @Ids", new { Ids = cancelledOrderIds });
            }
        }
    }
}
