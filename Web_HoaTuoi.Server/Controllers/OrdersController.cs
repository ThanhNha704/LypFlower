using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.DTOs;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;
using System.Text.Json; // Bắt buộc cho SePay Webhook
using Web_HoaTuoi.Server.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Identity;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    // === Thông tin tài khoản ngân hàng để tạo VietQR ===
    private const string QrBankId = "MB"; // Bắt buộc là MB
    private const string QrAccountNumber = "251099992345"; // Số TK MB của ông
    private const string QrAccountName = "NGUYEN TRONG HUNG"; // Tên của ông

    private readonly AppDbContext _db;
    private readonly IInventoryService _inventory;
    private readonly ILogger<OrdersController> _logger;
    private readonly IConfiguration _config;
    private readonly IHubContext<OrderHub> _hubContext;
    private readonly UserManager<AppUser> _userManager;

    public OrdersController(
        AppDbContext db,
        IInventoryService inventory,
        ILogger<OrdersController> logger,
        IConfiguration config,
        IHubContext<OrderHub> hubContext,
        UserManager<AppUser> userManager)
    {
        _db = db;
        _inventory = inventory;
        _logger = logger;
        _config = config;
        _hubContext = hubContext;
        _userManager = userManager;
    }

    // POST /api/orders
    [HttpPost]
    [Authorize]
    [EnableRateLimiting("OrderLimit")]
    public async Task<ActionResult<object>> CreateOrder([FromBody] CreateOrderRequest req)
    {
        if (!req.Items.Any())
            return BadRequest(new { message = "Giỏ hàng trống." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var stockItems = req.Items
            .Select(i => (i.ProductId, i.Quantity))
            .ToList();

        var stockDecremented = false;

        try
        {
            // ===== Trừ kho Redis =====
            var outOfStock = await _inventory.DecrementStockAsync(stockItems);

            if (outOfStock.Any())
            {
                var names = await _db.Products
                    .Where(p => outOfStock.Contains(p.Id))
                    .Select(p => p.Name)
                    .ToListAsync();

                return Conflict(new
                {
                    message = $"Hết hàng: {string.Join(", ", names)}"
                });
            }

            stockDecremented = true;

            // ===== Tạo OrderItems =====
            var orderItems = new List<OrderItem>();
            decimal totalAmount = 0;

            foreach (var item in req.Items)
            {
                totalAmount += item.UnitPrice * item.Quantity;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductImage = item.MainImageUrl,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity
                });
            }

            // ===== Xử lý Mã giảm giá =====
            decimal discountAmount = 0;
            Voucher? appliedVoucher = null;
            if (!string.IsNullOrWhiteSpace(req.VoucherCode))
            {
                appliedVoucher = await _db.Vouchers.FirstOrDefaultAsync(v => v.Code == req.VoucherCode.ToUpper());
                if (appliedVoucher != null && appliedVoucher.IsActive && appliedVoucher.ValidUntil >= DateTime.UtcNow && appliedVoucher.UsedCount < appliedVoucher.UsageLimit && totalAmount >= appliedVoucher.MinOrderValue)
                {
                    if (appliedVoucher.DiscountType == "Percentage")
                    {
                        discountAmount = totalAmount * (appliedVoucher.DiscountValue / 100);
                        if (appliedVoucher.MaxDiscountAmount.HasValue && discountAmount > appliedVoucher.MaxDiscountAmount.Value)
                        {
                            discountAmount = appliedVoucher.MaxDiscountAmount.Value;
                        }
                    }
                    else
                    {
                        discountAmount = appliedVoucher.DiscountValue;
                    }
                    if (discountAmount > totalAmount) discountAmount = totalAmount;

                    appliedVoucher.UsedCount += 1;
                }
            }

            // ===== Tạo mã đơn =====
            var orderCode = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

            var order = new Order
            {
                OrderCode = orderCode,
                UserId = userId,
                Status = OrderStatus.Pending,
                ReceiverName = req.ReceiverName,
                ReceiverPhone = req.ReceiverPhone,
                ReceiverAddress = req.ReceiverAddress,
                Latitude = req.Latitude,
                Longitude = req.Longitude,
                MessageCard = req.MessageCard,
                DeliveryTime = req.DeliveryTime,
                IsStorePickup = req.IsStorePickup,
                ShippingFee = req.ShippingFee,
                TotalAmount = totalAmount,
                FinalAmount = totalAmount + req.ShippingFee - discountAmount,
                VoucherCode = appliedVoucher?.Code,
                DiscountAmount = discountAmount,
                IsPaid = false,
                CreatedAt = DateTime.UtcNow,
                Items = orderItems
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            // ===== Update Stock SQL =====
            foreach (var item in req.Items)
            {
                await _db.Products
                    .Where(p => p.Id == item.ProductId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(p => p.Stock, p => p.Stock - item.Quantity)
                        .SetProperty(p => p.SoldCount, p => p.SoldCount + item.Quantity));
            }

            var summary = new OrderSummaryDto(
                order.Id,
                order.OrderCode,
                order.Status.ToString(),
                order.FinalAmount,
                order.IsPaid,
                order.CreatedAt,
                order.Items.Select(i => new CartItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.ProductImage ?? "",
                    i.UnitPrice,
                    i.Quantity)));

            // ===== Push SignalR Event =====
            await _hubContext.Clients.All.SendAsync("OrderCreated", summary);

            // ===== Trả về thông tin QR =====
            object? qrInfo = null;

            if (req.PaymentMethod == "QrCode")
            {
                var qrAmount = Math.Max(2000, (long)order.FinalAmount);
                qrInfo = new
                {
                    bankId = QrBankId,
                    accountNumber = QrAccountNumber,
                    accountName = QrAccountName,
                    amount = qrAmount,
                    description = order.OrderCode, // Gán mã đơn làm nội dung chuyển tiền
                    orderCode = order.OrderCode,
                    orderId = order.Id
                };
            }

            return Ok(new
            {
                orderSummary = summary,
                qrInfo
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi tạo đơn hàng");

            if (stockDecremented)
                await _inventory.RestoreStockAsync(stockItems);

            return StatusCode(500, new { message = "Lỗi hệ thống khi tạo đơn hàng." });
        }
    }

    // GET /api/orders/my
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<OrderSummaryDto>>> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var orders = await _db.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.OrderCode,
                o.Status.ToString(),
                o.FinalAmount,
                (bool?)o.IsPaid ?? false,
                o.CreatedAt,
                o.Items.Select(i => new CartItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.ProductImage ?? "",
                    i.UnitPrice,
                    i.Quantity))))
            .ToListAsync();

        return Ok(orders);
    }

    // GET /api/orders/{id}
    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<OrderDetailDto>> GetOrder(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        var isStaff = User.IsInRole("Staff");
        
        _logger.LogInformation($"[GetOrder] id: {id}, userId: {userId}, isAdmin: {isAdmin}, isStaff: {isStaff}");

        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
            
        if (order is null)
        {
            _logger.LogWarning($"[GetOrder] Order {id} not found.");
            return NotFound();
        }
        
        if (!isAdmin && order.UserId != userId && (!isStaff || order.StaffId != userId))
        {
            _logger.LogWarning($"[GetOrder] Forbidden. Order UserId: {order.UserId}, StaffId: {order.StaffId}, Request UserId: {userId}");
            return Forbid();
        }

        var dto = new OrderDetailDto(
            order.Id,
            order.OrderCode,
            order.Status.ToString(),
            order.ReceiverName,
            order.ReceiverPhone,
            order.ReceiverAddress,
            order.MessageCard,
            order.DeliveryTime,
            order.IsStorePickup,
            order.ShippingFee,
            order.TotalAmount,
            order.FinalAmount,
            (bool?)order.IsPaid ?? false,
            order.VnpayTransactionId,
            order.Latitude,
            order.Longitude,
            order.Items.Select(i => new CartItemDto(
                i.ProductId,
                i.ProductName,
                i.ProductImage ?? "",
                i.UnitPrice,
                i.Quantity)),
            order.CreatedAt);

        return Ok(dto);
    }

    // GET /api/orders  (Admin)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetAllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] string? sortBy = null)
    {
        var query = _db.Orders.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(o => o.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(o => 
                o.OrderCode.Contains(search) || 
                o.ReceiverName.Contains(search) || 
                o.ReceiverPhone.Contains(search));
        }

        if (dateFrom.HasValue)
        {
            var from = DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Utc);
            query = query.Where(o => o.CreatedAt >= from);
        }

        if (dateTo.HasValue)
        {
            var to = DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(o => o.CreatedAt <= to);
        }

        // Xử lý sắp xếp động
        if (sortBy == "date_asc")
        {
            query = query.OrderBy(o => o.CreatedAt);
        }
        else if (sortBy == "amount_desc")
        {
            query = query.OrderByDescending(o => o.FinalAmount);
        }
        else if (sortBy == "amount_asc")
        {
            query = query.OrderBy(o => o.FinalAmount);
        }
        else
        {
            query = query.OrderByDescending(o => o.CreatedAt); // mặc định date_desc
        }

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.OrderCode,
                Status = o.Status.ToString(),
                o.ReceiverName,
                o.ReceiverPhone,
                o.FinalAmount,
                IsPaid = (bool?)o.IsPaid ?? false,
                o.StaffId,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        });
    }

    // PUT /api/orders/{id}/cancel
    [HttpPut("{id:int}/cancel")]
    [Authorize]
    public async Task<ActionResult> CancelOrder(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

        if (order is null)
            return NotFound();

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            return BadRequest(new { message = "Chỉ có thể huỷ đơn hàng chưa được giao." });

        order.Status = OrderStatus.Cancelled;

        // Restore stock
        foreach (var item in order.Items)
        {
            await _db.Products
                .Where(p => p.Id == item.ProductId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Stock, p => p.Stock + item.Quantity)
                    .SetProperty(p => p.SoldCount, p => p.SoldCount - item.Quantity));
        }

        await _db.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("OrderCancelled", id);

        return Ok(new { message = "Huỷ đơn hàng thành công" });
    }

    // PUT /api/orders/{id}/status
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest req)
    {
        var order = await _db.Orders.FindAsync(id);

        if (order is null)
            return NotFound();

        if (!Enum.TryParse<OrderStatus>(req.Status, out var newStatus))
            return BadRequest(new { message = "Status không hợp lệ." });

        var isAdmin = User.IsInRole("Admin");
        var isStaff = User.IsInRole("Staff");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // 1. Kiểm tra quyền của Staff
        if (isStaff && !isAdmin)
        {
            if (order.StaffId != userId)
            {
                return StatusCode(403, new { message = "Bạn không có quyền thao tác trên đơn hàng này." });
            }
        }

        // 2. Chặn thay đổi từ trạng thái cuối
        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Refunded)
        {
            return BadRequest(new { message = $"Đơn hàng đã ở trạng thái '{order.Status.ToString()}', không thể thay đổi trạng thái nữa." });
        }

        // 3. Kiểm tra logic luồng trạng thái 1 chiều
        if (order.Status == OrderStatus.Pending)
        {
            if (newStatus != OrderStatus.Processing && newStatus != OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Từ trạng thái Chờ xác nhận chỉ được chuyển sang Đang chuẩn bị (Processing) hoặc Đã hủy (Cancelled)." });
            }
        }
        else if (order.Status == OrderStatus.Processing)
        {
            if (newStatus != OrderStatus.Shipping && newStatus != OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Từ trạng thái Đang chuẩn bị chỉ được chuyển sang Đang giao (Shipping) hoặc Đã hủy (Cancelled)." });
            }
        }
        else if (order.Status == OrderStatus.Shipping)
        {
            if (newStatus != OrderStatus.Completed && newStatus != OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Từ trạng thái Đang giao chỉ được chuyển sang Giao thành công (Completed) hoặc Đã hủy (Cancelled)." });
            }
        }

        // 4. Ràng buộc cụ thể của Staff
        if (isStaff && !isAdmin)
        {
            if (order.Status == OrderStatus.Processing && newStatus != OrderStatus.Shipping)
            {
                return BadRequest(new { message = "Nhân viên giao hàng chỉ có quyền chuyển đơn sang trạng thái Đang giao." });
            }
            if (order.Status == OrderStatus.Shipping && newStatus != OrderStatus.Completed && newStatus != OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Nhân viên giao hàng chỉ có quyền hoàn thành hoặc hủy đơn." });
            }
        }

        // Thực hiện cập nhật
        order.Status = newStatus;
        if (newStatus == OrderStatus.Completed && !order.IsPaid)
        {
            order.IsPaid = true;
            order.PaidAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("OrderStatusChanged", new { Id = id, Status = newStatus.ToString() });

        return NoContent();
    }

    // PUT /api/orders/bulk-status
    [HttpPut("bulk-status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> BulkUpdateStatus(
        [FromBody] BulkUpdateOrderStatusRequest req)
    {
        if (!Enum.TryParse<OrderStatus>(req.Status, out var newStatus))
            return BadRequest(new { message = "Status không hợp lệ." });

        if (req.OrderIds == null || !req.OrderIds.Any())
            return BadRequest(new { message = "Không có đơn hàng nào được chọn." });

        var orders = await _db.Orders
            .Where(o => req.OrderIds.Contains(o.Id))
            .ToListAsync();

        foreach (var order in orders)
        {
            order.Status = newStatus;
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // PUT /api/orders/{id}/confirm-paid
    [HttpPut("{id:int}/confirm-paid")]
    [Authorize]
    public async Task<IActionResult> ConfirmPaid(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
        if (order is null) return NotFound();

        order.IsPaid = true;
        if (order.Status == OrderStatus.Pending)
        {
            order.Status = OrderStatus.Processing;
        }
        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Xác nhận đã thanh toán thành công!" });
    }

    // GET /api/orders/staff-members
    [HttpGet("staff-members")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetStaffMembers()
    {
        var staffUsers = await _userManager.GetUsersInRoleAsync("Staff");
        var result = staffUsers.Select(u => new
        {
            u.Id,
            u.FullName,
            u.Email,
            u.Phone
        });
        return Ok(result);
    }

    // PUT /api/orders/{id}/assign
    [HttpPut("{id:int}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AssignStaff(int id, [FromBody] string staffId)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        // Chặn phân công staff khi đơn đã ở trạng thái cuối
        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Refunded)
        {
            return BadRequest("Không thể phân công nhân viên cho đơn hàng đã hoàn tất hoặc đã hủy.");
        }

        var staff = await _userManager.FindByIdAsync(staffId);
        if (staff == null) return BadRequest("Nhân viên không tồn tại.");

        order.StaffId = staffId;
        // Chỉ tự động chuyển sang Processing nếu trạng thái hiện tại là Pending
        if (order.Status == OrderStatus.Pending)
        {
            order.Status = OrderStatus.Processing;
        }
        
        await _db.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("OrderStatusChanged", new { Id = order.Id, Status = order.Status.ToString(), StaffId = staffId });

        return NoContent();
    }

    // GET /api/orders/staff
    [HttpGet("staff")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<object>> GetOrdersForStaff(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var staffId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var query = _db.Orders
            .Where(o => o.StaffId == staffId)
            .AsQueryable();

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.OrderCode,
                Status = o.Status.ToString(),
                o.ReceiverName,
                o.ReceiverPhone,
                o.ReceiverAddress,
                o.Latitude,
                o.Longitude,
                o.FinalAmount,
                o.IsPaid,
                o.CreatedAt,
                Items = o.Items.Select(i => new
                {
                    i.ProductName,
                    ProductImage = i.ProductImage ?? "",
                    i.Quantity,
                    i.UnitPrice
                })
            })
            .ToListAsync();

        return Ok(new
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        });
    }

    // 🟢 HÀM NHẬN WEBHOOK TỪ SEPAY (ĐÃ CHUẨN HÓA KHỚP MÃ ĐƠN KHÔNG PHÂN BIỆT GẠCH NGANG) 🟢
    [HttpPost("/api/webhook/sepay")]
    [AllowAnonymous]
    public async Task<IActionResult> SePayWebhook([FromBody] JsonElement body)
    {
        Console.WriteLine("\n================ SEPAY WEBHOOK REQUEST ================");
        Console.WriteLine(body.GetRawText());
        Console.WriteLine("=======================================================\n");

        try
        {
            string content = "";
            decimal amount = 0;

            JsonElement targetElement = body;
            if (body.TryGetProperty("data", out var dataObj) && dataObj.ValueKind == JsonValueKind.Object)
            {
                targetElement = dataObj;
            }

            if (targetElement.TryGetProperty("transaction_content", out var tcProp))
                content = tcProp.GetString() ?? "";
            else if (targetElement.TryGetProperty("content", out var cProp))
                content = cProp.GetString() ?? "";
            else if (targetElement.TryGetProperty("description", out var dProp))
                content = dProp.GetString() ?? "";

            if (targetElement.TryGetProperty("amount_in", out var aiProp))
                amount = aiProp.GetDecimal();
            else if (targetElement.TryGetProperty("transferAmount", out var taProp))
                amount = taProp.GetDecimal();
            else if (targetElement.TryGetProperty("amount", out var amProp))
                amount = amProp.GetDecimal();

            Console.WriteLine($"-> Trích xuất thành công: Nội dung='{content}', Số tiền={amount}");

            if (!string.IsNullOrEmpty(content))
            {
                // Chuẩn hóa nội dung SePay: viết hoa, xóa sạch dấu gạch ngang và khoảng trắng
                string normalizedContent = content.Replace("-", "").Replace(" ", "").ToUpper();

                var pendingOrders = await _db.Orders.Where(o => o.IsPaid != true).ToListAsync();
                var order = pendingOrders.FirstOrDefault(o => 
                    normalizedContent.Contains(o.OrderCode.Replace("-", "").ToUpper())
                );

                if (order != null)
                {
                    Console.WriteLine($"-> Đã tìm thấy đơn hàng trong DB: {order.OrderCode} (Cần thanh toán: {order.FinalAmount})");

                    if (amount >= order.FinalAmount)
                    {
                        order.IsPaid = true;
                        order.Status = OrderStatus.Processing;
                        await _db.SaveChangesAsync();
                        
                        Console.WriteLine($"✅ [GẠCH NỢ THÀNH CÔNG] Đơn hàng {order.OrderCode} đã được chuyển sang trạng thái Processing!");
                        return Ok(new { success = true, message = "Gạch nợ thành công" });
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Số tiền chuyển ({amount}) ít hơn số tiền cần thanh toán ({order.FinalAmount}).");
                    }
                }
                else
                {
                    Console.WriteLine($"⚠️ Không tìm thấy đơn hàng nào khớp với nội dung đã chuẩn hóa từ: '{content}'");
                }
            }

            return Ok(new { success = true, message = "Đã nhận webhook nhưng không khớp đơn" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"🔥 LỖI XỬ LÝ WEBHOOK: {ex.Message}");
            return Ok(new { success = false, message = ex.Message });
        }
    }
}
public record UpdateOrderStatusRequest(string Status);
public record BulkUpdateOrderStatusRequest(List<int> OrderIds, string Status);