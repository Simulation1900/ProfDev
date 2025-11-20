# Step-by-Step Deployment Guide

This guide will walk you through deploying the Professional Education Tracker to Azure.

## Prerequisites Checklist

- [ ] Azure subscription with access
- [ ] SQL Server access to bucies.database.windows.net
- [ ] TimeTracker database credentials
- [ ] GitHub account (for automated deployment)
- [ ] Node.js installed locally (for testing)

## Step 1: Prepare the Database

### 1.1 Connect to SQL Server

Use Azure Data Studio, SQL Server Management Studio, or Azure Portal Query Editor:

```
Server: bucies.database.windows.net
Database: TimeTracker
Username: [your-username]
Password: [your-password]
```

### 1.2 Run the Schema Script

Execute the SQL script located in `database/schema.sql`. This will:
- Create `EducationEntries` table
- Create `EducationCategories` table (optional)
- Create helpful views for reporting
- Create stored procedures

### 1.3 Verify Users Table Structure

Run this query to confirm your Users table structure:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users';
```

**Expected columns:**
- UserID
- Username
- FullName (or similar)
- Role
- PasswordHash
- IsActive

**If your table is different**, you'll need to update the queries in `api/db.js` to match your schema.

### 1.4 Test Database Connection

```sql
-- Verify active users
SELECT UserID, Username, FullName, Role
FROM Users
WHERE IsActive = 1;
```

Make note of the users - these are the people who can log in.

## Step 2: Local Testing (Recommended)

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Configure Local Settings

Copy `local.settings.json.example` to `local.settings.json`:

```bash
cp local.settings.json.example local.settings.json
```

Edit `local.settings.json` with your actual values:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SQL_SERVER": "bucies.database.windows.net",
    "SQL_DATABASE": "TimeTracker",
    "SQL_USER": "your-actual-username",
    "SQL_PASSWORD": "your-actual-password",
    "JWT_SECRET": "create-a-random-secret-key-here",
    "CORS_ORIGINS": "*"
  }
}
```

**Important**: Generate a strong JWT_SECRET. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Start Local Development

```bash
npm start
```

This starts the Azure Functions runtime on http://localhost:7071

### 2.4 Test the API

Open another terminal and test:

```bash
# Test login (replace with actual username/password)
curl -X POST http://localhost:7071/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```

If successful, you'll receive a JWT token.

### 2.5 Test Frontend Locally

Open `index.html` in your browser. Update the `API_BASE_URL` in the HTML file:

```javascript
const API_BASE_URL = 'http://localhost:7071/api';
```

Try logging in with TimeTracker credentials.

## Step 3: Deploy to Azure

### Option A: Azure Static Web Apps with GitHub (Recommended)

#### 3.1 Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit - Professional Education Tracker"
git branch -M main
git remote add origin https://github.com/yourusername/professional-education-tracker.git
git push -u origin main
```

#### 3.2 Create Azure Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"

**Configuration:**
- **Subscription**: Select your subscription
- **Resource Group**: Create new or use existing
- **Name**: `professional-education-tracker`
- **Plan Type**: Free (or Standard for production)
- **Region**: Choose closest to you
- **Source**: GitHub
- **GitHub Account**: Authorize and select your account
- **Organization**: Your GitHub username
- **Repository**: professional-education-tracker
- **Branch**: main

**Build Details:**
- **Build Presets**: Custom
- **App location**: `/`
- **Api location**: `api`
- **Output location**: (leave empty)

Click "Review + Create" then "Create"

#### 3.3 Configure Environment Variables

1. After deployment, go to your Static Web App in Azure Portal
2. Click "Configuration" in left menu
3. Add Application Settings:

| Name | Value |
|------|-------|
| SQL_SERVER | bucies.database.windows.net |
| SQL_DATABASE | TimeTracker |
| SQL_USER | your-username |
| SQL_PASSWORD | your-password |
| JWT_SECRET | (same secret from local testing) |

4. Click "Save"

#### 3.4 Update Frontend API URL

Edit `index.html` and change:

```javascript
const API_BASE_URL = '/api';  // Already correct for production
```

Commit and push:

```bash
git add index.html
git commit -m "Update API URL for production"
git push
```

GitHub Actions will automatically deploy.

#### 3.5 Verify Deployment

1. Wait for GitHub Actions to complete (check the Actions tab in GitHub)
2. Navigate to your Static Web App URL (shown in Azure Portal)
3. Try logging in with TimeTracker credentials

### Option B: Manual Deployment

If you prefer manual deployment or don't use GitHub:

#### 3.6 Deploy Function App

1. Create Azure Function App in Portal:
   - Runtime: Node.js 18
   - Plan: Consumption or App Service Plan

2. Deploy functions:
```bash
func azure functionapp publish <your-function-app-name>
```

3. Configure App Settings in Portal with database credentials

#### 3.7 Deploy Static Site

1. Create Azure Storage Account
2. Enable Static Website hosting
3. Upload `index.html` to `$web` container
4. Update `API_BASE_URL` in `index.html` to point to Function App URL

## Step 4: Configure Firewall Rules

### 4.1 Azure SQL Firewall

1. Go to Azure SQL Server (bucies.database.windows.net) in Portal
2. Click "Firewalls and virtual networks"
3. Add rule for Azure Services:
   - Name: AllowAzureServices
   - Start IP: 0.0.0.0
   - End IP: 0.0.0.0

This allows your Azure Functions to connect.

### 4.2 Test Connection

Check Azure Function logs to ensure database connections succeed.

## Step 5: Test Production Deployment

### 5.1 Login Test

1. Navigate to your app URL
2. Try logging in with TimeTracker credentials
3. Verify user name appears in header

### 5.2 Add Entry Test

1. Fill out the education form
2. Submit an activity
3. Verify it appears in the log

### 5.3 View Team Log

1. Scroll down to Team Education Log
2. Verify all team members appear
3. Check monthly hours calculations

### 5.4 Delete Test

1. Find an entry you created
2. Click Delete
3. Confirm deletion works
4. Verify you cannot delete others' entries

## Step 6: Security Hardening (Production)

### 6.1 Update CORS Settings

In Azure Function App → Configuration → CORS:
- Remove `*`
- Add your Static Web App URL only

### 6.2 Enable HTTPS Only

In Static Web App settings, ensure HTTPS redirect is enabled (default).

### 6.3 Database Access Review

Verify the SQL user has minimum required permissions:
- SELECT on Users table (read-only)
- SELECT, INSERT, DELETE on EducationEntries
- EXECUTE on stored procedures

### 6.4 Rotate JWT Secret

Periodically change JWT_SECRET in production:
1. Update Application Setting
2. All users will need to re-login

## Step 7: Setup Monitoring

### 7.1 Enable Application Insights

1. In Azure Portal, go to your Function App
2. Enable Application Insights
3. Configure alerting for failures

### 7.2 Database Monitoring

Set up alerts for:
- Failed login attempts
- Connection failures
- High DTU usage

## Troubleshooting

### Problem: "Cannot connect to database"

**Check:**
1. SQL Server firewall allows Azure services
2. Credentials are correct in Application Settings
3. Database name is exactly "TimeTracker"
4. Function App has network access

**Test connection:**
```bash
# From Azure Function console
nc -zv bucies.database.windows.net 1433
```

### Problem: "Invalid credentials" when logging in

**Check:**
1. User exists in TimeTracker Users table
2. User has IsActive = 1
3. Password is correctly hashed with bcrypt
4. Username is case-sensitive (check your implementation)

**Verify user:**
```sql
SELECT * FROM Users WHERE Username = 'testuser' AND IsActive = 1;
```

### Problem: "Failed to load entries"

**Check:**
1. EducationEntries table exists
2. JWT token is valid
3. API is accessible from frontend

**Test API:**
```bash
curl https://your-app.azurestaticapps.net/api/education/entries \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Problem: GitHub Actions deployment fails

**Check:**
1. GitHub secrets are configured
2. AZURE_STATIC_WEB_APPS_API_TOKEN is valid
3. Build configuration is correct
4. Node.js version compatible

## Post-Deployment Tasks

- [ ] Test all features with real users
- [ ] Migrate existing data (if any) from localStorage
- [ ] Train team on new system
- [ ] Document support procedures
- [ ] Schedule regular database backups
- [ ] Set up monthly compliance reports

## Support Contacts

- **Azure Issues**: Azure Support Portal
- **Database Issues**: DBA team / bucies.database administrator
- **Application Issues**: Check application logs in Azure Portal

## Next Steps

After successful deployment:

1. **Add Advanced Features**:
   - Export to Excel functionality
   - Email notifications for incomplete monthly hours
   - Admin dashboard with charts
   - Category filtering

2. **Improve Reporting**:
   - Yearly summaries
   - Team comparisons
   - Activity type analytics

3. **Enhance Security**:
   - Multi-factor authentication
   - Session management
   - Audit logging

Congratulations! Your Professional Education Tracker is now live on Azure.
