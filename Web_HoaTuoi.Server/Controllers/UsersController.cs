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
        [FromQuery] string? search = null,
        [FromQuery] string? role = null)
    {
        var query = _userManager.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(u => 
                (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                (u.Email != null && u.Email.ToLower().Contains(s)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(s))
            );
        }

        if (!string.IsNullOrEmpty(role))
        {
            if (role.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                var nonCustomerUserIds = from ur in _context.UserRoles
                                         join r in _context.Roles on ur.RoleId equals r.Id
                                         where r.Name == "Admin" || r.Name == "Staff"
                                         select ur.UserId;

                query = query.Where(u => !nonCustomerUserIds.Contains(u.Id));
            }
            else
            {
                query = from u in query
                        join ur in _context.UserRoles on u.Id equals ur.UserId
                        join r in _context.Roles on ur.RoleId equals r.Id
                        where r.Name == role
                        select u;
            }
        }

        var total = await query.CountAsync();
        
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
                // Trả về trạng thái thực: bị khóa nếu LockoutEnd > hiện tại
                IsActive = !(u.LockoutEnd.HasValue && u.LockoutEnd.Value > DateTimeOffset.UtcNow)
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

        // N+1 Query Fix: Lấy roles của toàn bộ users được trả về trong 1 query duy nhất
        var rolesList = await (from ur in _context.UserRoles
                               join r in _context.Roles on ur.RoleId equals r.Id
                               where userIds.Contains(ur.UserId)
                               select new { ur.UserId, RoleName = r.Name })
                              .ToListAsync();

        var userRoles = rolesList
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.First().RoleName ?? "Customer");

        var result = users.Select(u => new
        {
            u.Id,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            u.CreatedAt,
            u.IsActive,
            Role = userRoles.GetValueOrDefault(u.Id ?? "", "Customer"),
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

    public class ChangeRoleRequest
    {
        public string Role { get; set; } = null!;
    }

    // PUT /api/users/{id}/role  — Chỉ Admin mới được đổi quyền
    [HttpPut("{id}/role")]
    public async Task<ActionResult> ChangeRole(string id, [FromBody] ChangeRoleRequest req)
    {
        var validRoles = new[] { "Customer", "Staff", "Admin" };
        if (!validRoles.Contains(req.Role))
            return BadRequest(new { message = "Vai trò không hợp lệ. Chỉ chấp nhận: Customer, Staff, Admin." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

        // Không cho tự hạ quyền chính mình
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (user.Id == currentUserId && req.Role != "Admin")
            return BadRequest(new { message = "Bạn không thể tự hạ quyền của chính mình." });

        // Đảm bảo role tồn tại
        foreach (var role in validRoles)
        {
            if (!await _context.Roles.AnyAsync(r => r.Name == role))
            {
                _context.Roles.Add(new IdentityRole(role));
            }
        }
        await _context.SaveChangesAsync();

        // Xóa tất cả roles cũ và gán role mới
        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, req.Role);

        return Ok(new { message = $"Đã chuyển {user.FullName ?? user.Email} sang vai trò {req.Role}." });
    }

    // PUT /api/users/{id}/toggle-active  — Khóa/Mở khóa tài khoản
    [HttpPut("{id}/toggle-active")]
    public async Task<ActionResult> ToggleActive(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

        // Không cho khóa chính mình
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (user.Id == currentUserId)
            return BadRequest(new { message = "Bạn không thể khóa tài khoản của chính mình." });

        bool isCurrentlyLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;
        if (isCurrentlyLocked)
        {
            // Mở khóa
            await _userManager.SetLockoutEndDateAsync(user, null);
            return Ok(new { message = $"Đã mở khóa tài khoản {user.FullName ?? user.Email}.", isActive = true });
        }
        else
        {
            // Khóa đến năm 2099
            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(73));
            return Ok(new { message = $"Đã khóa tài khoản {user.FullName ?? user.Email}.", isActive = false });
        }
    }
}
