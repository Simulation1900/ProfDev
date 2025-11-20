const { verifyToken } = require('../shared/auth-helper');
const { getEducationEntries } = require('../db');

module.exports = async function (context, req) {
    try {
        const user = verifyToken(req);

        const userId = req.query.userId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const entries = await getEducationEntries(
            userId ? parseInt(userId) : null,
            startDate,
            endDate
        );

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: entries
        };
    } catch (err) {
        context.log.error('Error fetching entries:', err);
        context.res = {
            status: err.message === 'No token provided' ? 401 : 500,
            body: { error: err.message || 'Internal server error' }
        };
    }
};
