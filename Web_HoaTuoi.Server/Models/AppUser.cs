using Microsoft.AspNetCore.Identity;

namespace Web_HoaTuoi.Server.Models;

public class AppUser : IdentityUser
{
    // Tên khách hàng
    public string FullName { get; set; } = string.Empty;

    // Ảnh đại diện
    public string? AvatarUrl { get; set; }

    // Địa chỉ giao hoa mặc định
    public string? DefaultAddress { get; set; }

    // Số điện thoại (giao hoa cần)
    public string? Phone { get; set; }

    // Ngày tạo tài khoản
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Phân quyền admin
    public bool IsAdmin { get; set; } = false;

    // Danh sách đơn hàng của khách
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    // Danh sách đánh giá hoa
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    // Danh sách sản phẩm yêu thích
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
}