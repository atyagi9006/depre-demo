const Hoek = require('hoek');
const http = require('http');

const defaultServerConfig = {
    port: 3000,
    host: 'localhost',
    routes: {
        cors: false,
        timeout: 30000
    },
    logging: {
        level: 'info',
        format: 'json'
    }
};

function createServer(userConfig = {}) {
    const config = Hoek.applyToDefaults(defaultServerConfig, userConfig, {
        shallow: ['routes']
    });

    Hoek.assert(typeof config.port === 'number', 'Port must be a number');
    Hoek.assert(config.port > 0 && config.port < 65536, 'Port must be between 1 and 65535');

    const server = http.createServer((req, res) => {
        const startTime = Date.now();

        const logRequest = () => {
            const duration = Date.now() - startTime;
            const logEntry = {
                method: req.method,
                url: req.url,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };

            if (config.logging.format === 'json') {
                console.log(JSON.stringify(logEntry));
            } else {
                console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${logEntry.duration}`);
            }
        };

        res.on('finish', logRequest);

        if (req.url === '/config') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const safeConfig = Hoek.clone(config);
            delete safeConfig.logging;
            res.end(JSON.stringify(safeConfig, null, 2));
        } else if (req.url === '/health') {
            const health = {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(health, null, 2));
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hoek Demo Server - Available endpoints: /config, /health');
        }
    });

    server.listen(config.port, config.host, () => {
        console.log(`Server running at http://${config.host}:${config.port}/`);
        console.log('Configuration:', JSON.stringify(config, null, 2));
    });

    return server;
}

if (require.main === module) {
    const customConfig = {
        port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
        logging: {
            level: 'debug',
            format: 'text'
        }
    };

    createServer(customConfig);
}

module.exports = { createServer };