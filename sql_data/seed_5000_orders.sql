USE FlowerDW;
GO

DECLARE @CurrentCount INT;
SELECT @CurrentCount = COUNT(*) FROM FlowerDW.dbo.Orders;

IF @CurrentCount < 5000
BEGIN
    DECLARE @RowsNeeded INT = 5000 - @CurrentCount;
    DECLARE @MaxOrderId INT;
    SELECT @MaxOrderId = ISNULL(MAX(Id), 0) FROM FlowerDW.dbo.Orders;
    
    DECLARE @MaxDetailId INT;
    SELECT @MaxDetailId = ISNULL(MAX(Id), 0) FROM FlowerDW.dbo.OrderDetails;

    WITH E1(N) AS (SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1),
         E2(N) AS (SELECT 1 FROM E1 a, E1 b),
         E4(N) AS (SELECT 1 FROM E2 a, E2 b),
         Tally(N) AS (SELECT TOP (@RowsNeeded) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) FROM E4)
    SELECT 
        @MaxOrderId + N AS Id,
        (ABS(CHECKSUM(NEWID())) % 1000) + 1 AS UserId,
        'Retail' AS Type,
        'Mock Receiver ' + CAST(@MaxOrderId + N AS NVARCHAR(50)) AS ReceiverName,
        '090' + RIGHT('0000000' + CAST(@MaxOrderId + N AS NVARCHAR(50)), 7) AS ReceiverPhone,
        DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 365), GETDATE()) AS CreatedAt
    INTO #TempOrders
    FROM Tally;

    -- Insert into FlowerDW.dbo.Orders
    INSERT INTO FlowerDW.dbo.Orders (Id, UserId, Type, ReceiverName, ReceiverPhone)
    SELECT Id, UserId, Type, ReceiverName, ReceiverPhone FROM #TempOrders;

    -- Insert into WebHoaTuoiDb.dbo.Orders
    SET IDENTITY_INSERT WebHoaTuoiDb.dbo.Orders ON;
    INSERT INTO WebHoaTuoiDb.dbo.Orders (Id, OrderCode, UserId, Status, ReceiverName, ReceiverPhone, ReceiverAddress, CreatedAt, TotalAmount, FinalAmount, ShippingFee)
    SELECT 
        Id, 
        'ORDMOCK' + CAST(Id AS NVARCHAR(50)), 
        CAST(UserId AS NVARCHAR(450)), 
        3, 
        ReceiverName, 
        ReceiverPhone, 
        'Mock Address', 
        CreatedAt, 
        500000, 
        550000, 
        50000
    FROM #TempOrders;
    SET IDENTITY_INSERT WebHoaTuoiDb.dbo.Orders OFF;

    -- Insert into FlowerDW.dbo.OrderDetails
    -- Note: This assigns a random product ID from the known range and a mock UnitPrice
    INSERT INTO FlowerDW.dbo.OrderDetails (Id, OrderId, ProductId, Quantity, UnitPrice)
    SELECT 
        @MaxDetailId + ROW_NUMBER() OVER(ORDER BY Id) AS Id,
        Id AS OrderId,
        (ABS(CHECKSUM(NEWID())) % 132) + 4056 AS ProductId,
        (ABS(CHECKSUM(NEWID())) % 5) + 1 AS Quantity,
        500000 AS UnitPrice
    FROM #TempOrders;
    
    DROP TABLE #TempOrders;
    PRINT 'Generated missing orders successfully.';
END
ELSE
BEGIN
    PRINT 'Already have 5000 or more orders.';
END
GO
