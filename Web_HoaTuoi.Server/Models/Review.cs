namespace Web_HoaTuoi.Server.Models;

/// <summary>
/// Đánh giá của khách hàng cho sản phẩm hoa
/// </summary>
public class Review
{
    public int Id { get; set; }

    // ───── Quan hệ với Product ─────
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // ───── Người đánh giá ─────
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    // Số sao (1 - 5)
    public int Rating { get; set; }

    // Nội dung đánh giá
    public string Comment { get; set; } = string.Empty;

    // Ảnh khách hàng upload
    public ICollection<ReviewImage> Images { get; set; } = new List<ReviewImage>();

    // Admin duyệt review
    public bool IsApproved { get; set; } = false;

    // Phản hồi của admin/shop
    public string? AdminReply { get; set; }

    // Thời gian tạo review
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsVerifiedPurchase { get; set; }
}


public class ReviewImage
{
    public int Id { get; set; }

    public int ReviewId { get; set; }
    public Review Review { get; set; } = null!;

    // URL ảnh review
    public string Url { get; set; } = string.Empty;
}
