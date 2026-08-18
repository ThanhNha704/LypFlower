namespace Web_HoaTuoi.Server.Models;

public class Voucher
{
    public int Id { get; set; }

    // Mã voucher người dùng nhập, vd "GIAM10K", "WELCOME2026"
    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    // Loại giảm giá: "Percentage" hoặc "FixedAmount"
    public string DiscountType { get; set; } = "FixedAmount";

    // Số tiền hoặc phần trăm giảm
    public decimal DiscountValue { get; set; }

    // Số tiền giảm tối đa (nếu là Percentage)
    public decimal? MaxDiscountAmount { get; set; }

    // Đơn hàng tối thiểu để áp dụng
    public decimal MinOrderValue { get; set; } = 0;

    public int UsageLimit { get; set; } = 100;
    
    public int UsedCount { get; set; } = 0;

    public DateTime ValidFrom { get; set; } = DateTime.UtcNow;
    
    public DateTime ValidUntil { get; set; }

    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
