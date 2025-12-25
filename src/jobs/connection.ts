import { config } from '../config';
import IORedis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

// Use IORedis to parse the URL from config module
const client = new IORedis(config.REDIS_URL, { lazyConnect: true });

// Export connection options compatible with BullMQ
export const redisConnection: ConnectionOptions = {
    host: client.options.host,
    port: client.options.port,
    password: client.options.password,
    db: client.options.db,
    username: client.options.username,
    maxRetriesPerRequest: null,
};
