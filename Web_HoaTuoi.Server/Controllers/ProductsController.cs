using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.DTOs;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly Services.VectorDbService _vectorDb;
    private readonly Services.DwhSyncService _dwhSync;

    public ProductsController(AppDbContext db, Services.VectorDbService vectorDb, Services.DwhSyncService dwhSync)
    {
        _db = db;
        _vectorDb = vectorDb;
        _dwhSync = dwhSync;
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
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.CategorySlug))
        {
            var cat = await _db.Categories
                .FirstOrDefaultAsync(c => c.Slug == filter.CategorySlug);

            if (cat != null)
                query = query.Where(p => p.CategoryId == cat.Id);
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
            query = query.Where(p => p.Occasion.Contains(filter.Occasion));

        query = filter.SortBy switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "best_seller" => query.OrderByDescending(p => p.SoldCount),
            "random" => query.OrderBy(p => Guid.NewGuid()),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize) // Thêm Take vào đây
            .Select(p => new ProductCardDto(
                p.Id,
                p.Name,
                p.Slug,
                p.MainImageUrl,
                p.Price,
                p.SalePrice,
                p.IsOnSale,
                p.CategoryId,
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
                p.Reviews.Count(r => r.IsApproved)
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
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive);

        if (p == null)
            return NotFound();

        var allReviews = await _db.Reviews
            .Where(r => r.ProductId == p.Id && r.IsApproved)
            .ToListAsync();

        var dto = new ProductDetailDto(
            p.Id,
            p.Name,
            p.Slug,
            p.Description,
            p.MainImageUrl,
            new List<ProductImageDto>(),
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
            null
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
            Stock = req.Stock,
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

        product.Name = req.Name;
        product.Slug = req.Slug;
        product.Description = req.Description;
        product.Price = req.Price;
        product.SalePrice = req.SalePrice;
        product.IsOnSale = req.SalePrice.HasValue;
        product.CategoryId = req.CategoryId;
        product.Stock = req.Stock;
        product.MainImageUrl = req.MainImageUrl;
        product.FlowerType = req.FlowerType ?? string.Empty;
        product.Occasion = req.Occasion ?? string.Empty;
        product.Color = req.Color ?? string.Empty;
        product.BouquetSize = req.BouquetSize ?? string.Empty;
        product.Meaning = req.Meaning ?? string.Empty;
        product.WeightKg = req.WeightKg;
        product.UpdatedAt = DateTime.UtcNow;

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

    // DELETE PRODUCT
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound();

        product.IsActive = false;

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
}