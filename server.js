// Simple development server for testing without Azure Functions Core Tools
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from local.settings.json
const settings = JSON.parse(fs.readFileSync('local.settings.json', 'utf8'));
Object.keys(settings.Values).forEach(key => {
    process.env[key] = settings.Values[key];
});

// Import API functions
const { authenticateUser, getActiveUsers, addEducationEntry, getEducationEntries, deleteEducationEntry, getMonthlyHoursSummary } = require('./api/db');
const jwt = require('jsonwebtoken');

const PORT = 7071;

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${req.method} ${req.url}`);

    try {
        // Login endpoint
        if (req.method === 'POST' && req.url === '/api/login') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { username, password } = JSON.parse(body);
                    const user = await authenticateUser(username, password);

                    if (!user) {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid credentials' }));
                        return;
                    }

                    const token = jwt.sign(
                        { userId: user.userId, email: user.email, fullName: user.fullName, role: user.role },
                        process.env.JWT_SECRET,
                        { expiresIn: '8h' }
                    );

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ token, user }));
                } catch (err) {
                    console.error('Login error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // Verify token
        if (req.method === 'GET' && req.url === '/api/verify') {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No token provided' }));
                return;
            }

            try {
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ user: decoded }));
            } catch (err) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid token' }));
            }
            return;
        }

        // Helper function to verify token
        function verifyToken(authHeader) {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('No token provided');
            }
            const token = authHeader.substring(7);
            return jwt.verify(token, process.env.JWT_SECRET);
        }

        // Get users
        if (req.method === 'GET' && req.url === '/api/users') {
            const user = verifyToken(req.headers.authorization);
            const users = await getActiveUsers();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users));
            return;
        }

        // Get education entries
        if (req.method === 'GET' && req.url.startsWith('/api/education/entries')) {
            const user = verifyToken(req.headers.authorization);
            const entries = await getEducationEntries();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(entries));
            return;
        }

        // Add education entry
        if (req.method === 'POST' && req.url === '/api/education/entries') {
            const user = verifyToken(req.headers.authorization);
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { date, hours, description, category } = JSON.parse(body);
                    const entry = await addEducationEntry({
                        userId: user.userId,
                        date,
                        hours,
                        description,
                        category
                    });
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(entry));
                } catch (err) {
                    console.error('Add entry error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // Delete education entry
        const deleteMatch = req.url.match(/^\/api\/education\/entries\/(\d+)$/);
        if (req.method === 'DELETE' && deleteMatch) {
            const user = verifyToken(req.headers.authorization);
            const entryId = parseInt(deleteMatch[1]);
            const deleted = await deleteEducationEntry(entryId, user.userId);

            if (deleted) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Entry deleted' }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Entry not found' }));
            }
            return;
        }

        // Get monthly summary
        if (req.method === 'GET' && req.url.startsWith('/api/education/summary/monthly')) {
            const user = verifyToken(req.headers.authorization);
            const url = new URL(req.url, `http://localhost:${PORT}`);
            const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
            const month = parseInt(url.searchParams.get('month')) || new Date().getMonth() + 1;
            const summary = await getMonthlyHoursSummary(year, month);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ year, month, summary }));
            return;
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));

    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
});

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Development Server Running`);
    console.log(`========================================`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  POST   /api/login`);
    console.log(`  GET    /api/verify`);
    console.log(`  GET    /api/users`);
    console.log(`  GET    /api/education/entries`);
    console.log(`  POST   /api/education/entries`);
    console.log(`  DELETE /api/education/entries/{id}`);
    console.log(`  GET    /api/education/summary/monthly`);
    console.log(`\nOpen index.html in your browser to test!`);
    console.log(`========================================\n`);
});
