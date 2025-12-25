import pino from 'pino';
import { config, isDevelopment } from '../config';

// Pino logger configuration
export const logger = pino({
    level: isDevelopment ? 'debug' : 'info',
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        env: config.NODE_ENV,
    },
    formatters: {
        level: (label) => ({ level: label }),
    },
});

// Child loggers for different contexts
export const httpLogger = logger.child({ context: 'http' });
export const dbLogger = logger.child({ context: 'database' });
export const jobLogger = logger.child({ context: 'jobs' });
export const socketLogger = logger.child({ context: 'sockets' });
export const authLogger = logger.child({ context: 'auth' });
