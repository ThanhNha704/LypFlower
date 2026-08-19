namespace Web_HoaTuoi.Server.Models;

public enum OrderStatus
{
    Placed = 0,             // Đã đặt hàng (thay cho Pending)
    Preparing = 1,          // Đang chuẩn bị (thay cho Processing)
    Delivering = 2,         // Đang giao (thay cho Shipping)
    Completed = 3           // Hoàn thành
}

public class Order
{
    public int Id { get; set; }

    // Mã đơn hàng
    public string OrderCode { get; set; } = string.Empty;

    // Người đặt
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    // Nhân viên giao hàng được phân công
    public string? StaffId { get; set; }
    public AppUser? Staff { get; set; }

    // Trạng thái đơn hàng
    public OrderStatus Status { get; set; } = OrderStatus.Placed;

    // ───── Thông tin người nhận hoa ─────

    public string ReceiverName { get; set; } = string.Empty;

    public string ReceiverPhone { get; set; } = string.Empty;

    public string ReceiverAddress { get; set; } = string.Empty;

    // Vị trí bản đồ giao hàng
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Lời nhắn trên thiệp
    public string? MessageCard { get; set; }

    // Thời gian giao hoa mong muốn
    public DateTime? DeliveryTime { get; set; }

    // Hình thức nhận hàng: true = tại cửa hàng, false = giao tận nơi
    public bool IsStorePickup { get; set; } = false;

    // Phí vận chuyển
    public decimal ShippingFee { get; set; } = 0;

    // ───── Thanh toán ─────

    public decimal TotalAmount { get; set; }


    public decimal FinalAmount { get; set; }


    // mã giao dịch VNPAY
    public string? VnpayTransactionId { get; set; }

    public bool IsPaid { get; set; } = false;

    public DateTime? PaidAt { get; set; }

    // ───── Thông tin Khuyến mãi ─────
    public string? VoucherCode { get; set; }
    public decimal DiscountAmount { get; set; } = 0;

    // ───── Chi tiết đơn hàng ─────

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    // ───── Thời gian ─────

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}