USE WebHoaTuoiDb;
GO

-- Create USER table if it doesn't exist
IF OBJECT_ID('USER', 'U') IS NULL
BEGIN
    CREATE TABLE [USER] (
        id INT PRIMARY KEY,
        FullName NVARCHAR(255) NULL,
        Email NVARCHAR(255) NULL,
        PasswordHash NVARCHAR(255) NULL,
        Phone NVARCHAR(255) NULL,
        Address NVARCHAR(MAX) NULL,
        Role NVARCHAR(50) NULL,
        CreatedAt DATETIME NULL
    );
END;
GO

-- Create dummy Users table with identity to satisfy SET IDENTITY_INSERT Users ON
IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY
    );
END;
GO

-- Create OrderDetails table if it doesn't exist
IF OBJECT_ID('OrderDetails', 'U') IS NULL
BEGIN
    CREATE TABLE OrderDetails (
        id INT PRIMARY KEY,
        OrderId INT NULL,
        ProductId INT NULL,
        Quantity INT NULL,
        UnitPrice DECIMAL(18, 2) NULL
    );
END;
GO

-- Disable foreign key constraints so that mock values do not cause constraint violations
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";
GO

-- Add Type column to Orders if it doesn't exist
IF COL_LENGTH('Orders', 'Type') IS NULL
BEGIN
    ALTER TABLE Orders ADD Type NVARCHAR(50) NULL;
END;
GO

-- Make existing mandatory columns in Orders nullable to accept mock inserts
ALTER TABLE Orders ALTER COLUMN OrderCode NVARCHAR(MAX) NULL;
ALTER TABLE Orders ALTER COLUMN Status INT NULL;
ALTER TABLE Orders ALTER COLUMN ReceiverAddress NVARCHAR(MAX) NULL; -- Add this line
ALTER TABLE Orders ALTER COLUMN TotalAmount DECIMAL(18,2) NULL;
ALTER TABLE Orders ALTER COLUMN FinalAmount DECIMAL(18,2) NULL;
ALTER TABLE Orders ALTER COLUMN IsPaid BIT NULL;
ALTER TABLE Orders ALTER COLUMN CreatedAt DATETIME2 NULL;
ALTER TABLE Orders ALTER COLUMN IsStorePickup BIT NULL;
ALTER TABLE Orders ALTER COLUMN ShippingFee DECIMAL(18,2) NULL;
GO

-- Make Reviews columns nullable to accept mock inserts
ALTER TABLE Reviews ALTER COLUMN UserId NVARCHAR(450) NULL;
ALTER TABLE Reviews ALTER COLUMN IsApproved BIT NULL;
ALTER TABLE Reviews ALTER COLUMN IsVerifiedPurchase BIT NULL;
GO
