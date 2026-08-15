namespace Web_HoaTuoi.Server.Models;

/// <summary>
/// Sản phẩm hoa trong cửa hàng
/// </summary>
public class Product
{
    public int Id { get; set; }

    // Tên hoa
    public string Name { get; set; } = string.Empty;

    // Slug SEO
    public string Slug { get; set; } = string.Empty;

    // Mô tả hoa
    public string Description { get; set; } = string.Empty;

    // Ý nghĩa của hoa
    public string? Meaning { get; set; }

    // --- Giá ---
    public decimal Price { get; set; }

    public decimal? SalePrice { get; set; }

    public bool IsOnSale { get; set; } = false;

    // --- Phân loại hoa ---
    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    // Loại hoa (hoa hồng, hoa tulip...)
    public string FlowerType { get; set; } = string.Empty;

    // Màu hoa
    public string Color { get; set; } = string.Empty;

    // Dịp tặng
    public string? Occasion { get; set; }

    // Kích thước bó
    public string? BouquetSize { get; set; }

    // Khối lượng
    public double? WeightKg { get; set; }

    // --- Tồn kho ---
    public int Stock { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public int SoldCount { get; set; } = 0;

    // --- Ảnh ---
    public string MainImageUrl { get; set; } = string.Empty;

    // --- Quan hệ ---
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();

    public ICollection<ProductBundle> Bundles { get; set; } = new List<ProductBundle>();

    // --- Thời gian ---
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}