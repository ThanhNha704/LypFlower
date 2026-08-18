using Web_HoaTuoi.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace Web_HoaTuoi.Server.Services;

public class RedisInventoryService : IInventoryService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RedisInventoryService> _logger;

    public RedisInventoryService(
        IServiceScopeFactory scopeFactory,
        ILogger<RedisInventoryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<List<int>> DecrementStockAsync(
        IEnumerable<(int ProductId, int Quantity)> items)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var outOfStock = new List<int>();

        foreach (var (productId, qty) in items)
        {
            var product = await dbContext.Products.FindAsync(productId);
            if (product == null || product.Stock < qty)
            {
                outOfStock.Add(productId);
                _logger.LogWarning("[LocalDB] Product {Id}: Háº¾T HÃ€NG (yÃªu cáº§u {Qty})", productId, qty);
            }
            else
            {
                product.Stock -= qty;
                _logger.LogInformation("[LocalDB] Product {Id}: trá»« {Qty}, cÃ²n láº¡i {Remaining}", productId, qty, product.Stock);
            }
        }

        if (outOfStock.Any())
        {
            return outOfStock; // Tráº£ vá» danh sÃ¡ch lá»—i mÃ  k lÆ°u thay Ä‘á»•i DB
        }

        await dbContext.SaveChangesAsync();
        return outOfStock;
    }

    public async Task RestoreStockAsync(
        IEnumerable<(int ProductId, int Quantity)> items)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        foreach (var (productId, qty) in items)
        {
            var product = await dbContext.Products.FindAsync(productId);
            if (product != null)
            {
                product.Stock += qty;
                _logger.LogInformation("[LocalDB] HoÃ n tráº£ Product {Id}: +{Qty}, tá»•ng = {Total}", productId, qty, product.Stock);
            }
        }
        await dbContext.SaveChangesAsync();
    }

    public Task SyncFromDatabaseAsync(AppDbContext dbContext)
    {
        // Bypass Redis sync on localhost
        _logger.LogInformation("[LocalDB] Bá» qua thao tÃ¡c Sync Redis trÃªn localhost.");
        return Task.CompletedTask;
    }
}
