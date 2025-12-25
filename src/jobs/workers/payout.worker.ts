import { Worker, type Job } from 'bullmq';
import dayjs from 'dayjs';
import { redisConnection } from '../connection';
import { QUEUE_NAMES, JOB_NAMES, type PayoutJobData } from '../definitions';
import { logger } from '../../lib/logger';
import { StorePayoutService } from '../../services/admin/store-payout.service';
import { DriverPayoutService } from '../../services/admin/driver-payout.service';

const getPreviousWeekPeriod = () => {
    // Assuming run on Monday early morning
    // We want the previous partial or full week up to yesterday (Sunday end of day)

    // Get start of this week (Sunday or Monday depending on locale, usually we want strict ISO)
    const end = dayjs().subtract(1, 'day').format('YYYY-MM-DD'); // Yesterday
    const start = dayjs().subtract(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD');
    // Logic: If on Monday, yesterday was Sunday. 
    // dayjs().startOf('week') is usually Sunday.
    // Let's be explicit:

    // Previous Week: Monday to Sunday
    const lastSunday = dayjs().day(0); // This week's Sunday? No, .day(0) sets to Sunday of current week
    // If today is Monday(1), day(0) is yesterday.

    // Safer:
    const yesterday = dayjs().subtract(1, 'day');
    const periodEnd = yesterday.format('YYYY-MM-DD');
    const periodStart = yesterday.subtract(6, 'day').format('YYYY-MM-DD');
    return { periodStart, periodEnd };
};

export const payoutWorker = new Worker<PayoutJobData>(
    QUEUE_NAMES.PAYOUTS,
    async (job: Job<PayoutJobData>) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing payout job');

        try {
            const { periodStart, periodEnd } = job.data.periodStart && job.data.periodEnd
                ? { periodStart: job.data.periodStart, periodEnd: job.data.periodEnd }
                : getPreviousWeekPeriod();

            switch (job.name) {
                case JOB_NAMES.GENERATE_STORE_PAYOUTS:
                    logger.info({ periodStart, periodEnd }, 'Generating store payouts...');
                    const storeResult = await StorePayoutService.generateForAllStores(periodStart, periodEnd);
                    logger.info({ ...storeResult }, 'Store payouts generated');
                    return { success: true, ...storeResult };

                case JOB_NAMES.GENERATE_DRIVER_PAYOUTS:
                    logger.info({ periodStart, periodEnd }, 'Generating driver payouts...');
                    const driverResult = await DriverPayoutService.generateForAllDrivers(periodStart, periodEnd);
                    logger.info({ ...driverResult }, 'Driver payouts generated');
                    return { success: true, ...driverResult };

                default:
                    throw new Error(`Unknown job name: ${job.name}`);
            }
        } catch (error: any) {
            logger.error({
                jobId: job.id,
                name: job.name,
                error: error.message,
                stack: error.stack
            }, 'Payout job failed');
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 1, // Process one payout batch at a time to avoid DB load spikes
    }
);

payoutWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, name: job.name, returnvalue: job.returnvalue }, 'Job completed');
});

payoutWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, error: err.message }, 'Job failed');
});
