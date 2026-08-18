using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SettingsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Settings
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemSetting>>> GetSettings()
    {
        return await _context.SystemSettings.ToListAsync();
    }

    // PUT: api/Settings/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutSetting(int id, SystemSetting setting)
    {
        if (id != setting.Id)
        {
            return BadRequest();
        }

        setting.UpdatedAt = DateTime.UtcNow;
        _context.Entry(setting).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!SettingExists(id)) return NotFound();
            else throw;
        }

        return NoContent();
    }

    private bool SettingExists(int id)
    {
        return _context.SystemSettings.Any(e => e.Id == id);
    }
}
