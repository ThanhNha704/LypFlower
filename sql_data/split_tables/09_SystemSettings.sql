-- File: 09_SystemSettings.sql

SET IDENTITY_INSERT [SystemSettings] ON;
GO
INSERT INTO [SystemSettings] ([Id], [Key], [Value], [UpdatedAt]) VALUES (1, N'ShopName', N'Lyp Flower', N'2026-08-11 04:10:09.175');
INSERT INTO [SystemSettings] ([Id], [Key], [Value], [UpdatedAt]) VALUES (2, N'Hotline', N'0922 222 686', N'2026-08-11 04:10:09.176');
INSERT INTO [SystemSettings] ([Id], [Key], [Value], [UpdatedAt]) VALUES (3, N'HeroBanner', N'/banner.png', N'2026-08-11 04:10:09.176');
INSERT INTO [SystemSettings] ([Id], [Key], [Value], [UpdatedAt]) VALUES (4, N'LogoUrl', N'🌸', N'2026-08-11 04:10:09.176');
SET IDENTITY_INSERT [SystemSettings] OFF;
GO

