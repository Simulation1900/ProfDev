const { verifyToken } = require('../shared/auth-helper');
const { getMonthlyHoursSummary } = require('../db');

module.exports = async function (context, req) {
    try {
        const user = verifyToken(req);

        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;

        const summary = await getMonthlyHoursSummary(year, month);

        context.res = {
            status: 200,
            body: {
                year,
                month,
                summary
            }
        };
    } catch (err) {
        context.log.error('Error fetching monthly summary:', err);
        context.res = {
            status: err.message === 'No token provided' ? 401 : 500,
            body: { error: err.message || 'Internal server error' }
        };
    }
};
