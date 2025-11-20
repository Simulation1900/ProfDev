const { verifyToken } = require('../shared/auth-helper');
const { addEducationEntry } = require('../db');

module.exports = async function (context, req) {
    try {
        const user = verifyToken(req);
        const { date, hours, description, category } = req.body;

        if (!date || !hours || !description) {
            context.res = {
                status: 400,
                body: { error: 'Date, hours, and description are required' }
            };
            return;
        }

        if (hours <= 0 || hours > 24) {
            context.res = {
                status: 400,
                body: { error: 'Hours must be between 0 and 24' }
            };
            return;
        }

        const entry = await addEducationEntry({
            userId: user.userId,
            date,
            hours,
            description,
            category
        });

        context.res = {
            status: 201,
            body: entry
        };
    } catch (err) {
        context.log.error('Error adding entry:', err);
        context.res = {
            status: err.message === 'No token provided' ? 401 : 500,
            body: { error: err.message || 'Internal server error' }
        };
    }
};
