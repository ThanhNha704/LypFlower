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
        var allCats = await _db.Categories
            .Where(c => c.IsActive)
            .Include(c => c.Products)
            .ToListAsync();

        var rootCats = allCats
            .Where(c => c.ParentCategoryId == null)
            .OrderBy(c => c.SortOrder)
            .Select(c =>
            {
                var childIds = allCats.Where(ch => ch.ParentCategoryId == c.Id).Select(ch => ch.Id).ToHashSet();
                childIds.Add(c.Id);
                var count = _db.Products.Count(p => p.IsActive && childIds.Contains(p.CategoryId));
                return new CategoryDto(
                    c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.Icon, c.SortOrder,
                    count
                );
            })
            .ToList();

        return Ok(rootCats);
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

    // GET /api/categories/filters
    [HttpGet("filters")]
    public async Task<ActionResult> GetActiveFilters()
    {
        var activeProducts = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new { p.FlowerType, p.Occasion })
            .ToListAsync();

        var rawFlowerTypes = activeProducts
            .SelectMany(p => (p.FlowerType ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrEmpty(x))
            .ToList();

        var flowerTypeGroups = new HashSet<string>();
        foreach (var ft in rawFlowerTypes)
        {
            if (ft.Contains("Hồng", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hoa Hồng");
            else if (ft.Contains("Lan", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Lan Hồ Điệp");
            else if (ft.Contains("Tulip", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hoa Tulip");
            else if (ft.Contains("Hướng Dương", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hướng Dương");
            else if (ft.Contains("Cẩm Tú Cầu", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Cẩm Tú Cầu");
            else if (ft.Contains("Baby", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hoa Baby");
            else if (ft.Contains("Cúc", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hoa Cúc");
            else if (ft.Contains("Sen", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hoa Sen");
            else if (ft.Contains("Cát Tường", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Cát Tường");
            else if (ft.Contains("Cẩm Chướng", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Cẩm Chướng");
            else if (ft.Contains("Thạch Thảo", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Thạch Thảo");
            else if (ft.Contains("Sáp", StringComparison.OrdinalIgnoreCase) || ft.Contains("Khô", StringComparison.OrdinalIgnoreCase)) flowerTypeGroups.Add("Hoa Sáp & Khô");
            else flowerTypeGroups.Add(ft);
        }

        var flowerTypes = flowerTypeGroups.OrderBy(x => x).ToList();

        var occasions = activeProducts
            .SelectMany(p => (p.Occasion ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrEmpty(x))
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        return Ok(new { flowerTypes, occasions });
    }

    [HttpGet("fix-image")]
    public async Task<ActionResult> FixImage()
    {
        var category = await _db.Categories.FindAsync(50);
        if (category != null)
        {
            category.ImageUrl = "/images/categories/goi-hoa-dinh-ky.jpg";
            await _db.SaveChangesAsync();
            return Ok("Fixed");
        }
        return NotFound();
    }
}
