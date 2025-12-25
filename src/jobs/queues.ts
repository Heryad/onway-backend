import { Queue } from 'bullmq';
import { redisConnection } from './connection';
import { QUEUE_NAMES } from './definitions';

export const payoutQueue = new Queue(QUEUE_NAMES.PAYOUTS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            count: 100,
            age: 24 * 3600,
        },
        removeOnFail: {
            count: 500,
        },
    },
});

export const dispatchQueue = new Queue(QUEUE_NAMES.DISPATCH, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            count: 500,
            age: 12 * 3600,
        },
        removeOnFail: {
            count: 1000,
        },
    },
});
