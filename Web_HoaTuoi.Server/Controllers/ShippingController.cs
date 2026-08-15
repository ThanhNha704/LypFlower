using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShippingController : ControllerBase
{
    private readonly AppDbContext _context;

    public ShippingController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Shipping
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingZone>>> GetShippingZones()
    {
        return await _context.ShippingZones.Where(s => s.IsActive).ToListAsync();
    }

    // GET: api/Shipping/all
    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<ShippingZone>>> GetAllShippingZones()
    {
        return await _context.ShippingZones.ToListAsync();
    }

    // POST: api/Shipping
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ShippingZone>> PostShippingZone(ShippingZone zone)
    {
        _context.ShippingZones.Add(zone);
        await _context.SaveChangesAsync();
        return CreatedAtAction("GetShippingZones", new { id = zone.Id }, zone);
    }

    // PUT: api/Shipping/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutShippingZone(int id, ShippingZone zone)
    {
        if (id != zone.Id) return BadRequest();
        _context.Entry(zone).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/Shipping/5
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteShippingZone(int id)
    {
        var zone = await _context.ShippingZones.FindAsync(id);
        if (zone == null) return NotFound();

        _context.ShippingZones.Remove(zone);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
