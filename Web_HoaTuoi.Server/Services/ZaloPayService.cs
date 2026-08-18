using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Web_HoaTuoi.Server.Services;

public class ZaloPayService : IZaloPayService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ZaloPayService> _logger;

    public ZaloPayService(IConfiguration config, HttpClient httpClient, ILogger<ZaloPayService> logger)
    {
        _config = config;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ZaloPayCreateOrderResult> CreateOrderAsync(string orderCode, decimal amount, string orderInfo)
    {
        try
        {
            var appId = _config["ZaloPay:AppId"] ?? "2553";
            var key1 = _config["ZaloPay:Key1"] ?? "PcY4iZIKFCIdgZvA6ueMcGsEwDchStca";
            var createOrderUrl = _config["ZaloPay:CreateOrderUrl"] ?? "https://sb-openapi.zalopay.vn/v2/create";

            var appTransId = $"{DateTime.Now:yyMMdd}_{orderCode.Replace("-", "")}";
            var appTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var embedData = JsonSerializer.Serialize(new { redirecturl = _config["ZaloPay:RedirectUrl"] ?? "https://localhost:61348/don-hang" });
            var items = "[]";
            var longAmount = (long)amount;

            var appUser = "LypFlowerCustomer";
            var rawData = $"{appId}|{appTransId}|{appUser}|{longAmount}|{appTime}|{embedData}|{items}";
            var mac = HmacSha256(key1, rawData);

            var param = new Dictionary<string, string>
            {
                { "app_id", appId },
                { "app_user", appUser },
                { "app_time", appTime.ToString() },
                { "amount", longAmount.ToString() },
                { "app_trans_id", appTransId },
                { "embed_data", embedData },
                { "item", items },
                { "description", orderInfo },
                { "bank_code", "" },
                { "mac", mac }
            };

            var content = new FormUrlEncodedContent(param);
            var response = await _httpClient.PostAsync(createOrderUrl, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("ZaloPay CreateOrder Response: {Response}", responseContent);

            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;
            var returnCode = root.GetProperty("return_code").GetInt32();
            var returnMessage = root.GetProperty("return_message").GetString();

            if (returnCode == 1)
            {
                var orderUrl = root.TryGetProperty("order_url", out var u) ? u.GetString() : null;
                var qrCode = root.TryGetProperty("qr_code", out var q) ? q.GetString() : null;

                return new ZaloPayCreateOrderResult
                {
                    Success = true,
                    OrderUrl = orderUrl,
                    QrCode = qrCode,
                    AppTransId = appTransId,
                    Message = returnMessage
                };
            }

            return new ZaloPayCreateOrderResult
            {
                Success = false,
                Message = returnMessage ?? "Lỗi tạo đơn ZaloPay"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi gọi API ZaloPay");
            return new ZaloPayCreateOrderResult
            {
                Success = false,
                Message = ex.Message
            };
        }
    }

    public bool VerifyCallback(string dataStr, string reqMac)
    {
        var key2 = _config["ZaloPay:Key2"] ?? "kLfiRA827aEYiTfvAhBZsAfTuo0stage";
        var computedMac = HmacSha256(key2, dataStr);
        return string.Equals(computedMac, reqMac, StringComparison.OrdinalIgnoreCase);
    }

    private static string HmacSha256(string key, string data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }
}
