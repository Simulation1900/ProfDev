const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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
        enableArithAbort: true,
        connectTimeout: 30000
    }
};

async function setupDatabase() {
    console.log('========================================');
    console.log('Database Setup Script');
    console.log('========================================\n');

    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✓ Connected successfully!\n');

        // Read and execute schema script
        console.log('Creating database schema...');
        const schemaScript = fs.readFileSync(
            path.join(__dirname, '..', 'database', 'schema.sql'),
            'utf8'
        );

        // Split by GO statements
        const batches = schemaScript.split(/^\s*GO\s*$/im).filter(b => b.trim());

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i].trim();
            if (batch) {
                try {
                    await pool.request().query(batch);
                    console.log(`✓ Executed batch ${i + 1}/${batches.length}`);
                } catch (err) {
                    if (err.message.includes('already exists')) {
                        console.log(`⚠ Batch ${i + 1}: Object already exists (skipping)`);
                    } else {
                        console.error(`✗ Batch ${i + 1} error:`, err.message);
                    }
                }
            }
        }

        console.log('\n✓ Database schema created successfully!');

        // Verify tables were created
        console.log('\nVerifying tables...');
        const result = await pool.request().query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME IN ('EducationEntries', 'EducationCategories')
            ORDER BY TABLE_NAME
        `);

        if (result.recordset.length > 0) {
            console.log('✓ Created tables:');
            result.recordset.forEach(row => {
                console.log(`  - ${row.TABLE_NAME}`);
            });
        }

        // Check for active users
        console.log('\nChecking for active users...');
        const usersResult = await pool.request().query(`
            SELECT COUNT(*) as UserCount
            FROM Users
            WHERE IsActive = 1
        `);

        const userCount = usersResult.recordset[0].UserCount;
        console.log(`✓ Found ${userCount} active users`);

        if (userCount === 0) {
            console.log('\n⚠ WARNING: No active users found!');
            console.log('Make sure users have IsActive = 1 in the Users table.');
        }

        console.log('\n========================================');
        console.log('Database setup complete!');
        console.log('========================================\n');
        console.log('Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Open index.html in browser');
        console.log('3. Login with TimeTracker credentials\n');

        await pool.close();
        process.exit(0);

    } catch (err) {
        console.error('\n✗ Setup failed!');
        console.error('Error:', err.message);
        process.exit(1);
    }
}

setupDatabase();
