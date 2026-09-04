const jwt = require('jsonwebtoken');

/* Arriving from the hub, already signed in.
 *
 * Somebody who signed in at the hub is sent here with a single-use code. The
 * code is worth nothing on its own: spending it takes this app's own service
 * credential, it works once, and it expires in a minute. What comes back from
 * the overtime tracker — which owns the account table this app reads — is an
 * identity and nothing more: no password, and no token that would let this
 * app act as the person anywhere else.
 *
 * The session it mints is the same JWT /login issues, carrying the same
 * claims, so nothing downstream can tell the two apart.
 */

const TIMETRACKER = (process.env.TIMETRACKER_API_URL || 'https://timetracker-backend.azurewebsites.net')
    .replace(/\/+$/, '');

module.exports = async function (context, req) {
    try {
        const code = (req.body || {}).code;
        if (!code) {
            context.res = { status: 400, body: { error: 'Missing sign-in code' } };
            return;
        }

        const key = process.env.TIMETRACKER_SERVICE_KEY;
        if (!key) {
            context.log.error('TIMETRACKER_SERVICE_KEY is not configured');
            context.res = { status: 503, body: { error: 'Single sign-on is not configured' } };
            return;
        }

        let response;
        try {
            response = await fetch(`${TIMETRACKER}/auth/service/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-service-key': key },
                body: JSON.stringify({ code: String(code) }),
                signal: AbortSignal.timeout(15000)
            });
        } catch (err) {
            context.log.error('Could not reach the sign-in service:', err);
            context.res = { status: 503, body: { error: 'Sign-in is unavailable. Please sign in with your password.' } };
            return;
        }

        /* Expired, already spent, or minted for another app — one answer for
           all three, because the difference is not the visitor's business. */
        if (response.status === 401) {
            context.res = { status: 401, body: { error: 'That sign-in link has expired. Please sign in with your password.' } };
            return;
        }

        if (!response.ok) {
            context.log.error('Hand-off redemption returned', response.status);
            context.res = { status: 503, body: { error: 'Sign-in is unavailable. Please sign in with your password.' } };
            return;
        }

        const body = await response.json().catch(() => ({}));
        const user = body && body.user;
        if (!user) {
            context.res = { status: 401, body: { error: 'That sign-in link has expired. Please sign in with your password.' } };
            return;
        }

        const claims = {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };

        const token = jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: '8h' });

        context.res = { status: 200, body: { token, user: claims } };
    } catch (err) {
        context.log.error('Hand-off error:', err);
        context.res = { status: 500, body: { error: 'Internal server error' } };
    }
};
