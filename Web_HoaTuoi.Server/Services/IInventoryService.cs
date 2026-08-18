using Web_HoaTuoi.Server.Data;

namespace Web_HoaTuoi.Server.Services;

public interface IInventoryService
{
    /// <summary>
    /// Trá»« kho atomic cho nhiá»u sáº£n pháº©m.
    /// Return: danh sÃ¡ch productId bá»‹ háº¿t hÃ ng (empty = thÃ nh cÃ´ng).
    /// </summary>
    Task<List<int>> DecrementStockAsync(IEnumerable<(int ProductId, int Quantity)> items);

    /// <summary>HoÃ n tráº£ stock khi Ä‘Æ¡n hÃ ng tháº¥t báº¡i/há»§y</summary>
    Task RestoreStockAsync(IEnumerable<(int ProductId, int Quantity)> items);

    /// <summary>Äá»“ng bá»™ stock tá»« SQL Server vÃ o Redis</summary>
    Task SyncFromDatabaseAsync(AppDbContext db);
}
