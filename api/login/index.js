const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../db');

module.exports = async function (context, req) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            context.res = {
                status: 400,
                body: { error: 'Email and password are required' }
            };
            return;
        }

        // Authenticate against existing OvertimeTracker Users table (READ-ONLY)
        const user = await authenticateUser(username, password);

        if (!user) {
            context.res = {
                status: 401,
                body: { error: 'Invalid credentials' }
            };
            return;
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

        context.res = {
            status: 200,
            body: {
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
        context.log.error('Login error:', err);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};
