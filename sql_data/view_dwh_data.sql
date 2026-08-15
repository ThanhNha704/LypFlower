USE HoaTuoi_DWH;
GO

-- 1. Xem 20 dòng dữ liệu mới nhất từ bảng Sự kiện Bán Hàng (Fact_Sales)
-- Bản này đã tính toán sẵn Thành Tiền (TotalAmount) và Lợi Nhuận (Profit)
SELECT TOP 20 * 
FROM Fact_Sales 
ORDER BY SalesKey DESC;

-- 2. Xem Báo cáo Doanh Thu Khái Quát (Kết nối Fact và các bảng Dim)
-- Câu lệnh này giúp bạn thấy rõ DWH đang hoạt động như thế nào
SELECT TOP 20
    fs.OrderId AS [Mã Đơn OLTP],
    dt.FullDate AS [Ngày Mua],
    dc.FullName AS [Tên Khách Hàng],
    dp.ProductName AS [Tên Sản Phẩm],
    dp.CategoryName AS [Danh Mục],
    fs.Quantity AS [Số Lượng],
    fs.UnitPrice AS [Đơn Giá],
    fs.TotalAmount AS [Thành Tiền],
    fs.Profit AS [Lợi Nhuận]
FROM Fact_Sales fs
JOIN Dim_Time dt ON fs.TimeKey = dt.TimeKey
JOIN Dim_Customer dc ON fs.CustomerKey = dc.CustomerKey
JOIN Dim_Product dp ON fs.ProductKey = dp.ProductKey
ORDER BY fs.TotalAmount DESC;

-- 3. Kiểm tra xem tổng cộng có chính xác bao nhiêu Chi tiết đơn hàng và Doanh thu
SELECT 
    COUNT(SalesKey) AS [Tổng Số Dòng Đã Load (5000)],
    SUM(TotalAmount) AS [Tổng Doanh Thu Hệ Thống],
    SUM(Profit) AS [Tổng Lợi Nhuận Hệ Thống]
FROM Fact_Sales;
