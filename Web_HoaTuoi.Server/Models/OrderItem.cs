namespace Web_HoaTuoi.Server.Models;

public class OrderItem
{
    public int Id { get; set; }

    // ───── Quan hệ với Order ─────
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    // ───── Quan hệ với Product (hoa) ─────
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // ───── Snapshot dữ liệu sản phẩm lúc đặt ─────

    // Tên hoa lúc khách đặt
    public string ProductName { get; set; } = string.Empty;

    // Ảnh hoa lúc đặt
    public string? ProductImage { get; set; }

    // Giá 1 sản phẩm
    public decimal UnitPrice { get; set; }

    // Số lượng hoa
    public int Quantity { get; set; }

    // Tổng tiền của item
    public decimal SubTotal => UnitPrice * Quantity;
}