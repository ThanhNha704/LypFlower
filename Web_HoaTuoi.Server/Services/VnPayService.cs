using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace Web_HoaTuoi.Server.Services;

public class VnPayService : IVnPayService
{
    private readonly IConfiguration _config;

    public VnPayService(IConfiguration config) => _config = config;

    public string CreatePaymentUrl(string orderCode, decimal amount, string orderInfo, string ipAddress)
    {
        var tmnCode    = _config["VnPay:TmnCode"]!;
        var hashSecret = _config["VnPay:HashSecret"]!;
        var baseUrl    = _config["VnPay:BaseUrl"]!;
        var returnUrl  = _config["VnPay:ReturnUrl"]!;
        var version    = _config["VnPay:Version"] ?? "2.1.0";
        var command    = _config["VnPay:Command"] ?? "pay";
        var currCode   = _config["VnPay:CurrCode"] ?? "VND";
        var locale     = _config["VnPay:Locale"] ?? "vn";

        var vnpParams = new SortedDictionary<string, string>
        {
            ["vnp_Version"]    = version,
            ["vnp_Command"]    = command,
            ["vnp_TmnCode"]    = tmnCode,
            ["vnp_Amount"]     = ((long)(amount * 100)).ToString(), // VNPay tÃ­nh theo Ä‘Æ¡n vá»‹ nhá» nháº¥t
            ["vnp_CreateDate"] = DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"]   = currCode,
            ["vnp_IpAddr"]     = ipAddress,
            ["vnp_Locale"]     = locale,
            ["vnp_OrderInfo"]  = orderInfo,
            ["vnp_OrderType"]  = "other",
            ["vnp_ReturnUrl"]  = returnUrl,
            ["vnp_TxnRef"]     = orderCode,
        };

        // Táº¡o chuá»—i hash data
        var signData = string.Join("&",
            vnpParams.Select(kv => $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

        var hash = HmacSha512(hashSecret, signData);

        var paymentUrl = $"{baseUrl}?{signData}&vnp_SecureHash={hash}";
        return paymentUrl;
    }

    public bool ValidateIpnSignature(IQueryCollection query)
    {
        var hashSecret = _config["VnPay:HashSecret"]!;

        // Láº¥y SecureHash tá»« query
        var vnpSecureHash = query["vnp_SecureHash"].ToString();
        if (string.IsNullOrEmpty(vnpSecureHash)) return false;

        // Build láº¡i chuá»—i hash (loáº¡i bá» vnp_SecureHash vÃ  vnp_SecureHashType)
        var sortedParams = new SortedDictionary<string, string>();
        foreach (var key in query.Keys)
        {
            if (key == "vnp_SecureHash" || key == "vnp_SecureHashType") continue;
            if (!string.IsNullOrEmpty(query[key]))
                sortedParams[key] = query[key].ToString();
        }

        var signData = string.Join("&",
            sortedParams.Select(kv => $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

        var computedHash = HmacSha512(hashSecret, signData);

        return string.Equals(computedHash, vnpSecureHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }
}
