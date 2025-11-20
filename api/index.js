// Azure Functions v4 entry point - Load all function definitions
const auth = require('./auth');
const education = require('./education');

// Export all modules so they're available
module.exports = {
    ...auth,
    ...education
};
