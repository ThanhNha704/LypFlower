using System;
using System.Net.Http;
using System.Net.Http.Headers;
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
            try
            {
                // Gửi qua HTTP API của Brevo (Sendinblue) - Cổng 443 không bị Render chặn
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Brevo Email Error]: {ex.Message}");
                throw;
            }
        }
    }
}
