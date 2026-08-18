using System;

namespace Web_HoaTuoi.Server.Models
{
    /// <summary>
    /// Chi tiết tin nhắn trong một phiên trò chuyện
    /// </summary>
    public class ChatMessage
    {
        public int Id { get; set; }

        public Guid ChatSessionId { get; set; }
        public ChatSession ChatSession { get; set; } = null!;

        // Người gửi: "User" hoặc "AI"
        public string Sender { get; set; } = string.Empty;

        // Nội dung tin nhắn
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // JSON danh sách các sản phẩm hoa được đề xuất kèm theo tin nhắn này (nếu có)
        // Cấu trúc gợi ý: [{"id": 1, "name": "...", "slug": "...", "price": 1000, "salePrice": 800, "mainImageUrl": "..."}]
        public string? RecommendedProductsJson { get; set; }
    }
}
