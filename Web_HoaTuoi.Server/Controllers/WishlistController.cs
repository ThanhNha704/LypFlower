using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.DTOs;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _db;

    public WishlistController(AppDbContext db)
    {
        _db = db;
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    // GET /api/wishlist
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WishlistItemDto>>> GetWishlist()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var items = await _db.WishlistItems
            .Where(w => w.UserId == userId)
            .Include(w => w.Product)
                .ThenInclude(p => p.Category)
            .OrderByDescending(w => w.AddedAt)
            .Select(w => new WishlistItemDto(
                w.Id,
                w.ProductId,
                w.Product.Name,
                w.Product.Slug,
                w.Product.MainImageUrl,
                w.Product.Price,
                w.Product.SalePrice,
                w.Product.IsOnSale,
                w.Product.Stock,
                w.Product.Category != null ? w.Product.Category.Name : null,
                w.AddedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    // GET /api/wishlist/ids
    [HttpGet("ids")]
    public async Task<ActionResult<IEnumerable<int>>> GetWishlistIds()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var ids = await _db.WishlistItems
            .Where(w => w.UserId == userId)
            .Select(w => w.ProductId)
            .ToListAsync();

        return Ok(ids);
    }

    // GET /api/wishlist/check/{productId}
    [HttpGet("check/{productId:int}")]
    public async Task<ActionResult> CheckWishlist(int productId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var exists = await _db.WishlistItems
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

        return Ok(new { isInWishlist = exists });
    }

    // POST /api/wishlist/{productId}
    [HttpPost("{productId:int}")]
    public async Task<ActionResult> AddToWishlist(int productId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var productExists = await _db.Products.AnyAsync(p => p.Id == productId);

        if (!productExists)
            return NotFound(new { message = "Sản phẩm không tồn tại." });

        var exists = await _db.WishlistItems
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

        if (exists)
            return Ok(new
            {
                message = "Sản phẩm đã có trong wishlist.",
                alreadyExists = true
            });

        var item = new WishlistItem
        {
            UserId = userId,
            ProductId = productId,
            AddedAt = DateTime.UtcNow
        };

        _db.WishlistItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã thêm vào wishlist.",
            id = item.Id
        });
    }

    // DELETE /api/wishlist/{productId}
    [HttpDelete("{productId:int}")]
    public async Task<ActionResult> RemoveFromWishlist(int productId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var item = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (item == null)
            return NotFound(new { message = "Sản phẩm không có trong wishlist." });

        _db.WishlistItems.Remove(item);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Đã xóa khỏi wishlist." });
    }

    // POST /api/wishlist/toggle/{productId}
    [HttpPost("toggle/{productId:int}")]
    public async Task<ActionResult> ToggleWishlist(int productId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var productExists = await _db.Products.AnyAsync(p => p.Id == productId);

        if (!productExists)
            return NotFound(new { message = "Sản phẩm không tồn tại." });

        var existing = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (existing != null)
        {
            _db.WishlistItems.Remove(existing);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                isInWishlist = false,
                message = "Đã xóa khỏi wishlist."
            });
        }

        var item = new WishlistItem
        {
            UserId = userId,
            ProductId = productId,
            AddedAt = DateTime.UtcNow
        };

        _db.WishlistItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            isInWishlist = true,
            message = "Đã thêm vào wishlist."
        });
    }
}