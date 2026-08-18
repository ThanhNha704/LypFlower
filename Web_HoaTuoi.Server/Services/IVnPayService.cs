namespace Web_HoaTuoi.Server.Services;

public interface IVnPayService
{
    /// <summary>Táº¡o VNPay payment URL vá»›i HMAC SHA-512</summary>
    string CreatePaymentUrl(string orderCode, decimal amount, string orderInfo, string ipAddress);

    /// <summary>Verify IPN callback signature tá»« VNPay</summary>
    bool ValidateIpnSignature(IQueryCollection query);
}
