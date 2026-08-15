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
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReviewsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/reviews/product/{productId}
    [HttpGet("product/{productId:int}")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetProductReviews(int productId)
    {
        var reviews = await _db.Reviews
            .Include(r => r.User)
            .Include(r => r.Images)
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(
                r.Id,
                r.User != null ? r.User.FullName : "Khách hàng",
                r.User != null ? r.User.AvatarUrl : null,
                r.Rating,
                r.Comment,
                r.Images.Select(img => img.Url),
                r.AdminReply,
                r.CreatedAt
            ))
            .ToListAsync();

        return Ok(reviews);
    }

    // POST /api/reviews
    [HttpPost]
    [Authorize]
    public async Task<ActionResult> CreateReview([FromBody] CreateReviewRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Kiểm tra xem đã mua hàng chưa (optional: can be enforced)
        var hasPurchased = await _db.Orders
            .AnyAsync(o => o.UserId == userId && o.Items.Any(i => i.ProductId == req.ProductId));

        var review = new Review
            {
            ProductId = req.ProductId,
            UserId = userId,
            Rating = req.Rating,
            Comment = req.Comment,
            IsApproved = true, // Tạm thời tự động duyệt hoặc để false nếu cần admin duyệt
            IsVerifiedPurchase = hasPurchased,
            CreatedAt = DateTime.UtcNow
        };

        if (req.ImageBase64List != null && req.ImageBase64List.Any())
        {
            var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var uploadsFolder = Path.Combine(env.WebRootPath, "uploads", "reviews");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            foreach (var base64 in req.ImageBase64List)
            {
                try
                {
                    // Remove data:image/...;base64, prefix if present
                    var base64Data = base64;
                    if (base64.Contains(","))
                    {
                        base64Data = base64.Split(',')[1];
                    }

                    var bytes = Convert.FromBase64String(base64Data);
                    var fileName = $"{Guid.NewGuid()}.jpg";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    await System.IO.File.WriteAllBytesAsync(filePath, bytes);

                    review.Images.Add(new ReviewImage { Url = $"/uploads/reviews/{fileName}" });
                }
                catch
                {
                    // Ignore invalid images or log error
                }
            }
        }

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Cảm ơn bạn đã đánh giá!" });
    }

    // GET /api/reviews/shop-stats
    [HttpGet("shop-stats")]
    public async Task<ActionResult> GetShopStats()
    {
        var stats = await _db.Reviews
            .Where(r => r.IsApproved)
            .GroupBy(r => 1)
            .Select(g => new
            {
                AverageRating = g.Average(r => (double)r.Rating),
                TotalReviews = g.Count(),
                TotalSold = _db.Products.Sum(p => p.SoldCount)
            })
            .FirstOrDefaultAsync();

        if (stats == null)
        {
            return Ok(new { AverageRating = 5.0, TotalReviews = 0, TotalSold = _db.Products.Sum(p => p.SoldCount) });
        }

        return Ok(stats);
    }

    // --- Admin Endpoints ---

    // GET /api/reviews
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetAllReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] bool? approved = null)
    {
        var query = _db.Reviews.Include(r => r.User).Include(r => r.Images).AsQueryable();

        if (approved.HasValue)
        {
            query = query.Where(r => r.IsApproved == approved.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.ProductId,
                UserName = r.User != null ? r.User.FullName : "Khách hàng",
                r.Rating,
                r.Comment,
                r.IsApproved,
                r.AdminReply,
                Images = r.Images.Select(i => i.Url),
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(new { total, items });
    }

    // PUT /api/reviews/{id}/approve
    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ApproveReview(int id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        review.IsApproved = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/reviews/{id}/hide
    [HttpPut("{id:int}/hide")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> HideReview(int id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        review.IsApproved = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/reviews/{id}/reply
    [HttpPut("{id:int}/reply")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ReplyToReview(int id, [FromBody] ReplyRequest req)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        review.AdminReply = req.Reply;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/reviews/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteReview(int id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class ReplyRequest
{
    public string Reply { get; set; } = string.Empty;
}
