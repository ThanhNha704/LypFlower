namespace Web_HoaTuoi.Server.DTOs;

// ── REQUEST ──────────────────────────────────────────────

/// <summary>
/// Dùng class + init properties để [FromQuery] binding hoạt động đúng.
/// Positional record không được ASP.NET Core bind từ query string.
/// </summary>
public class ProductFilterRequest
{
    public int? CategoryId { get; init; }
    public string? CategorySlug { get; init; }
    public string? Q { get; init; }
    public string? Material { get; init; }
    public string? Style { get; init; }
    public string? Color { get; init; }
    public string? Occasion { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    /// <summary>"newest" | "price_asc" | "price_desc" | "best_seller" | "random"</summary>
    public string? SortBy { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
}

public record CreateProductRequest(
    string Name,
    string Slug,
    string? Description,
    decimal Price,
    decimal? SalePrice,
    int CategoryId,
    string? FlowerType,
    string? Occasion,
    string? Color,
    int Stock,
    string? MainImageUrl,
    string? BouquetSize,
    string? Meaning,
    double? WeightKg
);

public record CreateCategoryRequest(
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    string? Icon,
    int? SortOrder,
    int? ParentCategoryId
);

// ── RESPONSE ─────────────────────────────────────────────

/// <summary>Card sản phẩm dùng cho danh sách / grid</summary>
public record ProductCardDto(
    int Id,
    string Name,
    string Slug,
    string MainImageUrl,
    decimal Price,
    decimal? SalePrice,
    bool IsOnSale,
    int CategoryId,
    string Description,
    string Meaning,
    string Color,
    string FlowerType,
    string Occasion,
    string BouquetSize,
    int Stock,
    double? WeightKg,
    int SoldCount,
    double? AverageRating,
    int ReviewCount,
    bool IsActive
);

/// <summary>Chi tiết sản phẩm đầy đủ (trang product detail)</summary>
public record ProductDetailDto(
    int Id,
    string Name,
    string Slug,
    string Description,
    string MainImageUrl,
    IEnumerable<ProductImageDto> SubImages,
    decimal Price,
    decimal? SalePrice,
    bool IsOnSale,
    int Stock,
    double? WeightKg,
    string Color,
    string FlowerType,
    string Occasion,
    string BouquetSize,
    string Meaning,
    CategoryDto Category,
    IEnumerable<ProductCardDto> BundledProducts,
    IEnumerable<ReviewDto> LatestReviews,
    double? AverageRating,
    int ReviewCount,
    int SoldCount,
    decimal? PromotionalPrice,   // Giá Flash Sale nếu đang active
    bool IsActive
);

public record ProductImageDto(int Id, string Url, string? AltText, int SortOrder);

public record CategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    string? Icon,
    int SortOrder,
    int ProductCount
);
