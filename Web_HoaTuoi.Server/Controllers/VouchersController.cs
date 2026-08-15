using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VouchersController : ControllerBase
{
    private readonly AppDbContext _context;

    public VouchersController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Vouchers
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Voucher>>> GetVouchers()
    {
        return await _context.Vouchers.OrderByDescending(v => v.CreatedAt).ToListAsync();
    }

    // GET: api/Vouchers/check?code=XYZ
    [HttpGet("check")]
    public async Task<ActionResult<Voucher>> CheckVoucher(string code)
    {
        var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code.ToUpper() == code.ToUpper());

        if (voucher == null) return NotFound(new { message = "Mã giảm giá không tồn tại" });
        if (!voucher.IsActive) return BadRequest(new { message = "Mã giảm giá đã bị khóa" });
        if (voucher.ValidUntil < DateTime.UtcNow) return BadRequest(new { message = "Mã giảm giá đã hết hạn" });
        if (voucher.UsedCount >= voucher.UsageLimit) return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng" });

        return voucher;
    }

    // POST: api/Vouchers
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Voucher>> PostVoucher(Voucher voucher)
    {
        voucher.Code = voucher.Code.ToUpper();
        if (await _context.Vouchers.AnyAsync(v => v.Code == voucher.Code))
        {
            return Conflict(new { message = "Mã giảm giá này đã tồn tại" });
        }

        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync();
        return CreatedAtAction("GetVouchers", new { id = voucher.Id }, voucher);
    }

    // PUT: api/Vouchers/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutVoucher(int id, Voucher voucher)
    {
        if (id != voucher.Id) return BadRequest();
        _context.Entry(voucher).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/Vouchers/5
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoucher(int id)
    {
        var voucher = await _context.Vouchers.FindAsync(id);
        if (voucher == null) return NotFound();

        _context.Vouchers.Remove(voucher);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
