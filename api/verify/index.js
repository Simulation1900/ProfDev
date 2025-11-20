const jwt = require('jsonwebtoken');

module.exports = async function (context, req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            context.res = {
                status: 401,
                body: { error: 'No token provided' }
            };
            return;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        context.res = {
            status: 200,
            body: {
                user: {
                    userId: decoded.userId,
                    username: decoded.username,
                    fullName: decoded.fullName,
                    role: decoded.role
                }
            }
        };
    } catch (err) {
        context.res = {
            status: 401,
            body: { error: 'Invalid token' }
        };
    }
};
