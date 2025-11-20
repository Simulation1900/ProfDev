const { app } = require('@azure/functions');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('./db');

// Login endpoint - authenticates against existing OvertimeTracker database
app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { username, password } = body;

            if (!username || !password) {
                return {
                    status: 400,
                    jsonBody: { error: 'Email and password are required' }
                };
            }

            // Authenticate against existing OvertimeTracker Users table (READ-ONLY)
            // username field will contain email from frontend
            const user = await authenticateUser(username, password);

            if (!user) {
                return {
                    status: 401,
                    jsonBody: { error: 'Invalid credentials' }
                };
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.userId,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            return {
                status: 200,
                jsonBody: {
                    token,
                    user: {
                        userId: user.userId,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role
                    }
                }
            };
        } catch (err) {
            context.error('Login error:', err);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error' }
            };
        }
    }
});

// Verify token endpoint
app.http('verify', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return {
                    status: 401,
                    jsonBody: { error: 'No token provided' }
                };
            }

            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            return {
                status: 200,
                jsonBody: {
                    user: {
                        userId: decoded.userId,
                        username: decoded.username,
                        fullName: decoded.fullName,
                        role: decoded.role
                    }
                }
            };
        } catch (err) {
            return {
                status: 401,
                jsonBody: { error: 'Invalid token' }
            };
        }
    }
});

// Middleware function to verify JWT token
function verifyToken(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
}

module.exports = { verifyToken };
