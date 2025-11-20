const { verifyToken } = require('../shared/auth-helper');
const { getActiveUsers } = require('../db');

module.exports = async function (context, req) {
    try {
        const user = verifyToken(req);
        const users = await getActiveUsers();

        context.res = {
            status: 200,
            body: users
        };
    } catch (err) {
        context.log.error('Error fetching users:', err);
        context.res = {
            status: err.message === 'No token provided' ? 401 : 500,
            body: { error: err.message || 'Internal server error' }
        };
    }
};
