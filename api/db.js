const sql = require('mssql');

// SQL Server configuration
const config = {
    server: process.env.SQL_SERVER || 'bucies.database.windows.net',
    database: process.env.SQL_DATABASE || 'TimeTracker',
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

// Get or create connection pool
async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

// Authentication - Read-only from existing OvertimeTracker database
async function authenticateUser(email, password) {
    try {
        const pool = await getPool();

        // Query to check user credentials (READ-ONLY)
        // Adapted for OvertimeTracker schema: id, email, full_name, role, password_hash
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`
                SELECT
                    id,
                    email,
                    full_name,
                    role,
                    password_hash
                FROM Users
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        const user = result.recordset[0];

        // Verify password (bcrypt hashed passwords)
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return null;
        }

        // Return user info without password
        return {
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role
        };
    } catch (err) {
        console.error('Authentication error:', err);
        throw err;
    }
}

// Get all active users (READ-ONLY)
async function getActiveUsers() {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT
                    id,
                    email,
                    full_name,
                    role
                FROM Users
                ORDER BY full_name
            `);

        return result.recordset;
    } catch (err) {
        console.error('Error fetching users:', err);
        throw err;
    }
}

// Education tracking database operations
async function addEducationEntry(entry) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.UniqueIdentifier, entry.userId)
            .input('activityDate', sql.Date, entry.date)
            .input('hours', sql.Decimal(4, 2), entry.hours)
            .input('description', sql.NVarChar, entry.description)
            .input('category', sql.NVarChar, entry.category || 'General')
            .query(`
                INSERT INTO EducationEntries (UserID, ActivityDate, Hours, Description, Category, CreatedDate)
                OUTPUT INSERTED.*
                VALUES (@userId, @activityDate, @hours, @description, @category, GETDATE())
            `);

        return result.recordset[0];
    } catch (err) {
        console.error('Error adding education entry:', err);
        throw err;
    }
}

async function getEducationEntries(userId = null, startDate = null, endDate = null) {
    try {
        const pool = await getPool();
        let query = `
            SELECT
                e.EntryID,
                e.UserID,
                u.full_name,
                u.email,
                e.ActivityDate,
                e.Hours,
                e.Description,
                e.Category,
                e.CreatedDate
            FROM EducationEntries e
            INNER JOIN Users u ON e.UserID = u.id
            WHERE 1=1
        `;

        const request = pool.request();

        if (userId) {
            query += ' AND e.UserID = @userId';
            request.input('userId', sql.UniqueIdentifier, userId);
        }

        if (startDate) {
            query += ' AND e.ActivityDate >= @startDate';
            request.input('startDate', sql.Date, startDate);
        }

        if (endDate) {
            query += ' AND e.ActivityDate <= @endDate';
            request.input('endDate', sql.Date, endDate);
        }

        query += ' ORDER BY e.ActivityDate DESC, e.CreatedDate DESC';

        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Error fetching education entries:', err);
        throw err;
    }
}

async function deleteEducationEntry(entryId, userId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('entryId', sql.Int, entryId)
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                DELETE FROM EducationEntries
                WHERE EntryID = @entryId AND UserID = @userId
            `);

        return result.rowsAffected[0] > 0;
    } catch (err) {
        console.error('Error deleting education entry:', err);
        throw err;
    }
}

async function getMonthlyHoursSummary(year, month) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
                SELECT
                    u.id as UserID,
                    u.full_name as FullName,
                    ISNULL(SUM(e.Hours), 0) as TotalHours,
                    COUNT(e.EntryID) as EntryCount,
                    CASE
                        WHEN ISNULL(SUM(e.Hours), 0) >= 2.5 THEN 1
                        ELSE 0
                    END as RequirementMet
                FROM Users u
                LEFT JOIN EducationEntries e ON u.id = e.UserID
                    AND YEAR(e.ActivityDate) = @year
                    AND MONTH(e.ActivityDate) = @month
                GROUP BY u.id, u.full_name
                ORDER BY u.full_name
            `);

        return result.recordset;
    } catch (err) {
        console.error('Error fetching monthly summary:', err);
        throw err;
    }
}

module.exports = {
    getPool,
    authenticateUser,
    getActiveUsers,
    addEducationEntry,
    getEducationEntries,
    deleteEducationEntry,
    getMonthlyHoursSummary
};
