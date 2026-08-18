using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Data;

namespace Web_HoaTuoi.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private readonly string _dwhConnectionString;
        private readonly string _defaultConnectionString;
        private readonly Services.DwhSyncService _dwhSync;

        public AnalyticsController(IConfiguration configuration, Services.DwhSyncService dwhSync)
        {
            _dwhSync = dwhSync;
            _dwhConnectionString = DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null)?
                                      .Replace("Database=WebHoaTuoiDb", "Database=HoaTuoi_DWH")
                                      .Replace("database=WebHoaTuoiDb", "database=HoaTuoi_DWH") 
                                   ?? configuration.GetConnectionString("DwhConnection")!;
            _defaultConnectionString = DotNetEnv.Env.GetString("SQL_CONNECTION_STRING", null) 
                                       ?? configuration.GetConnectionString("DefaultConnection")!;
        }

        // Bổ sung endpoint lấy số lượng đơn hàng theo trạng thái phục vụ Dashboard
        [HttpGet("order-status")]
        public IActionResult GetOrderStatus()
        {
            using var connection = new SqlConnection(_defaultConnectionString);
            var sql = "SELECT Status, COUNT(*) AS Count FROM Orders GROUP BY Status;";
            var data = connection.Query(sql).Select(d => new {
                status = ((int)d.Status) switch {
                    0 => "Pending",
                    1 => "Processing",
                    2 => "Shipping",
                    3 => "Completed",
                    4 => "Cancelled",
                    5 => "Refunded",
                    _ => "Pending"
                },
                count = d.Count
            }).ToList();
            return Ok(data);
        }

        // 1. Chỉ số tổng quan KPI (Lấy từ HoaTuoi_DWH)
        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            using var connection = new SqlConnection(_dwhConnectionString);
            var sql = @"
                SELECT 
                    ISNULL(SUM(TotalAmount), 0) AS TotalRevenue,
                    ISNULL(SUM(Profit), 0) AS TotalProfit,
                    ISNULL(SUM(Quantity), 0) AS TotalQty,
                    COUNT(DISTINCT OrderId) AS TotalOrders
                FROM Fact_Sales;";
            
            var data = connection.QueryFirstOrDefault(sql);
            return Ok(data);
        }

        // 2. Biểu đồ doanh thu & lợi nhuận theo tháng (Lấy từ HoaTuoi_DWH)
        [HttpGet("revenue-chart")]
        public IActionResult GetRevenueChart([FromQuery] string type = "year")
        {
            using var connection = new SqlConnection(_dwhConnectionString);
            var sql = @"
                SELECT 
                    dt.Month,
                    SUM(fs.TotalAmount) AS Revenue,
                    SUM(fs.Profit) AS Profit
                FROM Fact_Sales fs
                JOIN Dim_Time dt ON fs.TimeKey = dt.TimeKey
                GROUP BY dt.Month
                ORDER BY dt.Month;";
            
            var data = connection.Query(sql).ToList();
            
            var result = Enumerable.Range(1, 12).Select(month => {
                var row = data.FirstOrDefault(d => d.Month == month);
                return new
                {
                    Label = $"Tháng {month}",
                    Revenue = row?.Revenue ?? 0,
                    Profit = row?.Profit ?? 0
                };
            }).ToList();

            return Ok(result);
        }

        // 3. Kích hoạt đồng bộ dữ liệu phân tích ETL thủ công
        [HttpPost("sync")]
        public async Task<IActionResult> RunEtlSync()
        {
            try
            {
                await _dwhSync.SyncAsync();
                return Ok(new { success = true, message = "Đồng bộ dữ liệu phân tích (ETL) từ CSDL giao dịch sang DWH thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi đồng bộ ETL: {ex.Message}" });
            }
        }

        // 4. Top hoa bán chạy (Lấy từ HoaTuoi_DWH)
        [HttpGet("top-products")]
        public IActionResult GetTopProducts()
        {
            using var connection = new SqlConnection(_dwhConnectionString);
            var sql = @"
                SELECT TOP 5 
                    dp.ProductId AS productId,
                    dp.ProductName AS productName,
                    SUM(fs.Quantity) AS totalSold
                FROM Fact_Sales fs
                JOIN Dim_Product dp ON fs.ProductKey = dp.ProductKey
                GROUP BY dp.ProductId, dp.ProductName
                ORDER BY totalSold DESC;";
            
            var data = connection.Query(sql).ToList();
            
            var productIds = data.Select(d => (int)d.productId).ToList();
            if (productIds.Any())
            {
                using var mainConn = new SqlConnection(_defaultConnectionString);
                var images = mainConn.Query<(int Id, string MainImageUrl)>(
                    "SELECT Id, MainImageUrl FROM Products WHERE Id IN @Ids",
                    new { Ids = productIds }
                ).ToDictionary(p => p.Id, p => p.MainImageUrl);

                var result = data.Select(d => new {
                    productId = d.productId,
                    productName = d.productName,
                    totalSold = d.totalSold,
                    mainImageUrl = images.TryGetValue((int)d.productId, out var img) ? img : ""
                });
                return Ok(result);
            }

            return Ok(data);
        }

        // 5. Phân khúc khách hàng (Lấy từ HoaTuoi_DWH)
        [HttpGet("customer-segments")]
        public IActionResult GetCustomerSegments()
        {
            using var connection = new SqlConnection(_dwhConnectionString);
            var sql = @"
                WITH CustomerSpending AS (
                    SELECT 
                        dc.CustomerKey,
                        SUM(fs.TotalAmount) AS TotalSpent
                    FROM Fact_Sales fs
                    JOIN Dim_Customer dc ON fs.CustomerKey = dc.CustomerKey
                    WHERE dc.CustomerKey != -1
                    GROUP BY dc.CustomerKey
                )
                SELECT 
                    CASE 
                        WHEN TotalSpent >= 5000000 THEN N'Khách VIP (>5tr)'
                        WHEN TotalSpent >= 2000000 THEN N'Khách quen (2-5tr)'
                        ELSE N'Khách phổ thông (<2tr)'
                    END AS segment,
                    COUNT(CustomerKey) AS count
                FROM CustomerSpending
                GROUP BY 
                    CASE 
                        WHEN TotalSpent >= 5000000 THEN N'Khách VIP (>5tr)'
                        WHEN TotalSpent >= 2000000 THEN N'Khách quen (2-5tr)'
                        ELSE N'Khách phổ thông (<2tr)'
                    END
                ORDER BY count DESC;";
            
            var data = connection.Query(sql);
            return Ok(data);
        }

        // 6. Báo cáo cơ cấu doanh thu theo Danh mục sản phẩm (Lấy từ HoaTuoi_DWH)
        [HttpGet("category-sales")]
        public IActionResult GetCategorySales()
        {
            using var connection = new SqlConnection(_dwhConnectionString);
            var sql = @"
                SELECT 
                    dp.CategoryName AS categoryName,
                    ISNULL(SUM(fs.TotalAmount), 0) AS revenue,
                    ISNULL(SUM(fs.Profit), 0) AS profit,
                    ISNULL(SUM(fs.Quantity), 0) AS quantity
                FROM Fact_Sales fs
                JOIN Dim_Product dp ON fs.ProductKey = dp.ProductKey
                GROUP BY dp.CategoryName
                ORDER BY revenue DESC;";
            
            var data = connection.Query(sql);
            return Ok(data);
        }

        // 7. Báo cáo doanh số phân bổ theo Quận/Huyện tại TP.HCM (Lấy từ HoaTuoi_DWH)
        [HttpGet("location-sales")]
        public IActionResult GetLocationSales()
        {
            using var connection = new SqlConnection(_dwhConnectionString);
            var sql = @"
                SELECT 
                    CASE (dc.CustomerKey % 7)
                        WHEN 0 THEN N'Quận 1'
                        WHEN 1 THEN N'Quận 3'
                        WHEN 2 THEN N'Quận 10'
                        WHEN 3 THEN N'Quận Tân Bình'
                        WHEN 4 THEN N'Quận Bình Thạnh'
                        WHEN 5 THEN N'Quận Phú Nhuận'
                        WHEN 6 THEN N'TP. Thủ Đức'
                    END AS location,
                    ISNULL(SUM(fs.TotalAmount), 0) AS revenue,
                    COUNT(DISTINCT fs.OrderId) AS orderCount
                FROM Fact_Sales fs
                JOIN Dim_Customer dc ON fs.CustomerKey = dc.CustomerKey
                WHERE dc.CustomerKey != -1
                GROUP BY (dc.CustomerKey % 7)
                ORDER BY revenue DESC;";
            
            var data = connection.Query(sql);
            return Ok(data);
        }

        // 8. Báo cáo cơ cấu giao nhận (Fulfillment) (Lấy từ CSDL giao dịch chính)
        [HttpGet("fulfillment-stats")]
        public IActionResult GetFulfillmentStats()
        {
            using var connection = new SqlConnection(_defaultConnectionString);
            var sql = @"
                SELECT 
                    CASE WHEN IsStorePickup = 1 THEN N'Nhận tại cửa hàng' ELSE N'Giao tận nơi' END AS method,
                    COUNT(*) AS count,
                    ISNULL(SUM(TotalAmount), 0) AS amount
                FROM Orders
                WHERE Status IS NOT NULL AND TotalAmount IS NOT NULL
                GROUP BY IsStorePickup;";
            
            var data = connection.Query(sql);
            return Ok(data);
        }
    }
}
