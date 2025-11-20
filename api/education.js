const { app } = require('@azure/functions');
const { verifyToken } = require('./auth');
const {
    addEducationEntry,
    getEducationEntries,
    deleteEducationEntry,
    getMonthlyHoursSummary,
    getActiveUsers
} = require('./db');

// Get all education entries (with optional filters)
app.http('getEntries', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'education/entries',
    handler: async (request, context) => {
        try {
            // Verify authentication
            const user = verifyToken(request);

            // Parse query parameters
            const url = new URL(request.url);
            const userId = url.searchParams.get('userId');
            const startDate = url.searchParams.get('startDate');
            const endDate = url.searchParams.get('endDate');

            // Get entries
            const entries = await getEducationEntries(
                userId ? parseInt(userId) : null,
                startDate,
                endDate
            );

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                jsonBody: entries
            };
        } catch (err) {
            context.error('Error fetching entries:', err);
            return {
                status: err.message === 'No token provided' ? 401 : 500,
                jsonBody: { error: err.message || 'Internal server error' }
            };
        }
    }
});

// Add new education entry
app.http('addEntry', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'education/entries',
    handler: async (request, context) => {
        try {
            // Verify authentication
            const user = verifyToken(request);

            // Parse request body
            const body = await request.json();
            const { date, hours, description, category } = body;

            // Validate required fields
            if (!date || !hours || !description) {
                return {
                    status: 400,
                    jsonBody: { error: 'Date, hours, and description are required' }
                };
            }

            // Validate hours
            if (hours <= 0 || hours > 24) {
                return {
                    status: 400,
                    jsonBody: { error: 'Hours must be between 0 and 24' }
                };
            }

            // Create entry
            const entry = await addEducationEntry({
                userId: user.userId,
                date,
                hours,
                description,
                category
            });

            return {
                status: 201,
                jsonBody: entry
            };
        } catch (err) {
            context.error('Error adding entry:', err);
            return {
                status: err.message === 'No token provided' ? 401 : 500,
                jsonBody: { error: err.message || 'Internal server error' }
            };
        }
    }
});

// Delete education entry
app.http('deleteEntry', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'education/entries/{entryId}',
    handler: async (request, context) => {
        try {
            // Verify authentication
            const user = verifyToken(request);

            const entryId = parseInt(request.params.entryId);

            if (!entryId) {
                return {
                    status: 400,
                    jsonBody: { error: 'Invalid entry ID' }
                };
            }

            // Delete entry (only if it belongs to the user)
            const deleted = await deleteEducationEntry(entryId, user.userId);

            if (!deleted) {
                return {
                    status: 404,
                    jsonBody: { error: 'Entry not found or unauthorized' }
                };
            }

            return {
                status: 200,
                jsonBody: { message: 'Entry deleted successfully' }
            };
        } catch (err) {
            context.error('Error deleting entry:', err);
            return {
                status: err.message === 'No token provided' ? 401 : 500,
                jsonBody: { error: err.message || 'Internal server error' }
            };
        }
    }
});

// Get monthly hours summary
app.http('getMonthlySummary', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'education/summary/monthly',
    handler: async (request, context) => {
        try {
            // Verify authentication
            const user = verifyToken(request);

            // Parse query parameters
            const url = new URL(request.url);
            const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
            const month = parseInt(url.searchParams.get('month')) || new Date().getMonth() + 1;

            // Get summary
            const summary = await getMonthlyHoursSummary(year, month);

            return {
                status: 200,
                jsonBody: {
                    year,
                    month,
                    summary
                }
            };
        } catch (err) {
            context.error('Error fetching monthly summary:', err);
            return {
                status: err.message === 'No token provided' ? 401 : 500,
                jsonBody: { error: err.message || 'Internal server error' }
            };
        }
    }
});

// Get active users (read-only from TimeTracker Users table)
app.http('getUsers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users',
    handler: async (request, context) => {
        try {
            // Verify authentication
            const user = verifyToken(request);

            // Get active users
            const users = await getActiveUsers();

            return {
                status: 200,
                jsonBody: users
            };
        } catch (err) {
            context.error('Error fetching users:', err);
            return {
                status: err.message === 'No token provided' ? 401 : 500,
                jsonBody: { error: err.message || 'Internal server error' }
            };
        }
    }
});
