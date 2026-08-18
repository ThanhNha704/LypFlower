namespace Web_HoaTuoi.Server.DTOs;

// ── CART (Client-side state, gửi lên khi checkout) ───────

public record CartItemDto(
    int ProductId,
  string ProductName,
    string MainImageUrl,
    decimal UnitPrice,
    int Quantity
);

// ── ORDER REQUEST ─────────────────────────────────────────

public record CreateOrderRequest(
    OrderType Type,              // Retail | DesignDeposit
    string PaymentMethod,        // QrCode | COD
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? MessageCard,         // Lời nhắn thiệp
    DateTime? DeliveryTime,      // Thời gian nhận
    bool IsStorePickup,          // Lấy tại cửa hàng
    decimal ShippingFee,         // Phí vận chuyển
    string? VoucherCode,         // Mã giảm giá
    double? Latitude,            // Vị trí bản đồ giao hàng
    double? Longitude,
    IEnumerable<CartItemDto> Items
);

public enum OrderType { Retail, DesignDeposit }

// ── ORDER RESPONSE ────────────────────────────────────────

public record OrderSummaryDto(
    int Id,
    string OrderCode,
    string Status,
    decimal FinalAmount,
    bool IsPaid,
    DateTime CreatedAt,
    IEnumerable<CartItemDto> Items
);

public record OrderDetailDto(
    int Id,
    string OrderCode,
    string Status,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? MessageCard,
    DateTime? DeliveryTime,
    bool IsStorePickup,
    decimal ShippingFee,
    decimal TotalAmount,
    decimal FinalAmount,
    bool IsPaid,
    string? VnpayTransactionId,
    double? Latitude,
    double? Longitude,
    IEnumerable<CartItemDto> Items,
    DateTime CreatedAt
);
