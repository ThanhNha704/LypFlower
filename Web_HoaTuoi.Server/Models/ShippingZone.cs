namespace Web_HoaTuoi.Server.Models;

public class ShippingZone
{
    public int Id { get; set; }
    
    // Tên khu vực, ví dụ: "Nội thành HCM", "Ngoại thành HCM", "Các tỉnh lân cận"
    public string Name { get; set; } = string.Empty;
    
    public decimal Fee { get; set; } = 0;
    
    // Thời gian giao dự kiến, ví dụ: "2H", "1-2 ngày"
    public string EstimatedTime { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
}
