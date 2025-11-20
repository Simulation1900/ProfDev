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
        enableArithAbort: true
    }
};

async function testConnection() {
    console.log('========================================');
    console.log('Database Connection Test');
    console.log('========================================\n');

    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}\n`);

    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✓ Successfully connected to database!\n');

        // Run compatibility check
        console.log('Running compatibility check...\n');
        const compatScript = fs.readFileSync(
            path.join(__dirname, '..', 'database', 'check-compatibility.sql'),
            'utf8'
        );

        // Split by GO statements and execute each batch
        const batches = compatScript.split(/^\s*GO\s*$/im).filter(b => b.trim());

        for (const batch of batches) {
            if (batch.trim()) {
                try {
                    const result = await pool.request().query(batch);

                    // Print results
                    if (result.recordset && result.recordset.length > 0) {
                        console.table(result.recordset);
                    }
                } catch (err) {
                    // Some print statements may cause errors, ignore them
                    if (!err.message.includes('PRINT')) {
                        console.error('Batch error:', err.message);
                    }
                }
            }
        }

        console.log('\n========================================');
        console.log('Compatibility check complete!');
        console.log('========================================\n');

        await pool.close();
        process.exit(0);

    } catch (err) {
        console.error('\n✗ Connection failed!');
        console.error('Error:', err.message);
        console.error('\nPossible issues:');
        console.error('- Firewall blocking connection');
        console.error('- Incorrect credentials');
        console.error('- Database does not exist');
        console.error('- Network connectivity issues\n');
        process.exit(1);
    }
}

testConnection();
