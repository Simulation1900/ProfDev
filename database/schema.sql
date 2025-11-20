-- SQL Schema for Professional Education Tracker
-- To be run on bucies.database.windows.net / OvertimeTracker database
-- This will add the education tracking tables to your existing database

-- Education Entries Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EducationEntries')
BEGIN
    CREATE TABLE EducationEntries (
        EntryID INT IDENTITY(1,1) PRIMARY KEY,
        UserID UNIQUEIDENTIFIER NOT NULL,
        ActivityDate DATE NOT NULL,
        Hours DECIMAL(4,2) NOT NULL CHECK (Hours > 0 AND Hours <= 24),
        Description NVARCHAR(1000) NOT NULL,
        Category NVARCHAR(100) NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ModifiedDate DATETIME NULL,

        -- Foreign key to existing Users table
        CONSTRAINT FK_EducationEntries_Users FOREIGN KEY (UserID)
            REFERENCES Users(id)
    );

    -- Index for performance
    CREATE INDEX IX_EducationEntries_UserID ON EducationEntries(UserID);
    CREATE INDEX IX_EducationEntries_ActivityDate ON EducationEntries(ActivityDate);
END
GO

-- Education Categories (Optional - for categorizing activities)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EducationCategories')
BEGIN
    CREATE TABLE EducationCategories (
        CategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );

    -- Insert default categories
    INSERT INTO EducationCategories (CategoryName, Description)
    VALUES
        ('Webinar', 'Online webinars and live presentations'),
        ('Podcast', 'Professional podcasts and audio content'),
        ('Article', 'Journal articles and publications'),
        ('Book', 'Professional books and textbooks'),
        ('Conference', 'Conference sessions and workshops'),
        ('Video Tutorial', 'YouTube videos and video tutorials'),
        ('Course', 'Online courses and structured learning'),
        ('Meeting', 'Professional meetings and discussions'),
        ('Other', 'Other professional development activities');
END
GO

-- View for monthly summaries
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_MonthlyEducationSummary')
    DROP VIEW vw_MonthlyEducationSummary;
GO

CREATE VIEW vw_MonthlyEducationSummary
AS
SELECT
    u.id AS UserID,
    u.full_name AS FullName,
    u.email AS Email,
    YEAR(e.ActivityDate) AS Year,
    MONTH(e.ActivityDate) AS Month,
    DATENAME(MONTH, e.ActivityDate) AS MonthName,
    SUM(e.Hours) AS TotalHours,
    COUNT(e.EntryID) AS ActivityCount,
    CASE
        WHEN SUM(e.Hours) >= 2.5 THEN 1
        ELSE 0
    END AS RequirementMet,
    CASE
        WHEN SUM(e.Hours) >= 2.5 THEN 0
        ELSE 2.5 - SUM(e.Hours)
    END AS HoursNeeded
FROM Users u
LEFT JOIN EducationEntries e ON u.id = e.UserID
GROUP BY
    u.id,
    u.full_name,
    u.email,
    YEAR(e.ActivityDate),
    MONTH(e.ActivityDate),
    DATENAME(MONTH, e.ActivityDate);
GO

-- View for yearly summaries
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_YearlyEducationSummary')
    DROP VIEW vw_YearlyEducationSummary;
GO

CREATE VIEW vw_YearlyEducationSummary
AS
SELECT
    u.id AS UserID,
    u.full_name AS FullName,
    u.email AS Email,
    YEAR(e.ActivityDate) AS Year,
    SUM(e.Hours) AS TotalHours,
    COUNT(e.EntryID) AS ActivityCount,
    AVG(e.Hours) AS AvgHoursPerActivity
FROM Users u
LEFT JOIN EducationEntries e ON u.id = e.UserID
GROUP BY
    u.id,
    u.full_name,
    u.email,
    YEAR(e.ActivityDate);
GO

-- Stored Procedure: Get Monthly Summary for specific month
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetMonthlyEducationSummary')
    DROP PROCEDURE sp_GetMonthlyEducationSummary;
GO

CREATE PROCEDURE sp_GetMonthlyEducationSummary
    @Year INT,
    @Month INT
AS
BEGIN
    SELECT
        u.id AS UserID,
        u.full_name AS FullName,
        u.email AS Email,
        ISNULL(SUM(e.Hours), 0) AS TotalHours,
        COUNT(e.EntryID) AS ActivityCount,
        CASE
            WHEN ISNULL(SUM(e.Hours), 0) >= 2.5 THEN 1
            ELSE 0
        END AS RequirementMet,
        CASE
            WHEN ISNULL(SUM(e.Hours), 0) >= 2.5 THEN 0
            ELSE 2.5 - ISNULL(SUM(e.Hours), 0)
        END AS HoursNeeded
    FROM Users u
    LEFT JOIN EducationEntries e ON u.id = e.UserID
        AND YEAR(e.ActivityDate) = @Year
        AND MONTH(e.ActivityDate) = @Month
    GROUP BY u.id, u.full_name, u.email
    ORDER BY u.full_name;
END
GO

-- Sample data migration script (optional - if you want to import existing data)
/*
-- Map team member names to UserIDs from your existing Users table
-- Update this mapping based on your actual UserID values

DECLARE @MemberMapping TABLE (FullName NVARCHAR(100), UserID INT);

INSERT INTO @MemberMapping (FullName, UserID)
SELECT 'Matt Needler', UserID FROM Users WHERE FullName = 'Matt Needler' OR Username = 'mneedler'
UNION ALL
SELECT 'Caroline Nelson', UserID FROM Users WHERE FullName = 'Caroline Nelson' OR Username = 'cnelson'
-- Add more mappings as needed

-- You would then insert the sample data here if migrating from localStorage
*/

PRINT 'Database schema created successfully!';
PRINT 'Next steps:';
PRINT '1. Verify that the Users table has the expected columns (UserID, Username, FullName, Role, PasswordHash, IsActive)';
PRINT '2. Ensure team members have accounts in the Users table';
PRINT '3. Configure API connection strings in local.settings.json';
