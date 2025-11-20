# Quick Start Guide

Get your Professional Education Tracker up and running in 15 minutes.

## What You Need

- Database credentials for bucies.database.windows.net
- Access to the TimeTracker database
- Azure subscription (or run locally first)

## 5-Minute Local Test

### 1. Check Database Compatibility

Run this SQL script against your TimeTracker database:
```sql
-- Located in: database/check-compatibility.sql
```

This verifies your Users table is compatible.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Database

Copy and edit the settings file:

```bash
cp local.settings.json.example local.settings.json
```

Edit `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "SQL_SERVER": "bucies.database.windows.net",
    "SQL_DATABASE": "TimeTracker",
    "SQL_USER": "your-username",
    "SQL_PASSWORD": "your-password",
    "JWT_SECRET": "random-secret-key-here"
  }
}
```

### 4. Create Database Tables

Run this SQL script against TimeTracker:
```sql
-- Located in: database/schema.sql
```

This creates the EducationEntries table and related objects.

### 5. Start the App

```bash
npm start
```

Then open `index.html` in your browser and log in with your TimeTracker credentials!

## Deploy to Azure (10 Minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/education-tracker.git
git push -u origin main
```

### 2. Create Azure Static Web App

1. Go to [portal.azure.com](https://portal.azure.com)
2. Create Resource → Static Web App
3. Connect to GitHub repository
4. Build settings:
   - App location: `/`
   - API location: `api`
   - Output: (empty)

### 3. Configure Settings

In Azure Portal → Your Static Web App → Configuration:

Add these settings:
- `SQL_SERVER`: bucies.database.windows.net
- `SQL_DATABASE`: TimeTracker
- `SQL_USER`: your-username
- `SQL_PASSWORD`: your-password
- `JWT_SECRET`: (generate random 32-char string)

### 4. Allow Azure Access to Database

In Azure Portal → SQL Server → Firewalls:
- Add rule: Start IP `0.0.0.0`, End IP `0.0.0.0`
- This allows Azure services to connect

### 5. Done!

Your app is now live at: `https://your-app-name.azurestaticapps.net`

## Common Issues

**"Cannot connect to database"**
- Check firewall allows Azure services
- Verify credentials in Application Settings

**"Invalid credentials" when logging in**
- Ensure user exists in TimeTracker Users table
- Check IsActive = 1 for the user
- Verify password is bcrypt hashed

**"Failed to load entries"**
- Ensure schema.sql was executed
- Check EducationEntries table exists

## Need More Help?

See detailed guides:
- [README.md](README.md) - Full documentation
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Step-by-step deployment
- Run `database/check-compatibility.sql` to diagnose issues

## Architecture Overview

```
┌─────────────┐
│   Browser   │ ← User logs in with TimeTracker credentials
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐
│  Azure Static Web   │ ← Hosts index.html
│      App            │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Azure Functions    │ ← API endpoints (Node.js)
│     (api/)          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Azure SQL DB      │ ← TimeTracker database
│ bucies.database.    │   - Users (read-only)
│  windows.net        │   - EducationEntries (read/write)
└─────────────────────┘
```

## What Gets Created

**Database Objects (in TimeTracker):**
- EducationEntries table
- EducationCategories table
- Views for monthly/yearly summaries
- Stored procedures for reporting

**Azure Resources:**
- Static Web App (hosts frontend + API)
- Application Insights (monitoring)

**No changes to existing:**
- Users table (read-only)
- Any other TimeTracker tables

## Security Features

- JWT authentication with 8-hour expiration
- Read-only access to Users table
- Users can only delete their own entries
- HTTPS enforced
- SQL injection protected (parameterized queries)
- XSS protected (input sanitization)

## Default Behavior

**Monthly Requirement:** 2.5 hours per person per month

**Who Can Log In:** Anyone in TimeTracker Users table with:
- `IsActive = 1`
- Valid PasswordHash (bcrypt)

**Who Can See Entries:** All logged-in users can see all team entries

**Who Can Delete:** Users can only delete their own entries

## Customization

To change monthly requirement, edit in `index.html`:
```javascript
const MONTHLY_REQUIREMENT = 2.5; // Change this value
```

To modify team member list, update the Users table in TimeTracker database.

To change acceptable activities, edit the "Acceptable Activities" section in `index.html`.

---

**Ready to start?** Run the compatibility check first: `database/check-compatibility.sql`
