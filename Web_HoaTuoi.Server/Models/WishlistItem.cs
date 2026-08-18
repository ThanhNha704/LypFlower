namespace Web_HoaTuoi.Server.Models;

/// <summary>
/// Danh sách hoa yêu thích của người dùng
/// </summary>
public class WishlistItem
{
    public int Id { get; set; }

    // ───── Người dùng ─────
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    // ───── Sản phẩm hoa ─────
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // ───── Thời gian thêm vào wishlist ─────
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}