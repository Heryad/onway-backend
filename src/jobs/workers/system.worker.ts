import { Worker, type Job } from 'bullmq';
import { redisConnection } from '../connection';
import { QUEUE_NAMES, JOB_NAMES } from '../definitions';
import { logger } from '../../lib/logger';
import { StoryService } from '../../services/admin/story.service';

export const systemWorker = new Worker(
    QUEUE_NAMES.SYSTEM,
    async (job: Job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing system job');

        try {
            if (job.name === JOB_NAMES.CLEANUP_EXPIRED_STORIES) {
                const count = await StoryService.cleanupExpired();
                logger.info({ count }, 'Cleaned up expired stories');
                return { success: true, count };
            }

            throw new Error(`Unknown job: ${job.name}`);
        } catch (error: any) {
            logger.error({ jobId: job.id, error: error.message }, 'System job failed');
            throw error;
        }
    },
    {
        connection: redisConnection,
    }
);

systemWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'System job completed');
});

systemWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, error: err.message }, 'System job failed');
});
