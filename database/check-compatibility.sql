-- Database Compatibility Check Script
-- Run this against your TimeTracker database to verify compatibility
-- Before deploying the Professional Education Tracker

PRINT '========================================';
PRINT 'Professional Education Tracker';
PRINT 'Database Compatibility Check';
PRINT '========================================';
PRINT '';

-- Check 1: Users table exists
PRINT 'CHECK 1: Users Table Existence';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    PRINT '✓ Users table exists';

    -- Check required columns
    DECLARE @missingColumns NVARCHAR(MAX) = '';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'UserID')
        SET @missingColumns = @missingColumns + 'UserID, ';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Username')
        SET @missingColumns = @missingColumns + 'Username, ';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PasswordHash')
        SET @missingColumns = @missingColumns + 'PasswordHash, ';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsActive')
        SET @missingColumns = @missingColumns + 'IsActive, ';

    IF LEN(@missingColumns) > 0
    BEGIN
        SET @missingColumns = LEFT(@missingColumns, LEN(@missingColumns) - 1);
        PRINT '✗ WARNING: Missing required columns: ' + @missingColumns;
        PRINT '  You will need to modify api/db.js to match your schema';
    END
    ELSE
    BEGIN
        PRINT '✓ All required columns present';
    END

    -- Show actual Users table structure
    PRINT '';
    PRINT 'Current Users table structure:';
    SELECT
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Users'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '✗ CRITICAL: Users table does not exist!';
    PRINT '  This application requires a Users table in the TimeTracker database.';
END

PRINT '';
PRINT '========================================';

-- Check 2: Active users
PRINT 'CHECK 2: Active Users Count';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    DECLARE @activeUserCount INT;
    SELECT @activeUserCount = COUNT(*)
    FROM Users
    WHERE IsActive = 1;

    PRINT '✓ Active users found: ' + CAST(@activeUserCount AS NVARCHAR(10));

    IF @activeUserCount = 0
    BEGIN
        PRINT '✗ WARNING: No active users! Ensure IsActive = 1 for team members.';
    END

    -- Show active users (without passwords)
    PRINT '';
    PRINT 'Active users:';
    SELECT
        UserID,
        Username,
        CASE
            WHEN CHARINDEX(' ', FullName) > 0
            THEN FullName
            ELSE Username
        END AS DisplayName,
        Role
    FROM Users
    WHERE IsActive = 1
    ORDER BY FullName;
END

PRINT '';
PRINT '========================================';

-- Check 3: Password hashing
PRINT 'CHECK 3: Password Hash Format';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    DECLARE @sampleHash NVARCHAR(MAX);
    SELECT TOP 1 @sampleHash = PasswordHash
    FROM Users
    WHERE PasswordHash IS NOT NULL;

    IF @sampleHash IS NULL
    BEGIN
        PRINT '✗ WARNING: No password hashes found!';
    END
    ELSE IF LEFT(@sampleHash, 4) = '$2a$' OR LEFT(@sampleHash, 4) = '$2b$' OR LEFT(@sampleHash, 4) = '$2y$'
    BEGIN
        PRINT '✓ Passwords appear to be bcrypt hashed (compatible)';
        PRINT '  Sample format: ' + LEFT(@sampleHash, 7) + '...';
    END
    ELSE
    BEGIN
        PRINT '✗ WARNING: Passwords may not be bcrypt hashed!';
        PRINT '  Sample format: ' + LEFT(@sampleHash, 10) + '...';
        PRINT '  You may need to modify the authentication logic in api/auth.js';
    END
END

PRINT '';
PRINT '========================================';

-- Check 4: Education tables (should not exist yet)
PRINT 'CHECK 4: Education Tracker Tables';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'EducationEntries')
BEGIN
    PRINT '⚠ EducationEntries table already exists';

    DECLARE @entryCount INT;
    SELECT @entryCount = COUNT(*) FROM EducationEntries;
    PRINT '  Existing entries: ' + CAST(@entryCount AS NVARCHAR(10));
    PRINT '  Schema installation will be skipped.';
END
ELSE
BEGIN
    PRINT '✓ EducationEntries table does not exist (ready for installation)';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'EducationCategories')
BEGIN
    PRINT '⚠ EducationCategories table already exists';
END
ELSE
BEGIN
    PRINT '✓ EducationCategories table does not exist (ready for installation)';
END

PRINT '';
PRINT '========================================';

-- Check 5: Database permissions
PRINT 'CHECK 5: Current User Permissions';
PRINT 'Current user: ' + USER_NAME();
PRINT '';
PRINT 'Permissions on Users table:';
SELECT
    permission_name,
    state_desc
FROM sys.database_permissions dp
JOIN sys.objects o ON dp.major_id = o.object_id
WHERE o.name = 'Users'
  AND dp.grantee_principal_id = USER_ID();

PRINT '';
PRINT 'Recommended permissions for application user:';
PRINT '  - SELECT on Users (read-only)';
PRINT '  - SELECT, INSERT, DELETE on EducationEntries';
PRINT '  - EXECUTE on stored procedures';

PRINT '';
PRINT '========================================';

-- Check 6: Connection test
PRINT 'CHECK 6: Database Connection Info';
SELECT
    'Server: ' + @@SERVERNAME AS ServerInfo,
    'Database: ' + DB_NAME() AS DatabaseInfo,
    'Version: ' + CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(50)) AS VersionInfo,
    'Edition: ' + CAST(SERVERPROPERTY('Edition') AS NVARCHAR(50)) AS EditionInfo;

PRINT '';
PRINT '========================================';

-- Summary
PRINT 'COMPATIBILITY SUMMARY';
PRINT '';

DECLARE @compatible BIT = 1;
DECLARE @warnings INT = 0;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    PRINT '✗ CRITICAL: Cannot proceed without Users table';
    SET @compatible = 0;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    DECLARE @activeUsers INT;
    SELECT @activeUsers = COUNT(*) FROM Users WHERE IsActive = 1;

    IF @activeUsers = 0
    BEGIN
        PRINT '⚠ WARNING: No active users found';
        SET @warnings = @warnings + 1;
    END
END

IF @compatible = 1
BEGIN
    PRINT '✓ Database is compatible!';
    PRINT '';
    PRINT 'Next steps:';
    PRINT '1. Run database/schema.sql to create Education tables';
    PRINT '2. Configure local.settings.json with database credentials';
    PRINT '3. Test locally with: npm start';
    PRINT '4. Deploy to Azure following DEPLOYMENT_GUIDE.md';
END
ELSE
BEGIN
    PRINT '✗ Database compatibility issues detected';
    PRINT 'Please resolve the critical issues above before proceeding.';
END

IF @warnings > 0
BEGIN
    PRINT '';
    PRINT 'There are ' + CAST(@warnings AS NVARCHAR(10)) + ' warning(s) that should be reviewed.';
END

PRINT '';
PRINT '========================================';
PRINT 'Check complete - ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
