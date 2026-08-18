namespace Web_HoaTuoi.Server.DTOs;

// â”€â”€ VNPAY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/// <summary>
/// Tráº£ vá» URL thanh toÃ¡n VNPay Ä‘á»ƒ Client redirect
/// </summary>
public record VnpayPaymentUrlResponse(string PaymentUrl);

/// <summary>
/// VNPay Webhook callback tá»« VNPay server (IPN)
/// </summary>
public record VnpayIpnRequest(
    string vnp_TmnCode,
    string vnp_Amount,
    string vnp_BankCode,
    string vnp_BankTranNo,
    string vnp_CardType,
    string vnp_PayDate,
    string vnp_OrderInfo,
    string vnp_TransactionNo,
    string vnp_ResponseCode,
    string vnp_TransactionStatus,
    string vnp_TxnRef,
    string vnp_SecureHash
);

// â”€â”€ AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string? Phone = null,
    string? Address = null
);

public record LoginRequest(
    string Email,
    string Password
);

public record GoogleLoginRequest(string IdToken);

public record AuthResponse(
    string Token,
    string UserId,
    string FullName,
    string Email,
    string Role,
    string? Phone = null,
    string? Address = null,
    bool IsNewUser = false
);

public record UpdateProfileRequest(
    string FullName,
    string? Phone = null,
    string? Address = null
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

public record ForgotPasswordRequest(
    string Email
);

public record VerifyOtpRequest(
    string Email,
    string OtpCode
);

public record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword
);

// â”€â”€ VOUCHER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record ValidateVoucherRequest(string Code, decimal OrderAmount);
public record VoucherValidationResult(bool IsValid, decimal DiscountAmount, string? Message);

/// <summary>
/// ThÃ´ng tin voucher cÃ´ng khai hiá»ƒn thá»‹ trÃªn trang chá»§ / danh sÃ¡ch mÃ£ giáº£m giÃ¡.
/// </summary>
public record PublicVoucherDto(
    string Code,
    decimal DiscountPercent,
    decimal? MaxDiscountAmount,
    decimal? MinOrderAmount,
    DateTime? ExpiresAt);

// â”€â”€ WISHLIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record WishlistItemDto(
    int Id,
    int ProductId,
    string ProductName,
    string Slug,
    string? MainImageUrl,
    decimal Price,
    decimal? SalePrice,
    bool IsOnSale,
    int Stock,
    string? CategoryName,
    DateTime AddedAt);
