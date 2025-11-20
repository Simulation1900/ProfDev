# Professional Education Tracker

A web application for tracking continuing education hours for the Simulation Operations Team. This system integrates with existing TimeTracker database authentication and provides a streamlined interface for logging and monitoring professional development activities.

## Features

- **Secure Authentication**: Uses existing TimeTracker database credentials (read-only access)
- **Activity Logging**: Track education activities with date, hours, and descriptions
- **Monthly Requirements**: Automatically calculates progress toward 2.5-hour monthly requirement
- **Team Overview**: View all team members' activities and progress
- **User-Friendly Interface**: Clean, responsive design optimized for desktop and mobile

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Azure Functions (Node.js)
- **Database**: Azure SQL Database (bucies.database.windows.net / TimeTracker)
- **Hosting**: Azure Static Web Apps
- **Authentication**: JWT tokens with TimeTracker user credentials

## Database Schema

The application adds the following tables to your existing TimeTracker database:

- `EducationEntries`: Stores continuing education activities
- `EducationCategories`: Optional categories for activity types
- Views and stored procedures for reporting

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- Azure Functions Core Tools
- Access to bucies.database.windows.net SQL Server
- Azure subscription for deployment

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create local.settings.json** (copy from local.settings.json.example):
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "SQL_SERVER": "bucies.database.windows.net",
       "SQL_DATABASE": "TimeTracker",
       "SQL_USER": "your-username",
       "SQL_PASSWORD": "your-password",
       "JWT_SECRET": "your-secret-key-change-this"
     }
   }
   ```

3. **Run database schema**:
   Execute the SQL script in `database/schema.sql` against your TimeTracker database to create the necessary tables.

4. **Start local development server**:
   ```bash
   npm start
   ```
   The API will run on http://localhost:7071

5. **Serve the frontend**:
   Open `index.html` in a browser or use a local web server:
   ```bash
   npx serve .
   ```

### Azure Deployment

#### Option 1: Azure Static Web Apps (Recommended)

1. **Create Azure Static Web App**:
   - Go to Azure Portal
   - Create new Static Web App
   - Connect to your GitHub repository
   - Build configuration:
     - App location: `/`
     - API location: `api`
     - Output location: (empty)

2. **Configure Application Settings**:
   In Azure Portal → Static Web App → Configuration, add:
   - `SQL_SERVER`: bucies.database.windows.net
   - `SQL_DATABASE`: TimeTracker
   - `SQL_USER`: your-username
   - `SQL_PASSWORD`: your-password
   - `JWT_SECRET`: generate-strong-random-key

3. **Deploy**:
   Push to main branch - GitHub Actions will automatically deploy

#### Option 2: Manual Deployment

1. **Deploy API**:
   ```bash
   func azure functionapp publish <your-function-app-name>
   ```

2. **Deploy Frontend**:
   Upload `index.html` to Azure Static Web Apps or Azure Storage Static Website

### Database Requirements

Your TimeTracker database must have a `Users` table with these columns:
- `UserID` (INT, PRIMARY KEY)
- `Username` (VARCHAR)
- `FullName` (VARCHAR)
- `Role` (VARCHAR)
- `PasswordHash` (VARCHAR) - bcrypt hashed passwords
- `IsActive` (BIT)

If your schema differs, modify `api/db.js` accordingly.

## API Endpoints

### Authentication
- `POST /api/login` - Authenticate user
- `GET /api/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all active users (requires auth)

### Education Entries
- `GET /api/education/entries` - Get all entries (requires auth)
- `POST /api/education/entries` - Add new entry (requires auth)
- `DELETE /api/education/entries/{id}` - Delete entry (requires auth, own entries only)
- `GET /api/education/summary/monthly` - Get monthly hours summary (requires auth)

## Security

- **Read-Only Database Access**: API only reads from Users table, never modifies it
- **JWT Authentication**: All API endpoints require valid token
- **User Isolation**: Users can only delete their own entries
- **HTTPS Only**: All connections encrypted
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## Maintenance

### Adding Team Members
Team members are automatically loaded from the TimeTracker Users table. Ensure they have:
- Active account (`IsActive = 1`)
- Valid credentials
- Appropriate role

### Backup
Education entries are stored in the TimeTracker database. Include `EducationEntries` table in your regular backup routine.

### Monitoring
- Check Azure Portal for Function App logs
- Monitor database connections
- Review monthly compliance reports

## Support

For issues or questions:
1. Check application logs in Azure Portal
2. Verify database connectivity
3. Ensure TimeTracker credentials are valid
4. Contact system administrator

## License

Internal use only - Simulation Operations Team
