using System;
using System.Collections.Generic;

namespace Web_HoaTuoi.Server.Models
{
    /// <summary>
    /// Phiên trò chuyện của người dùng/khách hàng với Lyp AI
    /// </summary>
    public class ChatSession
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // UserId có thể null nếu là khách vãng lai chưa đăng nhập
        public string? UserId { get; set; }
        public AppUser? User { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        // Lưu thông tin kỹ thuật phục vụ quản trị và bảo mật
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        // Danh sách tin nhắn thuộc phiên này
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
