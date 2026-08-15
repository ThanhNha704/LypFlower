USE HoaTuoi_DWH;
GO

CREATE OR ALTER PROCEDURE sp_ETL_Load_HoaTuoi_DWH
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Load Dim_Customer
    MERGE Dim_Customer AS T
    USING (
        SELECT Id, FullName, Email, Phone, Address, CreatedAt
        FROM FlowerDW.dbo.[USER]
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

    -- 2. Load Dim_Product
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

    -- Handle any missing products from OrderDetails
    INSERT INTO Dim_Product (ProductId, ProductName, CategoryName, Price, Cost, Status)
    SELECT DISTINCT od.ProductId, 'Product ' + CAST(od.ProductId AS NVARCHAR(50)), 'Unknown', MAX(od.UnitPrice), MAX(od.UnitPrice)*0.7, 'Inactive'
    FROM FlowerDW.dbo.OrderDetails od
    WHERE NOT EXISTS (SELECT 1 FROM Dim_Product dp WHERE dp.ProductId = od.ProductId)
    GROUP BY od.ProductId;


    -- 3. Load Dim_Time
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
    -- Note: We truncate the Fact table to prevent duplicate inserts for this test.
    -- In a real scenario, you'd use incremental loading (MERGE or DELETE WHERE TimeKey...).
    TRUNCATE TABLE Fact_Sales;

    -- Insert missing dummy customer if a UserId doesn't exist in USER table
    IF NOT EXISTS(SELECT 1 FROM Dim_Customer WHERE CustomerId = -1)
    BEGIN
        SET IDENTITY_INSERT Dim_Customer ON;
        INSERT INTO Dim_Customer (CustomerKey, CustomerId, FullName, Email, Phone, Address, City)
        VALUES (-1, -1, 'Unknown', 'N/A', 'N/A', 'N/A', 'N/A');
        SET IDENTITY_INSERT Dim_Customer OFF;
    END

    INSERT INTO Fact_Sales (CustomerKey, ProductKey, TimeKey, OrderId, OrderDetailId, Quantity, UnitPrice, DiscountAmount, TotalAmount, Profit)
    SELECT 
        ISNULL(dc.CustomerKey, (SELECT CustomerKey FROM Dim_Customer WHERE CustomerId = -1)) AS CustomerKey,
        ISNULL(dp.ProductKey, -1) AS ProductKey,
        dt.TimeKey,
        o.Id AS OrderId,
        od.Id AS OrderDetailId,
        od.Quantity,
        od.UnitPrice,
        0 AS DiscountAmount,
        (od.Quantity * od.UnitPrice) AS TotalAmount,
        ((od.Quantity * od.UnitPrice) - (od.Quantity * ISNULL(dp.Cost, od.UnitPrice * 0.7))) AS Profit
    FROM FlowerDW.dbo.Orders o
    JOIN FlowerDW.dbo.OrderDetails od ON o.Id = od.OrderId
    JOIN WebHoaTuoiDb.dbo.Orders wo ON o.Id = wo.Id
    LEFT JOIN Dim_Customer dc ON o.UserId = dc.CustomerId
    LEFT JOIN Dim_Product dp ON od.ProductId = dp.ProductId
    LEFT JOIN Dim_Time dt ON CAST(CONVERT(VARCHAR(8), wo.CreatedAt, 112) AS INT) = dt.TimeKey;

    PRINT 'ETL Load Completed Successfully.';
END
GO
