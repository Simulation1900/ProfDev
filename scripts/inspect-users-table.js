const sql = require('mssql');
const fs = require('fs');

// Load configuration
const settings = JSON.parse(fs.readFileSync('local.settings.json', 'utf8'));

const config = {
    server: settings.Values.SQL_SERVER,
    database: settings.Values.SQL_DATABASE,
    user: settings.Values.SQL_USER,
    password: settings.Values.SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

async function inspectUsersTable() {
    console.log('========================================');
    console.log('Users Table Inspection');
    console.log('========================================\n');

    try {
        const pool = await sql.connect(config);
        console.log('✓ Connected to database\n');

        // Check if Users table exists
        console.log('Checking for Users table...');
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = 'Users'
        `);

        if (tableCheck.recordset.length === 0) {
            console.log('✗ Users table does not exist!\n');
            console.log('Listing all tables in database:');
            const allTables = await pool.request().query(`
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            `);
            console.table(allTables.recordset);
            await pool.close();
            return;
        }

        console.log('✓ Users table exists\n');

        // Get table structure
        console.log('Users table structure:');
        const columns = await pool.request().query(`
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `);
        console.table(columns.recordset);

        // Get sample data (without passwords)
        console.log('\nSample users (first 10):');
        const users = await pool.request().query(`
            SELECT TOP 10 *
            FROM Users
        `);

        if (users.recordset.length > 0) {
            // Show first record keys
            console.log('\nAvailable columns:', Object.keys(users.recordset[0]).join(', '));
            console.log('\nUser records:');
            console.table(users.recordset.map(u => {
                // Hide password hash
                const user = { ...u };
                if (user.PasswordHash) user.PasswordHash = '***HIDDEN***';
                if (user.Password) user.Password = '***HIDDEN***';
                return user;
            }));
        } else {
            console.log('⚠ No users found in table');
        }

        // Count total users
        const count = await pool.request().query('SELECT COUNT(*) as Total FROM Users');
        console.log(`\nTotal users: ${count.recordset[0].Total}`);

        await pool.close();

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectUsersTable();
