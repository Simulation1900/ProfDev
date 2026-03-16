const { verifyToken } = require('../shared/auth-helper');
const { updateEducationEntry } = require('../db');

const DESCRIPTION_MAX_LENGTH = 500;
const VALID_CATEGORIES = ['Webinar', 'Podcast', 'Article', 'Book', 'Conference', 'Video', 'Course', 'Meeting', 'Other', 'General'];

module.exports = async function (context, req) {
    try {
        const user = verifyToken(req);
        const entryId = parseInt(req.params.entryId);

        if (!entryId) {
            context.res = { status: 400, body: { error: 'Invalid entry ID' } };
            return;
        }

        const { date, hours, description, category } = req.body;

        if (!date || !hours || !description) {
            context.res = { status: 400, body: { error: 'Date, hours, and description are required' } };
            return;
        }

        if (category && !VALID_CATEGORIES.includes(category)) {
            context.res = { status: 400, body: { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` } };
            return;
        }

        if (hours <= 0 || hours > 24) {
            context.res = { status: 400, body: { error: 'Hours must be between 0 and 24' } };
            return;
        }

        if (description.length > DESCRIPTION_MAX_LENGTH) {
            context.res = {
                status: 400,
                body: { error: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer` }
            };
            return;
        }

        const updated = await updateEducationEntry(entryId, user.userId, { date, hours, description, category });

        if (!updated) {
            context.res = { status: 404, body: { error: 'Entry not found or unauthorized' } };
            return;
        }

        context.res = { status: 200, body: updated };
    } catch (err) {
        context.log.error('Error updating entry:', err);
        context.res = {
            status: err.message === 'No token provided' ? 401 : 500,
            body: { error: err.message || 'Internal server error' }
        };
    }
};
