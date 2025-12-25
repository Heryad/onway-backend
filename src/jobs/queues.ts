import { Queue } from 'bullmq';
import { redisConnection } from './connection';
import { QUEUE_NAMES } from './definitions';

export const payoutQueue = new Queue(QUEUE_NAMES.PAYOUTS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000, // 1s, 2s, 4s...
        },
        removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
            age: 24 * 3600, // Or last 24h
        },
        removeOnFail: {
            count: 500, // Keep fails longer for debugging
        },
    },
});
