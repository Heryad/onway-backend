import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './config';
import { ApiResponse, logger, HealthService } from './lib';
import { httpLoggerMiddleware } from './middleware';
import { routes } from './routes';
import { initScheduler } from './jobs/scheduler';
import './jobs/workers/payout.worker';
import './jobs/workers/dispatch.worker';
import './jobs/workers/system.worker';
import { createServer } from 'http';
import { initSocketServer } from './sockets';

// Initialize Hono app
const app = new Hono();

// Global middleware
app.use('*', httpLoggerMiddleware);
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', cors({
    origin: config.CORS_ORIGINS.split(','),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Readiness/Health check (full - checks all dependencies)
app.get('/health', async (c) => {
    const health = await HealthService.check();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return c.json({
        success: health.status !== 'unhealthy',
        message: `Service is ${health.status}`,
        data: health,
        timestamp: health.timestamp,
    }, statusCode);
});

// API version info
app.get('/', (c) => {
    return ApiResponse.success(c, {
        message: 'Welcome to Onway API',
        data: {
            name: 'onway-backend',
            version: '1.0.0',
            apiVersion: config.API_VERSION,
        },
    });
});

// Mount all routes under API prefix (e.g., /api/v1)
app.route(config.API_PREFIX, routes);

// 404 handler
app.notFound((c) => {
    return ApiResponse.notFound(c, `Route ${c.req.method} ${c.req.path} not found`);
});

// Error handler
app.onError((err, c) => {
    logger.error({ err }, 'Unhandled error');
    const errorMessage = config.NODE_ENV === 'production' ? undefined : err.message;
    return ApiResponse.internalError(c, 'Something went wrong', errorMessage);
});

// Start server
logger.info(`🚀 Server starting on port ${config.PORT}...`);

// Initialize Background Jobs
initScheduler().catch(err => {
    logger.error({ err }, 'Failed to initialize job scheduler');
});

// For Socket.io, we use Bun.serve with the http server
const httpServer = createServer();
// Initialize Socket.io
initSocketServer(httpServer).catch(err => {
    logger.error({ err }, 'Failed to initialize Socket.io');
});

// Start HTTP server for Socket.io on same port
httpServer.listen(config.SOCKET_PORT, () => {
    logger.info(`🔌 Socket.io server on port ${config.SOCKET_PORT}`);
});

export default {
    port: config.PORT,
    fetch: app.fetch,
};

