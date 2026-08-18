USE HoaTuoi_DWH;
GO

CREATE OR ALTER PROCEDURE sp_ETL_Load_HoaTuoi_DWH
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Load Dim_Customer (lay tu AspNetUsers - bang chinh cua ASP.NET Identity)
    MERGE Dim_Customer AS T
    USING (
        SELECT Id, FullName, Email, PhoneNumber AS Phone, DefaultAddress AS Address, CreatedAt
        FROM WebHoaTuoiDb.dbo.AspNetUsers
    ) AS S ON T.CustomerId = S.Id
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (CustomerId, FullName, Email, Phone, Address, CreatedAt)
        VALUES (S.Id, ISNULL(S.FullName, 'Unknown'), ISNULL(S.Email, 'N/A'), S.Phone, S.Address, S.CreatedAt)
    WHEN MATCHED THEN
        UPDATE SET
            T.FullName = ISNULL(S.FullName, 'Unknown'),
            T.Email = ISNULL(S.Email, 'N/A'),
            T.Phone = S.Phone,
            T.Address = S.Address;

    -- 2. Load Dim_Product (lay tu WebHoaTuoiDb)
    MERGE Dim_Product AS T
    USING (
        SELECT p.Id, p.Name, p.Price, c.Name AS CategoryName
        FROM WebHoaTuoiDb.dbo.Products p
        LEFT JOIN WebHoaTuoiDb.dbo.Categories c ON p.CategoryId = c.Id
    ) AS S ON T.ProductId = S.Id
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (ProductId, ProductName, CategoryName, Price, Cost, Status)
        VALUES (S.Id, S.Name, ISNULL(S.CategoryName, 'Uncategorized'), S.Price, S.Price * 0.7, 'Active')
    WHEN MATCHED THEN
        UPDATE SET
            T.ProductName = S.Name,
            T.CategoryName = ISNULL(S.CategoryName, 'Uncategorized'),
            T.Price = S.Price;

    -- 3. Load Dim_Time (lay tu bang Orders trong WebHoaTuoiDb)
    MERGE Dim_Time AS T
    USING (
        SELECT DISTINCT
            CAST(CONVERT(VARCHAR(8), CreatedAt, 112) AS INT) AS TimeKey,
            CAST(CreatedAt AS DATE) AS FullDate,
            DAY(CreatedAt) AS Day,
            MONTH(CreatedAt) AS Month,
            DATENAME(MONTH, CreatedAt) AS MonthName,
            DATEPART(QUARTER, CreatedAt) AS Quarter,
            YEAR(CreatedAt) AS Year,
            DATENAME(WEEKDAY, CreatedAt) AS DayOfWeek,
            CASE WHEN DATEPART(WEEKDAY, CreatedAt) IN (1, 7) THEN 1 ELSE 0 END AS IsWeekend
        FROM WebHoaTuoiDb.dbo.Orders
        WHERE CreatedAt IS NOT NULL
    ) AS S ON T.TimeKey = S.TimeKey
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (TimeKey, FullDate, Day, Month, MonthName, Quarter, Year, DayOfWeek, IsWeekend)
        VALUES (S.TimeKey, S.FullDate, S.Day, S.Month, S.MonthName, S.Quarter, S.Year, S.DayOfWeek, S.IsWeekend);

    -- 4. Load Fact_Sales
    -- Them dummy customer neu chua co
    IF NOT EXISTS(SELECT 1 FROM Dim_Customer WHERE CustomerId = '-1')
    BEGIN
        INSERT INTO Dim_Customer (CustomerId, FullName, Email, Phone, Address, City)
        VALUES ('-1', 'Unknown Guest', 'N/A', 'N/A', 'N/A', 'N/A');
    END

    MERGE Fact_Sales AS T
    USING (
        SELECT
            ISNULL(dc.CustomerKey, (SELECT TOP 1 CustomerKey FROM Dim_Customer WHERE CustomerId = '-1')) AS CustomerKey,
            ISNULL(dp.ProductKey, -1) AS ProductKey,
            dt.TimeKey,
            o.Id AS OrderId,
            oi.Id AS OrderDetailId,
            oi.Quantity,
            oi.UnitPrice,
            -- Tinh toan chiet khau ti le cho tung dong mat hang: (LineTotal * DiscountAmount_Order) / TotalAmount_Order
            CASE 
                WHEN o.TotalAmount = 0 THEN 0 
                ELSE ROUND((oi.Quantity * oi.UnitPrice * ISNULL(o.DiscountAmount, 0)) / o.TotalAmount, 2)
            END AS DiscountAmount,
            (oi.Quantity * oi.UnitPrice) AS TotalAmount,
            -- Tinh toan loi nhuan: Doanh thu - Chiet khau - Gia von (Quantity * Cost)
            ((oi.Quantity * oi.UnitPrice) - CASE WHEN o.TotalAmount = 0 THEN 0 ELSE ROUND((oi.Quantity * oi.UnitPrice * ISNULL(o.DiscountAmount, 0)) / o.TotalAmount, 2) END - (oi.Quantity * ISNULL(dp.Cost, oi.UnitPrice * 0.7))) AS Profit
        FROM WebHoaTuoiDb.dbo.Orders o
        JOIN WebHoaTuoiDb.dbo.OrderItems oi ON o.Id = oi.OrderId
        LEFT JOIN Dim_Customer dc ON o.UserId = dc.CustomerId
        LEFT JOIN Dim_Product dp ON oi.ProductId = dp.ProductId
        LEFT JOIN Dim_Time dt ON CAST(CONVERT(VARCHAR(8), o.CreatedAt, 112) AS INT) = dt.TimeKey
        WHERE dt.TimeKey IS NOT NULL
          AND o.Status IS NOT NULL
          AND o.Status != 4
          AND o.Status != 5
    ) AS S ON T.OrderId = S.OrderId AND T.OrderDetailId = S.OrderDetailId
    WHEN MATCHED THEN
        UPDATE SET
            T.CustomerKey = S.CustomerKey,
            T.ProductKey = S.ProductKey,
            T.TimeKey = S.TimeKey,
            T.Quantity = S.Quantity,
            T.UnitPrice = S.UnitPrice,
            T.DiscountAmount = S.DiscountAmount,
            T.TotalAmount = S.TotalAmount,
            T.Profit = S.Profit
    WHEN NOT MATCHED THEN
        INSERT (CustomerKey, ProductKey, TimeKey, OrderId, OrderDetailId, Quantity, UnitPrice, DiscountAmount, TotalAmount, Profit)
        VALUES (S.CustomerKey, S.ProductKey, S.TimeKey, S.OrderId, S.OrderDetailId, S.Quantity, S.UnitPrice, S.DiscountAmount, S.TotalAmount, S.Profit);

    -- 5. Loại bỏ các đơn hàng bị huỷ hoặc hoàn tiền khỏi Fact_Sales nếu trước đó đã được đồng bộ
    DELETE FROM Fact_Sales
    WHERE OrderId IN (
        SELECT Id 
        FROM WebHoaTuoiDb.dbo.Orders
        WHERE Status = 4 OR Status = 5 OR Status IS NULL
    );

    PRINT 'ETL Load Completed Successfully.';
END
GO
