-- ==========================================
-- SCRIPT KHỞI TẠO DATA WAREHOUSE (HoaTuoi_DWH)
-- Sơ đồ hình sao (Star Schema) cho phân tích bán hàng
-- ==========================================

-- 1. Tạo Database HoaTuoi_DWH
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'HoaTuoi_DWH')
BEGIN
    CREATE DATABASE HoaTuoi_DWH;
END
GO

USE HoaTuoi_DWH;
GO

-- 2. Tạo bảng Dim_Customer (Chiều thông tin Khách hàng)
IF OBJECT_ID('Dim_Customer', 'U') IS NULL
BEGIN
    CREATE TABLE Dim_Customer (
        CustomerKey INT IDENTITY(1,1) PRIMARY KEY, -- Khóa chính surrogate key cho DWH
        CustomerId NVARCHAR(450) NOT NULL,          -- Mã khách hàng từ hệ thống nguồn (OLTP)
        FullName NVARCHAR(255) NULL,
        Email NVARCHAR(255) NULL,
        Phone NVARCHAR(50) NULL,
        Address NVARCHAR(MAX) NULL,
        City NVARCHAR(100) NULL,
        CreatedAt DATETIME NULL
    );
END
GO

-- 3. Tạo bảng Dim_Product (Chiều thông tin Sản phẩm)
IF OBJECT_ID('Dim_Product', 'U') IS NULL
BEGIN
    CREATE TABLE Dim_Product (
        ProductKey INT IDENTITY(1,1) PRIMARY KEY,  -- Khóa chính surrogate key cho DWH
        ProductId INT NOT NULL,                    -- Mã sản phẩm từ hệ thống nguồn (OLTP)
        ProductName NVARCHAR(255) NULL,
        CategoryName NVARCHAR(100) NULL,
        Price DECIMAL(18,2) NULL,                  -- Giá bán hiện tại
        Cost DECIMAL(18,2) NULL,                   -- Giá vốn (để tính lợi nhuận)
        Status NVARCHAR(50) NULL
    );
END
GO

-- 4. Tạo bảng Dim_Time (Chiều thông tin Thời gian)
IF OBJECT_ID('Dim_Time', 'U') IS NULL
BEGIN
    CREATE TABLE Dim_Time (
        TimeKey INT PRIMARY KEY,                   -- Khóa chính dạng YYYYMMDD (ví dụ: 20260714)
        FullDate DATE NOT NULL,
        Day INT NOT NULL,
        Month INT NOT NULL,
        MonthName NVARCHAR(50) NOT NULL,
        Quarter INT NOT NULL,
        Year INT NOT NULL,
        DayOfWeek NVARCHAR(50) NOT NULL,
        IsWeekend BIT NOT NULL
    );
END
GO

-- 5. Tạo bảng Fact_Sales (Bảng sự kiện bán hàng)
IF OBJECT_ID('Fact_Sales', 'U') IS NULL
BEGIN
    CREATE TABLE Fact_Sales (
        SalesKey INT IDENTITY(1,1) PRIMARY KEY,    -- Khóa chính của bảng Fact
        CustomerKey INT NOT NULL,                  -- Khóa ngoại liên kết Dim_Customer
        ProductKey INT NOT NULL,                   -- Khóa ngoại liên kết Dim_Product
        TimeKey INT NOT NULL,                      -- Khóa ngoại liên kết Dim_Time
        OrderId INT NOT NULL,                      -- Mã đơn hàng từ nguồn OLTP (phục vụ đối chiếu)
        OrderDetailId INT NOT NULL,                -- Mã chi tiết đơn hàng từ nguồn OLTP
        Quantity INT NOT NULL,                     -- Số lượng bán ra
        UnitPrice DECIMAL(18,2) NOT NULL,          -- Đơn giá bán thực tế
        DiscountAmount DECIMAL(18,2) DEFAULT 0,    -- Số tiền chiết khấu / giảm giá
        TotalAmount DECIMAL(18,2) NOT NULL,        -- Doanh thu thuần = (Quantity * UnitPrice) - DiscountAmount
        Profit DECIMAL(18,2) NULL,                 -- Lợi nhuận = TotalAmount - (Quantity * Cost)
        
        -- Định nghĩa các ràng buộc khóa ngoại (Foreign Keys)
        CONSTRAINT FK_FactSales_Customer FOREIGN KEY (CustomerKey) REFERENCES Dim_Customer(CustomerKey),
        CONSTRAINT FK_FactSales_Product FOREIGN KEY (ProductKey) REFERENCES Dim_Product(ProductKey),
        CONSTRAINT FK_FactSales_Time FOREIGN KEY (TimeKey) REFERENCES Dim_Time(TimeKey)
    );
END
GO

-- Tạo chỉ mục để tăng tốc độ truy vấn liên kết bảng (BI/PowerBI)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FactSales_Keys' AND object_id = OBJECT_ID('Fact_Sales'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FactSales_Keys ON Fact_Sales(CustomerKey, ProductKey, TimeKey);
END
GO
