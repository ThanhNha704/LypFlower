using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public UsersController(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(u => 
                (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                (u.Email != null && u.Email.ToLower().Contains(s)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(s))
            );
        }

        var total = await query.CountAsync();
        
        // Fetch order stats manually to avoid complex GroupBy
        var users = await query
            .OrderByDescending(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                u.CreatedAt,
                IsActive = true
            })
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();
        
        var orderStatsQuery = await _context.Orders
            .Where(o => userIds.Contains(o.UserId))
            .GroupBy(o => o.UserId)
            .Select(g => new
            {
                UserId = g.Key ?? "",
                TotalOrders = g.Count(),
                TotalSpent = g.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.FinalAmount)
            })
            .ToListAsync();

        var orderStats = orderStatsQuery.ToDictionary(x => x.UserId);

        var result = users.Select(u => new
        {
            u.Id,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            u.CreatedAt,
            u.IsActive,
            TotalOrders = orderStats.ContainsKey(u.Id ?? "") ? orderStats[u.Id ?? ""].TotalOrders : 0,
            TotalSpent = orderStats.ContainsKey(u.Id ?? "") ? orderStats[u.Id ?? ""].TotalSpent : 0
        });

        return Ok(new { total, items = result });
    }

    public class CreateStaffRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
    }

    [HttpPost("staff")]
    public async Task<ActionResult> CreateStaff([FromBody] CreateStaffRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email và Mật khẩu không được để trống." });

        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null) return BadRequest(new { message = "Email đã tồn tại." });

        var user = new AppUser
        {
            UserName = req.Email,
            Email = req.Email,
            FullName = req.FullName,
            Phone = req.Phone,
            PhoneNumber = req.Phone,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        if (!await _context.Roles.AnyAsync(r => r.Name == "Staff"))
        {
            _context.Roles.Add(new IdentityRole("Staff"));
            await _context.SaveChangesAsync();
        }

        await _userManager.AddToRoleAsync(user, "Staff");

        return Ok(new { message = "Tạo tài khoản nhân viên thành công." });
    }
}
