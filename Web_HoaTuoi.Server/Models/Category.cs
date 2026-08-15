namespace Web_HoaTuoi.Server.Models;

/// <summary>
/// Danh mục hoa trong cửa hàng.
/// Ví dụ: Hoa sinh nhật, Hoa khai trương, Hoa cưới.
/// Hỗ trợ cấu trúc cây (category cha → category con).
/// </summary>
public class Category
{
    public int Id { get; set; }

    /// <summary>
    /// Tên danh mục hiển thị.
    /// Ví dụ: "Hoa Sinh Nhật"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Slug dùng cho URL thân thiện SEO.
    /// Ví dụ: "hoa-sinh-nhat"
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả ngắn về loại hoa
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Ảnh đại diện của danh mục hoa
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Icon hiển thị trên menu (emoji hoặc class icon)
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Thứ tự hiển thị trên trang chủ/menu
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Trạng thái hiển thị danh mục
    /// </summary>
    public bool IsActive { get; set; } = true;

    // ───── Quan hệ danh mục cha - con ─────

    /// <summary>
    /// Id danh mục cha (null nếu là danh mục gốc)
    /// </summary>
    public int? ParentCategoryId { get; set; }

    public Category? ParentCategory { get; set; }

    /// <summary>
    /// Danh sách danh mục con
    /// </summary>
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();


    // ───── Quan hệ với Product (hoa) ─────

    /// <summary>
    /// Danh sách hoa thuộc danh mục này
    /// </summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();


    /// <summary>
    /// Ngày tạo danh mục
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}