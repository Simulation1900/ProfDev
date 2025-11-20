const { verifyToken } = require('../shared/auth-helper');
const { deleteEducationEntry } = require('../db');

module.exports = async function (context, req) {
    try {
        const user = verifyToken(req);
        const entryId = parseInt(req.params.entryId);

        if (!entryId) {
            context.res = {
                status: 400,
                body: { error: 'Invalid entry ID' }
            };
            return;
        }

        const deleted = await deleteEducationEntry(entryId, user.userId);

        if (!deleted) {
            context.res = {
                status: 404,
                body: { error: 'Entry not found or unauthorized' }
            };
            return;
        }

        context.res = {
            status: 200,
            body: { message: 'Entry deleted successfully' }
        };
    } catch (err) {
        context.log.error('Error deleting entry:', err);
        context.res = {
            status: err.message === 'No token provided' ? 401 : 500,
            body: { error: err.message || 'Internal server error' }
        };
    }
};
