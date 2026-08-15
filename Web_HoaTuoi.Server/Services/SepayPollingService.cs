using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Hubs;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Services
{
    public class SepayPollingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SepayPollingService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string? _apiToken;
        private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(15);

        public SepayPollingService(
            IServiceProvider serviceProvider,
            ILogger<SepayPollingService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _httpClient = new HttpClient();
            _apiToken = configuration["SePay:ApiToken"];
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (string.IsNullOrEmpty(_apiToken))
            {
                _logger.LogWarning("SePay ApiToken is missing. SepayPollingService will not run.");
                return;
            }

            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiToken);

            _logger.LogInformation("SepayPollingService started. Polling every {Interval} seconds.", _pollInterval.TotalSeconds);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckTransactionsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while polling SePay transactions.");
                }

                await Task.Delay(_pollInterval, stoppingToken);
            }
        }

        private async Task CheckTransactionsAsync(CancellationToken stoppingToken)
        {
            var response = await _httpClient.GetAsync("https://my.sepay.vn/userapi/transactions/list", stoppingToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch SePay transactions. Status Code: {StatusCode}", response.StatusCode);
                return;
            }

            var content = await response.Content.ReadAsStringAsync(stoppingToken);
            using var doc = JsonDocument.Parse(content);
            
            var root = doc.RootElement;
            if (!root.TryGetProperty("transactions", out var transactionsElement) || transactionsElement.ValueKind != JsonValueKind.Array)
            {
                return;
            }

            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<OrderHub>>();

            // Get pending unpaid orders
            var pendingOrders = await dbContext.Orders
                .Where(o => !o.IsPaid && o.Status == OrderStatus.Pending)
                .ToListAsync(stoppingToken);

            if (!pendingOrders.Any())
            {
                return; // No orders to check
            }

            bool hasChanges = false;

            foreach (var tx in transactionsElement.EnumerateArray())
            {
                var amountInProperty = tx.GetProperty("amount_in");
                decimal amountIn = 0;
                
                if (amountInProperty.ValueKind == JsonValueKind.Number)
                    amountIn = amountInProperty.GetDecimal();
                else if (amountInProperty.ValueKind == JsonValueKind.String)
                    decimal.TryParse(amountInProperty.GetString(), out amountIn);

                if (amountIn <= 0) continue;

                var txContent = tx.GetProperty("transaction_content").GetString() ?? "";
                
                // Chuẩn hóa content
                string normalizedTxContent = Regex.Replace(txContent.ToUpper(), @"[^A-Z0-9]", "");

                // Tìm order khớp
                foreach (var order in pendingOrders)
                {
                    string normalizedOrderCode = Regex.Replace(order.OrderCode.ToUpper(), @"[^A-Z0-9]", "");
                    
                    if (normalizedTxContent.Contains(normalizedOrderCode))
                    {
                        // Khớp OrderCode, kiểm tra số tiền
                        if (amountIn >= order.FinalAmount)
                        {
                            order.IsPaid = true;
                            order.Status = OrderStatus.Processing;
                            hasChanges = true;
                            
                            _logger.LogInformation("✅ [Polling] Order {OrderCode} marked as Paid via SePay.", order.OrderCode);
                            
                            // Send SignalR
                            await hubContext.Clients.All.SendAsync("PaymentReceived", new
                            {
                                OrderCode = order.OrderCode,
                                Amount = amountIn,
                                Content = txContent
                            }, stoppingToken);
                            
                            await hubContext.Clients.All.SendAsync("OrderStatusChanged", new 
                            { 
                                Id = order.Id, 
                                Status = order.Status.ToString() 
                            }, stoppingToken);
                            
                            break; // Stop checking this transaction against other orders
                        }
                    }
                }
            }

            if (hasChanges)
            {
                await dbContext.SaveChangesAsync(stoppingToken);
            }
        }
    }
}
