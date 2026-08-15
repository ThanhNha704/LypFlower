-- 1. THỐNG KÊ DOANH THU THEO THÁNG VÀ NĂM (Dùng để vẽ biểu đồ đường Doanh thu)
SELECT 
    YEAR(CreatedAt) AS Nam,
    MONTH(CreatedAt) AS Thang,
    COUNT(Id) AS TongSoDonHang,
    SUM(TotalAmount) AS DoanhThuThuan,
    SUM(ShippingFee) AS TongPhiShip,
    SUM(FinalAmount) AS TongDoanhThuCuoi
FROM Orders
WHERE Status = 'Completed'
GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
ORDER BY Nam DESC, Thang DESC;

-- 2. TOP 5 SẢN PHẨM HOA BÁN CHẠY NHẤT (Dùng hiển thị bảng vinh danh sản phẩm hot)
SELECT TOP 5 
    od.ProductId,
    SUM(od.Quantity) AS TongSoLuongBan,
    SUM(od.Quantity * od.UnitPrice) AS TongDoanhThuSanPham
FROM OrderDetails od
JOIN Orders o ON od.OrderId = o.Id
WHERE o.Status = 'Completed'
GROUP BY od.ProductId
ORDER BY TongSoLuongBan DESC;

-- 3. TỈ LỆ PHẦN TRĂM CÁC TRẠNG THÁI ĐƠN HÀNG (Dùng vẽ biểu đồ tròn tròn quản lý đơn)
SELECT 
    Status,
    COUNT(Id) AS SoLuong,
    ROUND(COUNT(Id) * 100.0 / (SELECT COUNT(*) FROM Orders), 2) AS TiLePhanTram
FROM Orders
GROUP BY Status;
