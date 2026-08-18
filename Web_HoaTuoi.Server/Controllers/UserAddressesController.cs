using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserAddressesController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserAddressesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserAddress>>> GetAddresses()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var addrs = await _db.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(addrs);
    }

    [HttpPost]
    public async Task<ActionResult<UserAddress>> CreateAddress([FromBody] CreateAddressDto req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var isFirst = !await _db.UserAddresses.AnyAsync(a => a.UserId == userId);

        var addr = new UserAddress
        {
            UserId = userId,
            FullName = req.FullName,
            PhoneNumber = req.PhoneNumber,
            AddressLine = req.AddressLine,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            IsDefault = isFirst || req.IsDefault,
            CreatedAt = DateTime.UtcNow
        };

        if (addr.IsDefault)
        {
            await ResetDefaultAddress(userId);
        }

        _db.UserAddresses.Add(addr);
        await _db.SaveChangesAsync();

        return Ok(addr);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var addr = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (addr == null) return NotFound();

        _db.UserAddresses.Remove(addr);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/default")]
    public async Task<IActionResult> SetDefault(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var addr = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (addr == null) return NotFound();

        await ResetDefaultAddress(userId);

        addr.IsDefault = true;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task ResetDefaultAddress(string userId)
    {
        var existingDefaults = await _db.UserAddresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
        foreach (var ex in existingDefaults)
        {
            ex.IsDefault = false;
        }
    }
}

public record CreateAddressDto(string FullName, string PhoneNumber, string AddressLine, bool IsDefault, double? Latitude, double? Longitude);
