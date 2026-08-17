using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/inventory-imports")]
[Authorize(Roles = "Admin")]
public class InventoryImportsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly DwhSyncService _dwhSync;

    public InventoryImportsController(AppDbContext db, DwhSyncService dwhSync)
    {
        _db = db;
        _dwhSync = dwhSync;
    }

    private async Task RunDwhEtlAsync()
    {
        try { await _dwhSync.SyncAsync(); }
        catch (Exception ex)
        {
            Console.WriteLine($"[InventoryImports ETL] {ex.Message}");
        }
    }

    // ─── GET /api/inventory-imports ───────────────────────────────────────
    // Lấy toàn bộ lịch sử nhập kho, mới nhất lên đầu
    [HttpGet]
    public async Task<ActionResult<object>> GetAll(
        [FromQuery] int? productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.InventoryImports
            .Include(i => i.Product)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(i => i.ProductId == productId.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(i => i.ImportDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new
            {
                i.Id,
                i.ProductId,
                ProductName = i.Product.Name,
                ProductImage = i.Product.MainImageUrl,
                i.Quantity,
                i.ImportPrice,
                TotalCost = i.Quantity * i.ImportPrice,
                i.SupplierName,
                i.Notes,
                ImportDate = i.ImportDate.ToLocalTime(),
                i.CreatedByUserId,
                CurrentStock = i.Product.Stock
            })
            .ToListAsync();

        return Ok(new { total, items });
    }

    // ─── POST /api/inventory-imports ──────────────────────────────────────
    // Tạo phiếu nhập kho mới → tăng tồn kho sản phẩm
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateInventoryImportRequest req)
    {
        if (req.Quantity <= 0)
            return BadRequest(new { message = "Số lượng nhập phải lớn hơn 0." });

        if (req.ImportPrice < 0)
            return BadRequest(new { message = "Đơn giá nhập không hợp lệ." });

        var product = await _db.Products.FindAsync(req.ProductId);
        if (product == null)
            return NotFound(new { message = "Không tìm thấy sản phẩm." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var import = new InventoryImport
        {
            ProductId = req.ProductId,
            Quantity = req.Quantity,
            ImportPrice = req.ImportPrice,
            SupplierName = req.SupplierName,
            Notes = req.Notes,
            ImportDate = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _db.InventoryImports.Add(import);

        // Tăng tồn kho sản phẩm
        product.Stock += req.Quantity;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Đồng bộ DWH bất đồng bộ
        _ = Task.Run(RunDwhEtlAsync);

        return Ok(new
        {
            message = $"Nhập kho thành công! Tồn kho mới: {product.Stock}",
            importId = import.Id,
            newStock = product.Stock
        });
    }
}

// ─── DTO ───────────────────────────────────────────────────────────────────
public record CreateInventoryImportRequest(
    int ProductId,
    int Quantity,
    decimal ImportPrice,
    string? SupplierName,
    string? Notes
);
