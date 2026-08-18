-- ==========================================
-- CÁC CÂU LỆNH SQL DÀNH CHO POWER BI (LY SỬ DỤNG)
-- ==========================================
USE HoaTuoi_DWH;
GO

-- 1. DOANH THU THEO THÁNG (Revenue by Month)
-- Dùng biểu đồ Cột (Column Chart) hoặc Đường (Line Chart)
SELECT 
    dt.Year AS [Năm],
    dt.Month AS [Tháng],
    SUM(fs.TotalAmount) AS [Tổng Doanh Thu],
    SUM(fs.Profit) AS [Tổng Lợi Nhuận]
FROM Fact_Sales fs
JOIN Dim_Time dt ON fs.TimeKey = dt.TimeKey
GROUP BY dt.Year, dt.Month
ORDER BY dt.Year, dt.Month;

-- 2. TOP HOA BÁN CHẠY NHẤT (Top Selling Products)
-- Dùng biểu đồ Thanh ngang (Bar Chart)
SELECT TOP 10
    dp.ProductName AS [Tên Sản Phẩm],
    dp.CategoryName AS [Danh Mục],
    SUM(fs.Quantity) AS [Số Lượng Đã Bán],
    SUM(fs.TotalAmount) AS [Doanh Thu Thu Được]
FROM Fact_Sales fs
JOIN Dim_Product dp ON fs.ProductKey = dp.ProductKey
GROUP BY dp.ProductName, dp.CategoryName
ORDER BY SUM(fs.Quantity) DESC;

-- 3. PHÂN KHÚC KHÁCH HÀNG (Customer Segmentation)
-- Phân loại theo số tiền chi tiêu (Dùng biểu đồ Tròn - Pie Chart)
WITH CustomerSpending AS (
    SELECT 
        dc.CustomerKey,
        dc.FullName,
        SUM(fs.TotalAmount) AS TotalSpent
    FROM Fact_Sales fs
    JOIN Dim_Customer dc ON fs.CustomerKey = dc.CustomerKey
    WHERE dc.CustomerKey != -1 -- Bỏ qua khách hàng vãng lai/không xác định
    GROUP BY dc.CustomerKey, dc.FullName
)
SELECT 
    CASE 
        WHEN TotalSpent >= 5000000 THEN N'Khách hàng VIP (>5 triệu)'
        WHEN TotalSpent >= 2000000 THEN N'Khách hàng Thân Thiết (2-5 triệu)'
        ELSE N'Khách hàng Phổ Thông (<2 triệu)'
    END AS [Phân Khúc],
    COUNT(CustomerKey) AS [Số Lượng Khách Hàng],
    SUM(TotalSpent) AS [Tổng Doanh Thu Nhóm]
FROM CustomerSpending
GROUP BY 
    CASE 
        WHEN TotalSpent >= 5000000 THEN N'Khách hàng VIP (>5 triệu)'
        WHEN TotalSpent >= 2000000 THEN N'Khách hàng Thân Thiết (2-5 triệu)'
        ELSE N'Khách hàng Phổ Thông (<2 triệu)'
    END;
