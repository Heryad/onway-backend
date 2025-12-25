import type { Context, Next } from 'hono';
import { nanoid } from 'nanoid';
import { httpLogger } from '../lib/logger';

// Request ID header name
const REQUEST_ID_HEADER = 'X-Request-Id';

// HTTP Logger Middleware
export const httpLoggerMiddleware = async (c: Context, next: Next) => {
    const start = Date.now();

    // Generate or extract request ID
    const requestId = c.req.header(REQUEST_ID_HEADER) || nanoid(12);
    c.set('requestId', requestId);
    c.header(REQUEST_ID_HEADER, requestId);

    // Request info
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('user-agent') || 'unknown';
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    // Log incoming request
    httpLogger.info({
        type: 'request',
        requestId,
        method,
        path,
        ip,
        userAgent,
    }, `→ ${method} ${path}`);

    // Process request
    await next();

    // Calculate duration
    const duration = Date.now() - start;
    const status = c.res.status;

    // Determine log level based on status
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    // Log response
    httpLogger[logLevel]({
        type: 'response',
        requestId,
        method,
        path,
        status,
        duration,
    }, `← ${method} ${path} ${status} ${duration}ms`);
};

// Helper to get request ID from context
export const getRequestId = (c: Context): string => {
    return c.get('requestId') || 'unknown';
};
