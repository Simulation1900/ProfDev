# Azure SQL Firewall Setup

Your local machine cannot currently connect to bucies.database.windows.net. You need to add your IP address to the firewall rules.

## Option 1: Add Your IP via Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **SQL servers**
3. Find and click on **bucies**
4. In the left menu, click **Networking** (or **Firewalls and virtual networks**)
5. Click **+ Add your client IPv4 address** button
6. Your current IP will be automatically detected and added
7. Click **Save**
8. Wait 30 seconds for the rule to propagate
9. Try connecting again: `node scripts/test-connection.js`

## Option 2: Add IP Range Manually

If you need to add a specific IP or range:

1. Follow steps 1-4 above
2. Click **+ Add a firewall rule**
3. Enter:
   - **Rule name**: MyLocalMachine
   - **Start IP**: [your public IP]
   - **End IP**: [your public IP]
4. Click **OK**
5. Click **Save**

To find your public IP:
```bash
curl ifconfig.me
```

## Option 3: Use Azure Cloud Shell (No Firewall Needed)

If you can't modify firewall rules, you can run the SQL scripts from Azure Cloud Shell:

1. Go to [Azure Portal](https://portal.azure.com)
2. Click the Cloud Shell icon (>_) in the top toolbar
3. Choose **Bash** or **PowerShell**
4. Connect to your database:
```bash
sqlcmd -S bucies.database.windows.net -d TimeTracker -U simcenter -P 'Belmont1900!' -G
```

5. Copy and paste the contents of `database/check-compatibility.sql`
6. Then copy and paste the contents of `database/schema.sql`

## Option 4: Allow All Azure Services

**WARNING**: Less secure, but works for testing

1. In Azure Portal → SQL Server → Networking
2. Toggle **Allow Azure services and resources to access this server** to **Yes**
3. Click **Save**

This allows any Azure service to connect (including your deployment).

## After Firewall is Configured

Once your IP is added, test the connection:

```bash
node scripts/test-connection.js
```

You should see:
```
✓ Successfully connected to database!
```

Then we can proceed with:
1. Running compatibility check
2. Creating database tables
3. Starting local development server
4. Testing the application

## Verification

To verify your firewall rule is working, you can also test with:

```bash
# Test if port 1433 is accessible
Test-NetConnection -ComputerName bucies.database.windows.net -Port 1433
```

Or on Windows PowerShell:
```powershell
Test-NetConnection bucies.database.windows.net -Port 1433
```

## Common Issues

**"Login failed for user"** - Either firewall blocks you OR credentials are wrong
**"Cannot open server"** - Definitely a firewall issue
**"Timeout"** - Firewall or network connectivity issue

## Next Steps After Firewall Setup

Once you can connect:
1. I'll run the compatibility check
2. Create the database schema
3. Start the local dev server
4. Test login with your TimeTracker credentials
5. Deploy to Azure

Let me know once you've added your IP to the firewall!
