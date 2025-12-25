import { db } from '../db';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: string;
    environment: string;
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        typesense: ServiceHealth;
    };
}

export interface ServiceHealth {
    status: 'up' | 'down';
    latency?: number;
    error?: string;
}

// Timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMsg)), ms)
        ),
    ]);
};

export class HealthService {
    // Check database connection
    static async checkDatabase(): Promise<ServiceHealth> {
        const start = Date.now();
        try {
            await withTimeout(
                db.execute(sql`SELECT 1`),
                5000,
                'Database connection timeout'
            );
            return {
                status: 'up',
                latency: Date.now() - start,
            };
        } catch (error) {
            logger.error({ error }, 'Database health check failed');
            return {
                status: 'down',
                latency: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Check Redis connection
    static async checkRedis(): Promise<ServiceHealth> {
        const start = Date.now();
        let redis: Redis | null = null;

        try {
            redis = new Redis(config.REDIS_URL, {
                maxRetriesPerRequest: 1,
                connectTimeout: 3000,
                commandTimeout: 3000,
                lazyConnect: true,
            });

            await withTimeout(redis.connect(), 3000, 'Redis connection timeout');
            await withTimeout(redis.ping(), 2000, 'Redis ping timeout');

            return {
                status: 'up',
                latency: Date.now() - start,
            };
        } catch (error) {
            logger.error({ error }, 'Redis health check failed');
            return {
                status: 'down',
                latency: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        } finally {
            if (redis) {
                redis.disconnect();
            }
        }
    }

    // Check Typesense connection
    static async checkTypesense(): Promise<ServiceHealth> {
        const start = Date.now();
        try {
            const url = `${config.TYPESENSE_PROTOCOL}://${config.TYPESENSE_HOST}:${config.TYPESENSE_PORT}/health`;
            const response = await fetch(url, {
                headers: { 'X-TYPESENSE-API-KEY': config.TYPESENSE_API_KEY },
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                return {
                    status: 'up',
                    latency: Date.now() - start,
                };
            }

            return {
                status: 'down',
                latency: Date.now() - start,
                error: `HTTP ${response.status}`,
            };
        } catch (error) {
            logger.error({ error }, 'Typesense health check failed');
            return {
                status: 'down',
                latency: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Full health check
    static async check(): Promise<HealthStatus> {
        const [database, redis, typesense] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkTypesense(),
        ]);

        const services = { database, redis, typesense };

        // Determine overall status
        const allUp = Object.values(services).every(s => s.status === 'up');
        const allDown = Object.values(services).every(s => s.status === 'down');

        let status: HealthStatus['status'];
        if (allUp) {
            status = 'healthy';
        } else if (allDown) {
            status = 'unhealthy';
        } else {
            status = 'degraded';
        }

        return {
            status,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: config.NODE_ENV,
            services,
        };
    }

    // Quick liveness check (just confirms app is running)
    static liveness() {
        return {
            status: 'alive',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}
