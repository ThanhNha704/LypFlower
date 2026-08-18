using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.DTOs;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly VectorDbService _vectorDb;
    private readonly DwhSyncService _dwhSync;
    private readonly ICloudinaryService _cloudinary;

    public ProductsController(AppDbContext db, VectorDbService vectorDb, DwhSyncService dwhSync, ICloudinaryService cloudinary)
    {
        _db = db;
        _vectorDb = vectorDb;
        _dwhSync = dwhSync;
        _cloudinary = cloudinary;
    }

    private async Task RunDwhEtlAsync()
    {
        try
        {
            await _dwhSync.SyncAsync();
            Console.WriteLine("[ProductsController Auto-ETL] DWH ETL completed successfully using C# Sync.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ProductsController Auto-ETL] DWH ETL failed: {ex.Message}");
        }
    }

    // GET /api/products
    [HttpGet]
    public async Task<ActionResult<object>> GetProducts([FromQuery] ProductFilterRequest filter)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.CategorySlug))
        {
            var cat = await _db.Categories
                .FirstOrDefaultAsync(c => c.Slug == filter.CategorySlug);

            if (cat != null)
            {
                var catIds = new List<int> { cat.Id };
                var childIds = await _db.Categories
                    .Where(c => c.ParentCategoryId == cat.Id)
                    .Select(c => c.Id)
                    .ToListAsync();
                catIds.AddRange(childIds);

                var catSlug = filter.CategorySlug.ToLower();
                if (catSlug.Contains("sinh-nhat"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.Occasion.Contains("Sinh Nhật") || p.Name.Contains("Sinh Nhật"));
                }
                else if (catSlug.Contains("khai-truong"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.Occasion.Contains("Khai Trương") || p.Occasion.Contains("Tân Gia") || p.Name.Contains("Khai Trương"));
                }
                else if (catSlug.Contains("cuoi"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.Occasion.Contains("Cưới") || p.Occasion.Contains("Cô Dâu") || p.Name.Contains("Cưới") || p.Name.Contains("Cô Dâu"));
                }
                else if (catSlug.Contains("chia-buon") || catSlug.Contains("tang-le") || catSlug.Contains("vieng"))
                {
                    query = query.Where(p => 
                        (catIds.Contains(p.CategoryId) || p.Occasion.Contains("Tang Lễ") || p.Occasion.Contains("Chia Buồn") || p.Occasion.Contains("Kính Hiếu"))
                        && !p.Name.Contains("Vàng") 
                        && !p.Color.Contains("Vàng"));
                }
                else if (catSlug == "hoa-theo-loai")
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || (p.Category != null && p.Category.ParentCategoryId == cat.Id));
                }
                else if (catSlug.Contains("dip-le") || catSlug.Contains("valentine") || catSlug.Contains("phu-nu"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.Occasion.Contains("Valentine") || p.Occasion.Contains("8/3") || p.Occasion.Contains("20/10") || p.Occasion.Contains("Tết"));
                }
                else if (catSlug.Contains("sap") || catSlug.Contains("kho"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.FlowerType.Contains("Sáp") || p.FlowerType.Contains("Khô") || p.Name.Contains("Sáp") || p.Name.Contains("Khô"));
                }
                else if (catSlug.Contains("cay-canh") || catSlug.Contains("chau-hoa"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.FlowerType.Contains("Cây") || p.FlowerType.Contains("Sen Đá") || p.Name.Contains("Cây") || p.Name.Contains("Sen Đá"));
                }
                else if (catSlug.Contains("qua-tang"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.FlowerType.Contains("Bánh") || p.FlowerType.Contains("Socola") || p.FlowerType.Contains("Gấu") || p.FlowerType.Contains("Phụ Kiện") || p.FlowerType.Contains("Thiệp"));
                }
                else if (catSlug.Contains("tet"))
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId) || p.Occasion.Contains("Tết") || p.Name.Contains("Tết"));
                }
                else
                {
                    query = query.Where(p => catIds.Contains(p.CategoryId));
                }
            }
        }
        else if (filter.CategoryId.HasValue)
        {
            var childIds = await _db.Categories
                .Where(c => c.ParentCategoryId == filter.CategoryId.Value)
                .Select(c => c.Id)
                .ToListAsync();
            childIds.Add(filter.CategoryId.Value);
            query = query.Where(p => childIds.Contains(p.CategoryId));
        }

        if (!string.IsNullOrEmpty(filter.FlowerType))
        {
            var ft = filter.FlowerType.Trim();
            if (ft.Contains("Hồng", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Hồng") || p.Name.Contains("Hồng") || (p.Category != null && p.Category.Name.Contains("Hồng")));
            }
            else if (ft.Contains("Lan", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Lan") || p.Name.Contains("Lan") || (p.Category != null && p.Category.Name.Contains("Lan")));
            }
            else if (ft.Contains("Tulip", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Tulip") || p.Name.Contains("Tulip") || (p.Category != null && p.Category.Name.Contains("Tulip")));
            }
            else if (ft.Contains("Hướng Dương", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Hướng Dương") || p.Name.Contains("Hướng Dương") || (p.Category != null && p.Category.Name.Contains("Hướng Dương")));
            }
            else if (ft.Contains("Cẩm Tú Cầu", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Cẩm Tú Cầu") || p.Name.Contains("Cẩm Tú Cầu") || (p.Category != null && p.Category.Name.Contains("Cẩm Tú Cầu")));
            }
            else if (ft.Contains("Baby", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Baby") || p.Name.Contains("Baby") || (p.Category != null && p.Category.Name.Contains("Baby")));
            }
            else if (ft.Contains("Cúc", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Cúc") || p.Name.Contains("Cúc") || (p.Category != null && p.Category.Name.Contains("Cúc")));
            }
            else if (ft.Contains("Sen", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Sen") || p.Name.Contains("Sen") || (p.Category != null && p.Category.Name.Contains("Sen")));
            }
            else if (ft.Contains("Cát Tường", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Cát Tường") || p.Name.Contains("Cát Tường"));
            }
            else if (ft.Contains("Cẩm Chướng", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Cẩm Chướng") || p.Name.Contains("Cẩm Chướng"));
            }
            else if (ft.Contains("Thạch Thảo", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Thạch Thảo") || p.Name.Contains("Thạch Thảo"));
            }
            else if (ft.Contains("Sáp", StringComparison.OrdinalIgnoreCase) || ft.Contains("Khô", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.FlowerType.Contains("Sáp") || p.FlowerType.Contains("Khô") || p.Name.Contains("Sáp") || p.Name.Contains("Khô"));
            }
            else
            {
                query = query.Where(p => p.FlowerType.Contains(ft) || p.Name.Contains(ft));
            }
        }

        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice);

        if (!string.IsNullOrEmpty(filter.Q))
            query = query.Where(p =>
                p.Name.Contains(filter.Q) ||
                p.Description.Contains(filter.Q));

        if (!string.IsNullOrEmpty(filter.Color))
            query = query.Where(p => p.Color.Contains(filter.Color));

        if (!string.IsNullOrEmpty(filter.Occasion))
        {
            var occ = filter.Occasion.Trim();
            if (occ.Contains("Sinh nhật", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Sinh Nhật") || (p.Category != null && p.Category.Name.Contains("Sinh Nhật")) || p.Name.Contains("Sinh Nhật"));
            }
            else if (occ.Contains("Khai trương", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Khai Trương") || p.Occasion.Contains("Tân Gia") || p.Occasion.Contains("Văn Phòng") || (p.Category != null && p.Category.Name.Contains("Khai Trương")));
            }
            else if (occ.Contains("Tình yêu", StringComparison.OrdinalIgnoreCase) || occ.Contains("Valentine", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Valentine") || p.Occasion.Contains("Tỏ Tình") || p.Occasion.Contains("Hẹn Hò") || p.Occasion.Contains("Kỷ Niệm") || p.Occasion.Contains("Cầu Hôn") || p.Occasion.Contains("Tình Yêu"));
            }
            else if (occ.Contains("Chúc mừng", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Chúc Mừng") || p.Occasion.Contains("Tốt Nghiệp") || p.Occasion.Contains("Tri Ân") || p.Occasion.Contains("Sự Kiện"));
            }
            else if (occ.Contains("Cưới", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Cưới") || p.Occasion.Contains("Cô Dâu") || p.Name.Contains("Cưới") || (p.Category != null && p.Category.Name.Contains("Cưới")));
            }
            else if (occ.Contains("Chia buồn", StringComparison.OrdinalIgnoreCase) || occ.Contains("Tang lễ", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Tang Lễ") || p.Occasion.Contains("Chia Buồn") || p.Occasion.Contains("Kính Hiếu") || (p.Category != null && p.Category.Name.Contains("Tang Lễ")));
            }
            else if (occ.Contains("Tết", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("Tết") || p.Name.Contains("Tết") || (p.Category != null && p.Category.Name.Contains("Tết")));
            }
            else if (occ.Contains("8/3", StringComparison.OrdinalIgnoreCase) || occ.Contains("Phụ nữ", StringComparison.OrdinalIgnoreCase) || occ.Contains("Mẹ", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Occasion.Contains("8/3") || p.Occasion.Contains("20/10") || p.Occasion.Contains("Mẹ") || p.Occasion.Contains("Phụ Nữ"));
            }
            else
            {
                query = query.Where(p => p.Occasion.Contains(occ));
            }
        }

        query = filter.SortBy switch
        {
            "price_asc" => query.OrderByDescending(p => p.IsActive).ThenBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.IsActive).ThenByDescending(p => p.Price),
            "best_seller" => query.OrderByDescending(p => p.IsActive).ThenByDescending(p => p.SoldCount),
            "random" => query.OrderByDescending(p => p.IsActive).ThenBy(p => Guid.NewGuid()),
            _ => query.OrderByDescending(p => p.IsActive).ThenByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new ProductCardDto(
                p.Id,
                p.Name,
                p.Slug,
                p.MainImageUrl,
                p.Price,
                p.SalePrice,
                p.IsOnSale,
                p.CategoryId,
                p.Category != null ? p.Category.Name : "Chưa phân loại",
                p.Description,
                p.Meaning ?? string.Empty,
                p.Color,
                p.FlowerType,
                p.Occasion ?? "Nhiều dịp",
                p.BouquetSize ?? "Tiêu chuẩn",
                p.Stock,
                p.WeightKg,
                p.SoldCount,
                p.Reviews.Where(r => r.IsApproved).Any() ? p.Reviews.Where(r => r.IsApproved).Average(r => (double)r.Rating) : (double?)null,
                p.Reviews.Count(r => r.IsApproved),
                p.IsActive
            ))
            .ToListAsync();

        return Ok(new
        {
            Total = total,
            Page = filter.Page,
            PageSize = filter.PageSize,
            Items = items
        });
    }

    // SEARCH
    [HttpGet("search")]
    public async Task<ActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<object>());

        var results = await _db.Products
            .Where(p => p.IsActive && p.Name.Contains(q))
            .OrderByDescending(p => p.SoldCount)
            .Take(8)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.MainImageUrl
            })
            .ToListAsync();

        return Ok(results);
    }

    // GET PRODUCT DETAIL
    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDetailDto>> GetProduct(string slug)
    {
        var p = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews.Where(r => r.IsApproved))
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(p => p.Slug == slug);

        if (p == null)
            return NotFound();

        var subImages = await _db.ProductImages
            .Where(img => img.ProductId == p.Id)
            .OrderBy(img => img.DisplayOrder)
            .Select(img => new ProductImageDto(img.Id, img.ImageUrl, null, img.DisplayOrder))
            .ToListAsync();

        var allReviews = await _db.Reviews
            .Where(r => r.ProductId == p.Id && r.IsApproved)
            .ToListAsync();

        var dto = new ProductDetailDto(
            p.Id,
            p.Name,
            p.Slug,
            p.Description,
            p.MainImageUrl,
            subImages,
            p.Price,
            p.SalePrice,
            p.IsOnSale,
            p.Stock,
            p.WeightKg,
            p.Color,
            p.FlowerType,
            p.Occasion ?? "Nhiều dịp",
            p.BouquetSize ?? "Tiêu chuẩn",
            p.Meaning ?? string.Empty,
            new CategoryDto(
                p.Category.Id,
                p.Category.Name,
                p.Category.Slug,
                p.Category.Description,
                p.Category.ImageUrl,
                p.Category.Icon,
                p.Category.SortOrder,
                0
            ),
            new List<ProductCardDto>(),
            p.Reviews.Take(5).Select(r => new ReviewDto(
                r.Id,
                r.User?.FullName ?? "Ẩn danh",
                r.User?.AvatarUrl,
                r.Rating,
                r.Comment,
                new List<string>(),
                r.AdminReply,
                r.CreatedAt
            )),
            allReviews.Any() ? allReviews.Average(r => (double)r.Rating) : (double?)null,
            allReviews.Count,
            p.SoldCount,
            null,
            p.IsActive
        );

        return Ok(dto);
    }

    // CREATE PRODUCT
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CreateProduct([FromBody] CreateProductRequest req)
    {
        var product = new Product
        {
            Name = req.Name,
            Slug = req.Slug,
            Description = req.Description,
            Price = req.Price,
            SalePrice = req.SalePrice,
            IsOnSale = req.SalePrice.HasValue,
            CategoryId = req.CategoryId,
            Stock = req.Stock ?? 0,
            MainImageUrl = req.MainImageUrl,
            FlowerType = req.FlowerType ?? string.Empty,
            Occasion = req.Occasion ?? string.Empty,
            Color = req.Color ?? string.Empty,
            BouquetSize = req.BouquetSize ?? string.Empty,
            Meaning = req.Meaning ?? string.Empty,
            WeightKg = req.WeightKg,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        try
        {
            var productWithCategory = await _db.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == product.Id);
            if (productWithCategory != null)
            {
                _ = Task.Run(async () =>
                {
                    await _vectorDb.UpsertProductVectorAsync(productWithCategory);
                    await RunDwhEtlAsync();
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VectorDb Error]: {ex.Message}");
        }

        return Ok(product.Id);
    }

    // UPDATE PRODUCT
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] CreateProductRequest req)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound();

        // Nếu đổi ảnh chính → tự động xóa ảnh cũ trên Cloudinary
        if (!string.IsNullOrEmpty(product.MainImageUrl) && product.MainImageUrl != req.MainImageUrl)
        {
            var oldPublicId = _cloudinary.ExtractPublicId(product.MainImageUrl);
            if (!string.IsNullOrEmpty(oldPublicId))
            {
                _ = Task.Run(() => _cloudinary.DeleteAsync(oldPublicId));
            }
        }

        product.Name = req.Name;
        product.Slug = req.Slug;
        product.Description = req.Description;
        product.Price = req.Price;
        product.SalePrice = req.SalePrice;
        product.IsOnSale = req.SalePrice.HasValue;
        product.CategoryId = req.CategoryId;
        product.MainImageUrl = req.MainImageUrl;
        product.FlowerType = req.FlowerType ?? string.Empty;
        product.Occasion = req.Occasion ?? string.Empty;
        product.Color = req.Color ?? string.Empty;
        product.BouquetSize = req.BouquetSize ?? string.Empty;
        product.Meaning = req.Meaning ?? string.Empty;
        product.WeightKg = req.WeightKg;
        product.UpdatedAt = DateTime.UtcNow;

        // Nếu admin thay đổi số lượng tồn kho → tạo lịch sử điều chỉnh
        if (req.Stock.HasValue && req.Stock.Value != product.Stock)
        {
            int delta = req.Stock.Value - product.Stock;
            var importRecord = new InventoryImport
            {
                ProductId = product.Id,
                Quantity = delta,
                ImportPrice = 0,
                SupplierName = null,
                Notes = $"Điều chỉnh tồn kho thủ công bởi Admin ({(delta > 0 ? "+" : "")}{delta} sản phẩm)",
                ImportDate = DateTime.UtcNow,
                CreatedByUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            };
            _db.InventoryImports.Add(importRecord);
            product.Stock = req.Stock.Value;
        }

        await _db.SaveChangesAsync();

        try
        {
            var productWithCategory = await _db.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == product.Id);
            if (productWithCategory != null)
            {
                _ = Task.Run(async () =>
                {
                    await _vectorDb.UpsertProductVectorAsync(productWithCategory);
                    await RunDwhEtlAsync();
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VectorDb Error]: {ex.Message}");
        }

        return NoContent();
    }

    // DEACTIVATE PRODUCT (Ngừng kinh doanh – soft delete)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeactivateProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound();

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        try
        {
            _ = Task.Run(async () =>
            {
                await _vectorDb.DeleteProductVectorAsync(id);
                await RunDwhEtlAsync();
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VectorDb Error]: {ex.Message}");
        }

        return NoContent();
    }

    // RESTORE PRODUCT (Kích hoạt lại)
    [HttpPost("{id}/restore")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> RestoreProduct(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        product.IsActive = true;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        try
        {
            _ = Task.Run(async () =>
            {
                await _vectorDb.UpsertProductVectorAsync(product);
                await RunDwhEtlAsync();
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VectorDb Error]: {ex.Message}");
        }

        return NoContent();
    }

    // GET /api/products/admin-list
    [HttpGet("admin-list")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetProductsForAdmin(
        [FromQuery] string? q,
        [FromQuery] string? statusFilter, // "active" | "hidden" | "out_of_stock"
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .AsQueryable();

        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(p => p.Name.Contains(q) || p.Slug.Contains(q));
        }

        query = statusFilter switch
        {
            "hidden" => query.Where(p => !p.IsActive),
            "out_of_stock" => query.Where(p => p.IsActive && p.Stock == 0),
            "active" => query.Where(p => p.IsActive && p.Stock > 0),
            _ => query
        };

        query = query.OrderBy(p => p.IsActive ? (p.Stock > 0 ? 0 : 1) : 2)
                     .ThenByDescending(p => p.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductCardDto(
                p.Id,
                p.Name,
                p.Slug,
                p.MainImageUrl,
                p.Price,
                p.SalePrice,
                p.IsOnSale,
                p.CategoryId,
                p.Category != null ? p.Category.Name : "Chưa phân loại",
                p.Description,
                p.Meaning ?? string.Empty,
                p.Color,
                p.FlowerType,
                p.Occasion ?? "Nhiều dịp",
                p.BouquetSize ?? "Tiêu chuẩn",
                p.Stock,
                p.WeightKg,
                p.SoldCount,
                p.Reviews.Where(r => r.IsApproved).Any() ? p.Reviews.Where(r => r.IsApproved).Average(r => (double)r.Rating) : (double?)null,
                p.Reviews.Count(r => r.IsApproved),
                p.IsActive
            ))
            .ToListAsync();

        return Ok(new { total, items });
    }

    // POST /api/products/upload-image
    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không nhận được file ảnh." });

        try
        {
            var url = await _cloudinary.UploadAsync(file, "hoatuoi/products");
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Upload ảnh thất bại: {ex.Message}" });
        }
    }

    // GET /api/products/{id}/images
    [HttpGet("{id}/images")]
    public async Task<ActionResult> GetSubImages(int id)
    {
        var images = await _db.ProductImages
            .Where(img => img.ProductId == id)
            .OrderBy(img => img.DisplayOrder)
            .Select(img => new { img.Id, img.ImageUrl, img.DisplayOrder })
            .ToListAsync();
        return Ok(images);
    }

    // POST /api/products/{id}/images
    [HttpPost("{id}/images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AddSubImage(int id, [FromBody] AddSubImageRequest req)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        var img = new ProductImage
        {
            ProductId = id,
            ImageUrl = req.ImageUrl,
            IsMain = false,
            DisplayOrder = req.DisplayOrder
        };

        _db.ProductImages.Add(img);
        await _db.SaveChangesAsync();

        return Ok(new { img.Id, img.ImageUrl, img.DisplayOrder });
    }

    // DELETE /api/products/{id}/images/{imgId}
    [HttpDelete("{id}/images/{imgId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteSubImage(int id, int imgId)
    {
        var img = await _db.ProductImages.FirstOrDefaultAsync(x => x.ProductId == id && x.Id == imgId);
        if (img == null) return NotFound();

        // Tự động xóa ảnh tương ứng trên Cloudinary
        if (!string.IsNullOrEmpty(img.ImageUrl))
        {
            var oldPublicId = _cloudinary.ExtractPublicId(img.ImageUrl);
            if (!string.IsNullOrEmpty(oldPublicId))
            {
                _ = Task.Run(() => _cloudinary.DeleteAsync(oldPublicId));
            }
        }

        _db.ProductImages.Remove(img);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record AddSubImageRequest(string ImageUrl, int DisplayOrder);