namespace Web_HoaTuoi.Server.Services;

public class ZaloPayCreateOrderResult
{
    public bool Success { get; set; }
    public string? OrderUrl { get; set; }
    public string? QrCode { get; set; }
    public string? AppTransId { get; set; }
    public string? Message { get; set; }
}

public interface IZaloPayService
{
    Task<ZaloPayCreateOrderResult> CreateOrderAsync(string orderCode, decimal amount, string orderInfo);
    bool VerifyCallback(string dataStr, string reqMac);
}
