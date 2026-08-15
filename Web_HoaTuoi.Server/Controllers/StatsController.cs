using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StatsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboardStats()
    {
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        // Doanh thu
        var revenueToday = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed && o.CreatedAt.Date == today)
            .SumAsync(o => o.FinalAmount);

        var revenueMonth = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed && o.CreatedAt >= startOfMonth)
            .SumAsync(o => o.FinalAmount);

        // Số đơn hàng (mới trong hôm nay hoặc tháng, tùy logic. Trả về tổng đơn đang hoạt động hoặc tổng đơn)
        var newOrdersCount = await _context.Orders
            .CountAsync(o => o.CreatedAt.Date == today);

        var totalOrdersMonth = await _context.Orders
            .CountAsync(o => o.CreatedAt >= startOfMonth);

        // Sản phẩm bán chạy (nhóm theo OrderItems)
        var topProducts = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order != null && oi.Order.Status == OrderStatus.Completed)
            .GroupBy(oi => new { oi.ProductId, oi.ProductName, oi.ProductImage })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                MainImageUrl = g.Key.ProductImage,
                TotalSold = g.Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(oi => oi.Quantity * oi.UnitPrice)
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(5)
            .ToListAsync();

        // Khách hàng mới (trong tháng)
        // Hiện tại Auth dùng ASP.NET Identity, ta phải lấy từ bảng Users (hoặc thông qua đơn hàng)
        // Vì đơn hàng có UserId hoặc Email:
        var newUsersCount = await _context.Users
            .CountAsync(); // Để đơn giản, trả về tổng số User (nếu bảng có CreatedAt thì filter theo tháng)

        return Ok(new
        {
            RevenueToday = revenueToday,
            RevenueMonth = revenueMonth,
            NewOrdersToday = newOrdersCount,
            TotalOrdersMonth = totalOrdersMonth,
            TopProducts = topProducts,
            TotalUsers = newUsersCount
        });
    }

    [HttpGet("revenue-chart")]
    public async Task<ActionResult> GetRevenueChart([FromQuery] string type = "week")
    {
        var now = DateTime.UtcNow;
        var query = _context.Orders.Where(o => o.Status == OrderStatus.Completed);

        if (type == "week")
        {
            var start = now.Date.AddDays(-6);
            var orders = await query.Where(o => o.CreatedAt >= start).ToListAsync();
            var grouped = orders.GroupBy(o => o.CreatedAt.Date)
                .Select(g => new { Label = g.Key.ToString("dd/MM"), Revenue = g.Sum(o => o.FinalAmount) })
                .ToList();

            // Lấp đầy ngày trống
            var result = Enumerable.Range(0, 7)
                .Select(i => start.AddDays(i))
                .Select(d => new
                {
                    Label = d.ToString("dd/MM"),
                    Revenue = grouped.FirstOrDefault(g => g.Label == d.ToString("dd/MM"))?.Revenue ?? 0
                }).ToList();
            return Ok(result);
        }
        else if (type == "month")
        {
            var start = new DateTime(now.Year, now.Month, 1);
            var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
            var orders = await query.Where(o => o.CreatedAt >= start).ToListAsync();
            var grouped = orders.GroupBy(o => o.CreatedAt.Date)
                .Select(g => new { Label = g.Key.ToString("dd/MM"), Revenue = g.Sum(o => o.FinalAmount) })
                .ToList();

            var result = Enumerable.Range(1, daysInMonth)
                .Select(day => new DateTime(now.Year, now.Month, day))
                .Select(d => new
                {
                    Label = d.ToString("dd/MM"),
                    Revenue = grouped.FirstOrDefault(g => g.Label == d.ToString("dd/MM"))?.Revenue ?? 0
                }).ToList();
            return Ok(result);
        }
        else // year
        {
            var start = new DateTime(now.Year, 1, 1);
            var orders = await query.Where(o => o.CreatedAt >= start).ToListAsync();
            var grouped = orders.GroupBy(o => o.CreatedAt.Month)
                .Select(g => new { Label = $"Tháng {g.Key}", Revenue = g.Sum(o => o.FinalAmount) })
                .ToList();

            var result = Enumerable.Range(1, 12)
                .Select(month => new
                {
                    Label = $"Tháng {month}",
                    Revenue = grouped.FirstOrDefault(g => g.Label == $"Tháng {month}")?.Revenue ?? 0
                }).ToList();
            return Ok(result);
        }
    }

    [HttpGet("top-customers")]
    public async Task<ActionResult> GetTopCustomers()
    {
        var stats = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed && o.UserId != null)
            .GroupBy(o => o.UserId)
            .Select(g => new
            {
                UserId = g.Key!,
                TotalOrders = g.Count(),
                TotalSpent = g.Sum(o => o.FinalAmount)
            })
            .OrderByDescending(x => x.TotalSpent)
            .Take(5)
            .ToListAsync();

        var userIds = stats.Select(s => s.UserId).ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        var result = stats.Select(s => new
        {
            FullName = users.ContainsKey(s.UserId) ? users[s.UserId].FullName : "Khách hàng",
            Email = users.ContainsKey(s.UserId) ? users[s.UserId].Email : null,
            PhoneNumber = users.ContainsKey(s.UserId) ? users[s.UserId].PhoneNumber : null,
            s.TotalOrders,
            s.TotalSpent
        });

        return Ok(result);
    }
}
