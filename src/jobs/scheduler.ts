import { payoutQueue } from './queues';
import { JOB_NAMES } from './definitions';
import { logger } from '../lib/logger';

export const initScheduler = async () => {
    try {
        logger.info('Initializing scheduler...');

        // Verify connection first? Queue adds will fail if Redis down.

        // Store Payouts - Mondays at 02:00 AM
        await payoutQueue.add(
            JOB_NAMES.GENERATE_STORE_PAYOUTS,
            {},
            {
                repeat: {
                    pattern: '0 2 * * 1', // At 02:00 on Monday
                },
                jobId: 'recurring-store-payouts', // Ensures we don't duplicate
            }
        );
        logger.info('Scheduled Store Payouts (Mon 02:00)');

        // Driver Payouts - Mondays at 03:00 AM
        await payoutQueue.add(
            JOB_NAMES.GENERATE_DRIVER_PAYOUTS,
            {},
            {
                repeat: {
                    pattern: '0 3 * * 1', // At 03:00 on Monday
                },
                jobId: 'recurring-driver-payouts',
            }
        );
        logger.info('Scheduled Driver Payouts (Mon 03:00)');

    } catch (error) {
        logger.error({ error }, 'Failed to initialize scheduler');
        // Do not crash the app, just log
    }
};
