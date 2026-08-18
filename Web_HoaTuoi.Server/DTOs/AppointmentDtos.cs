namespace Web_HoaTuoi.Server.DTOs;

// ── APPOINTMENT ───────────────────────────────────────────

public record CreateAppointmentRequest(
    string FullName,
    string Phone,
    string Email,
    string Need,          // "NewDesign" | "Renovation" | "RetailPurchase"
    DateTime AppointmentDate,
    string AppointmentTime,     // "HH:mm"
    string? AttachmentBase64,   // File upload encoded
    string? AttachmentFileName
);

public record AppointmentDto(
    int Id,
    string FullName,
    string Phone,
    string Email,
 string Need,
    DateTime AppointmentDate,
 string AppointmentTime,
    string? AttachmentUrl,
    string Status,
    decimal? DepositAmount,
    bool IsDepositPaid,
    DateTime CreatedAt
);

// ── REVIEW ────────────────────────────────────────────────

public record CreateReviewRequest(
    int ProductId,
    int Rating,
    string Comment,
    IEnumerable<string>? ImageBase64List   // Ảnh thực tế đính kèm
);

public record ReviewDto(
    int Id,
    string UserName,
    string? UserAvatarUrl,
    int Rating,
    string Comment,
    IEnumerable<string> ImageUrls,
    string? AdminReply,
    DateTime CreatedAt
);
