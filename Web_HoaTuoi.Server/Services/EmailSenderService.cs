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
                // Gửi qua HTTP API của Resend (cổng 443 - không bị Render chặn)
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _emailSettings.SenderPassword);

                var payload = new
                {
                    from = _emailSettings.SenderEmail, // E.g., "onboarding@resend.dev"
                    to = new[] { email },
                    subject = subject,
                    html = message
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                request.Content = jsonContent;

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Lỗi gửi mail qua Resend API: {error}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Error]: {ex.Message}");
                throw;
            }
        }
    }
}
