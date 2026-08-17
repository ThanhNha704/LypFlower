using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.DTOs;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;

namespace Web_HoaTuoi.Server.Controllers;

/// <summary>
/// GET /api/categories          — Danh sách tất cả danh mục (kèm số sản phẩm)
/// GET /api/categories/{slug}   — Chi tiết danh mục + sản phẩm con (paged)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICloudinaryService _cloudinary;

    public CategoriesController(AppDbContext db, ICloudinaryService cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    // POST /api/categories/upload-image
    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không nhận được file ảnh." });

        try
        {
            var url = await _cloudinary.UploadAsync(file, "hoatuoi/categories");
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Upload ảnh thất bại: {ex.Message}" });
        }
    }

    // GET /api/categories
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var cats = await _db.Categories
       .Where(c => c.IsActive && c.ParentCategoryId == null)
            .OrderBy(c => c.SortOrder)
  .Select(c => new CategoryDto(
    c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.Icon, c.SortOrder,
    c.Products.Count(p => p.IsActive)
            ))
    .ToListAsync();

        return Ok(cats);
    }

    // GET /api/categories/{slug}
    [HttpGet("{slug}")]
    public async Task<ActionResult<CategoryDto>> GetBySlug(string slug)
    {
      var cat = await _db.Categories
            .Where(c => c.Slug == slug && c.IsActive)
     .Select(c => new CategoryDto(
       c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.Icon, c.SortOrder,
    c.Products.Count(p => p.IsActive)
   ))
       .FirstOrDefaultAsync();

    if (cat is null) return NotFound();
    return Ok(cat);
    }

    // CREATE CATEGORY
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CreateCategory([FromBody] CreateCategoryRequest req)
    {
        var category = new Category
        {
            Name = req.Name,
            Slug = req.Slug,
            Description = req.Description,
            ImageUrl = req.ImageUrl,
            Icon = req.Icon,
            SortOrder = req.SortOrder ?? 0,
            ParentCategoryId = req.ParentCategoryId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(category.Id);
    }

    // UPDATE CATEGORY
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateCategory(int id, [FromBody] CreateCategoryRequest req)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return NotFound();

        // Nếu đổi ảnh khác → tự động xóa ảnh cũ trên Cloudinary
        if (!string.IsNullOrEmpty(category.ImageUrl) && category.ImageUrl != req.ImageUrl)
        {
            var oldPublicId = _cloudinary.ExtractPublicId(category.ImageUrl);
            if (!string.IsNullOrEmpty(oldPublicId))
            {
                _ = Task.Run(() => _cloudinary.DeleteAsync(oldPublicId));
            }
        }

        category.Name = req.Name;
        category.Slug = req.Slug;
        category.Description = req.Description;
        category.ImageUrl = req.ImageUrl;
        category.Icon = req.Icon;
        category.SortOrder = req.SortOrder ?? category.SortOrder;
        category.ParentCategoryId = req.ParentCategoryId;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // DELETE CATEGORY
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return NotFound();

        // Check if there are any products linked
        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            return BadRequest(new { message = "Không thể xóa danh mục vì vẫn còn sản phẩm đang liên kết. Vui lòng di chuyển hoặc xóa các sản phẩm đó trước." });
        }

        category.IsActive = false;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
