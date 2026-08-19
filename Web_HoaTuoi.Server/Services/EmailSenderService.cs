using System;
using System.Net;
using System.Net.Mail;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Services
{
    public class EmailSenderService : IEmailSenderService
    {
        private readonly EmailSettings _emailSettings;
        private readonly HttpClient _httpClient;

        public EmailSenderService(IOptions<EmailSettings> emailSettings, IHttpClientFactory httpClientFactory)
        {
            _emailSettings = emailSettings.Value;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task SendEmailAsync(string email, string subject, string message)
        {
            // 1. Thử gửi qua SMTP Gmail truyền thống nếu cấu hình là smtp.gmail.com
            if (_emailSettings.SmtpServer == "smtp.gmail.com" && !string.IsNullOrEmpty(_emailSettings.SenderPassword) && _emailSettings.SenderPassword.Length == 16)
            {
                try
                {
                    using (var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort))
                    {
                        client.UseDefaultCredentials = false;
                        client.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.SenderPassword);
                        client.EnableSsl = true;

                        var mailMessage = new MailMessage
                        {
                            From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName ?? "LypFlower"),
                            Subject = subject,
                            Body = message,
                            IsBodyHtml = true
                        };
                        mailMessage.To.Add(email);

                        await client.SendMailAsync(mailMessage);
                        Console.WriteLine("[Gmail SMTP] Gửi email OTP thành công!");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Gmail SMTP Error]: {ex.Message}. Thử gửi qua Brevo API...");
                    // Nếu lỗi SMTP (ví dụ bị chặn cổng ở Render), tiếp tục nhảy xuống gửi qua Brevo API ở dưới
                }
            }

            // 2. Gửi qua HTTP API của Brevo (Sendinblue) - Dùng khi deploy Render (Cổng 443 không bị chặn)
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
                request.Headers.Add("api-key", _emailSettings.SenderPassword); // Khóa API Key của Brevo lưu trong SenderPassword

                var payload = new
                {
                    sender = new { name = _emailSettings.SenderName ?? "LypFlower", email = _emailSettings.SenderEmail }, // Email người gửi đã xác thực trên Brevo
                    to = new[] { new { email = email } },
                    subject = subject,
                    htmlContent = message
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                request.Content = jsonContent;

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Lỗi gửi mail qua Brevo API: {error}");
                }
                Console.WriteLine("[Brevo API] Gửi email OTP thành công!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Brevo Email Error]: {ex.Message}");
                throw;
            }
        }
    }
}
