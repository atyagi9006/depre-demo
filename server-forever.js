const Hoek = require('hoek');
const http = require('http');
const os = require('os');

const defaultServerConfig = {
    port: process.env.PORT || 8080,
    host: '0.0.0.0', // Listen on all interfaces
    routes: {
        cors: false,
        timeout: 30000
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
    },
    keepAlive: {
        enabled: true,
        interval: 10000, // 10 seconds
        timeout: 5000
    }
};

// Statistics tracking
const stats = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    lastActivity: Date.now(),
    memoryCheckInterval: 60000, // Check memory every minute
    maxMemoryUsage: 0
};

// Keep-alive mechanism
let keepAliveInterval;
let memoryCheckInterval;

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function logMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const config = Hoek.applyToDefaults(defaultServerConfig, {});

    if (config.logging.format === 'json') {
        console.log(JSON.stringify({
            timestamp,
            level,
            message,
            ...data
        }));
    } else {
        console.log(`[${timestamp}] [${level}] ${message}`, data);
    }
}

function keepAlive() {
    const memUsage = process.memoryUsage();
    const currentMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    stats.maxMemoryUsage = Math.max(stats.maxMemoryUsage, currentMemoryMB);

    logMessage('debug', 'Keep-alive heartbeat', {
        uptime: formatUptime(Date.now() - stats.startTime),
        requests: stats.requestCount,
        errors: stats.errorCount,
        memory: `${currentMemoryMB}MB`,
        maxMemory: `${stats.maxMemoryUsage}MB`
    });
}

function checkMemoryAndGC() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);

    logMessage('info', 'Memory check', {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssMB}MB`,
        uptime: formatUptime(Date.now() - stats.startTime)
    });

    // Force garbage collection if memory usage is high (if --expose-gc flag is used)
    if (global.gc && heapUsedMB > 100) {
        logMessage('info', 'Running garbage collection');
        global.gc();
    }
}

function createServer(userConfig = {}) {
    const config = Hoek.applyToDefaults(defaultServerConfig, userConfig, {
        shallow: ['routes']
    });

    Hoek.assert(typeof config.port === 'number', 'Port must be a number');
    Hoek.assert(config.port > 0 && config.port < 65536, 'Port must be between 1 and 65535');

    const server = http.createServer((req, res) => {
        stats.requestCount++;
        stats.lastActivity = Date.now();
        const startTime = Date.now();

        // Set keep-alive headers
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', 'timeout=5');

        const logRequest = () => {
            const duration = Date.now() - startTime;
            logMessage('info', 'Request processed', {
                method: req.method,
                url: req.url,
                duration: `${duration}ms`,
                totalRequests: stats.requestCount
            });
        };

        res.on('finish', logRequest);

        try {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(`Hoek Demo Server (Forever Running)

Server Status: RUNNING
Uptime: ${formatUptime(Date.now() - stats.startTime)}
Requests Served: ${stats.requestCount}
Errors: ${stats.errorCount}
Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
Max Memory: ${stats.maxMemoryUsage}MB

Available endpoints:
  / - This status page
  /health - Health check endpoint
  /metrics - Detailed metrics
  /config - Server configuration
  /demo - Run Hoek demo
  /stop - Graceful shutdown (disabled in production)
`);
            } else if (req.url === '/config') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                const safeConfig = Hoek.clone(config);
                delete safeConfig.logging;
                res.end(JSON.stringify(safeConfig, null, 2));
            } else if (req.url === '/health') {
                const health = {
                    status: 'healthy',
                    uptime: process.uptime(),
                    uptimeFormatted: formatUptime(Date.now() - stats.startTime),
                    memory: process.memoryUsage(),
                    timestamp: new Date().toISOString(),
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform,
                    hostname: os.hostname()
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(health, null, 2));
            } else if (req.url === '/metrics') {
                const metrics = {
                    server: {
                        uptime: Date.now() - stats.startTime,
                        uptimeFormatted: formatUptime(Date.now() - stats.startTime),
                        startTime: new Date(stats.startTime).toISOString(),
                        requestCount: stats.requestCount,
                        errorCount: stats.errorCount,
                        lastActivity: new Date(stats.lastActivity).toISOString()
                    },
                    process: {
                        pid: process.pid,
                        version: process.version,
                        platform: process.platform,
                        arch: process.arch,
                        nodeVersion: process.versions.node,
                        v8Version: process.versions.v8
                    },
                    memory: {
                        current: process.memoryUsage(),
                        maxHeapUsed: stats.maxMemoryUsage * 1024 * 1024
                    },
                    system: {
                        hostname: os.hostname(),
                        type: os.type(),
                        platform: os.platform(),
                        release: os.release(),
                        totalMemory: os.totalmem(),
                        freeMemory: os.freemem(),
                        cpus: os.cpus().length,
                        loadAverage: os.loadavg(),
                        uptime: os.uptime()
                    },
                    environment: {
                        nodeEnv: process.env.NODE_ENV || 'development',
                        port: config.port,
                        host: config.host
                    }
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(metrics, null, 2));
            } else if (req.url === '/demo') {
                // Run Hoek demo inline
                const demoResult = {
                    merge: Hoek.merge({ a: 1 }, { b: 2 }),
                    clone: Hoek.clone({ original: true }),
                    reach: Hoek.reach({ a: { b: { c: 'deep' } } }, 'a.b.c'),
                    deepEqual: Hoek.deepEqual({ a: 1 }, { a: 1 }),
                    escapeHtml: Hoek.escapeHtml('<script>alert("xss")</script>'),
                    flatten: Hoek.flatten([1, [2, [3, 4]]]),
                    timestamp: new Date().toISOString()
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(demoResult, null, 2));
            } else if (req.url === '/stop') {
                if (process.env.NODE_ENV === 'production') {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Shutdown disabled in production' }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Shutting down gracefully...' }));
                    setTimeout(() => gracefulShutdown(), 100);
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Not Found',
                    path: req.url,
                    availableEndpoints: ['/', '/health', '/metrics', '/config', '/demo']
                }));
            }
        } catch (error) {
            stats.errorCount++;
            logMessage('error', 'Request error', {
                error: error.message,
                url: req.url,
                method: req.method
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    });

    // Handle server errors
    server.on('error', (error) => {
        stats.errorCount++;
        logMessage('error', 'Server error', { error: error.message });
    });

    // Keep server alive even on uncaught errors
    server.on('clientError', (error, socket) => {
        stats.errorCount++;
        logMessage('warn', 'Client error', { error: error.message });
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    server.listen(config.port, config.host, () => {
        logMessage('info', `🚀 Forever Server started`, {
            url: `http://${config.host}:${config.port}`,
            pid: process.pid,
            node: process.version,
            platform: process.platform,
            memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        });

        // Start keep-alive interval
        if (config.keepAlive.enabled) {
            keepAliveInterval = setInterval(keepAlive, config.keepAlive.interval);
            logMessage('info', 'Keep-alive enabled', {
                interval: `${config.keepAlive.interval}ms`
            });
        }

        // Start memory check interval
        memoryCheckInterval = setInterval(checkMemoryAndGC, stats.memoryCheckInterval);
    });

    return server;
}

// Graceful shutdown handling
function gracefulShutdown(signal = 'SIGTERM') {
    logMessage('info', `Received ${signal}, starting graceful shutdown...`, {
        uptime: formatUptime(Date.now() - stats.startTime),
        totalRequests: stats.requestCount
    });

    // Clear intervals
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    if (memoryCheckInterval) clearInterval(memoryCheckInterval);

    // Close server
    if (globalServer) {
        globalServer.close(() => {
            logMessage('info', 'Server closed successfully', {
                finalStats: {
                    uptime: formatUptime(Date.now() - stats.startTime),
                    requests: stats.requestCount,
                    errors: stats.errorCount
                }
            });
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            logMessage('warn', 'Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
}

// Global server reference for shutdown
let globalServer;

// Process event handlers for forever running
process.on('uncaughtException', (error) => {
    stats.errorCount++;
    logMessage('error', 'Uncaught exception (server continues)', {
        error: error.message,
        stack: error.stack
    });
    // Server continues running
});

process.on('unhandledRejection', (reason, promise) => {
    stats.errorCount++;
    logMessage('error', 'Unhandled rejection (server continues)', {
        reason: reason,
        promise: promise
    });
    // Server continues running
});

// Graceful shutdown on signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle Windows shutdown
if (process.platform === 'win32') {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    readline.on('SIGINT', () => process.emit('SIGINT'));
}

// Main execution
if (require.main === module) {
    const customConfig = {
        port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
        host: process.env.HOST || '0.0.0.0',
        logging: {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'json'
        }
    };

    logMessage('info', '🎯 Starting Hoek Demo Forever Server', {
        config: customConfig,
        deprecationWarning: 'Using deprecated Hoek v6.0.4 for demo purposes'
    });

    globalServer = createServer(customConfig);
}

module.exports = { createServer };