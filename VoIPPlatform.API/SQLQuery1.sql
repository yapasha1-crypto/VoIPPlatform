-- تنظيف كل البيانات من جميع الجداول
-- احذر: هذا سيحذف كل شيء!

DELETE FROM [VoIPPlatformDb].[dbo].[ContactNumbers];
DELETE FROM [VoIPPlatformDb].[dbo].[Transactions];
DELETE FROM [VoIPPlatformDb].[dbo].[Calls];
DELETE FROM [VoIPPlatformDb].[dbo].[SMS];
DELETE FROM [VoIPPlatformDb].[dbo].[Accounts];
DELETE FROM [VoIPPlatformDb].[dbo].[Users];

-- اختياري: إعادة تعيين الـ Identity
DBCC CHECKIDENT ('[VoIPPlatformDb].[dbo].[Users]', RESEED, 0);
DBCC CHECKIDENT ('[VoIPPlatformDb].[dbo].[Accounts]', RESEED, 0);
DBCC CHECKIDENT ('[VoIPPlatformDb].[dbo].[Calls]', RESEED, 0);
DBCC CHECKIDENT ('[VoIPPlatformDb].[dbo].[SMS]', RESEED, 0);
DBCC CHECKIDENT ('[VoIPPlatformDb].[dbo].[Transactions]', RESEED, 0);
DBCC CHECKIDENT ('[VoIPPlatformDb].[dbo].[ContactNumbers]', RESEED, 0);
