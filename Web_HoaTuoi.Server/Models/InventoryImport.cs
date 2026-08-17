namespace Web_HoaTuoi.Server.Models;

/// <summary>
/// Phiếu nhập kho – ghi lại mỗi lần nhập hàng vào kho
/// </summary>
public class InventoryImport
{
    public int Id { get; set; }

    // Sản phẩm được nhập
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // Số lượng nhập
    public int Quantity { get; set; }

    // Đơn giá nhập (VNĐ / sản phẩm)
    public decimal ImportPrice { get; set; }

    // Nhà cung cấp
    public string? SupplierName { get; set; }

    // Ghi chú
    public string? Notes { get; set; }

    // Ngày nhập kho
    public DateTime ImportDate { get; set; } = DateTime.UtcNow;

    // Admin thực hiện nhập kho
    public string? CreatedByUserId { get; set; }
}
