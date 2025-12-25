import { Hono } from 'hono';
import { StorePayoutController } from '../../controllers/admin/store-payout.controller';
import { adminAuthMiddleware, financeAccessMiddleware } from '../../middleware/admin/auth';

const storePayoutRoutes = new Hono();

// Access: Finance or higher (Owner)
storePayoutRoutes.use('*', adminAuthMiddleware);
storePayoutRoutes.use('*', financeAccessMiddleware);

// List payouts
storePayoutRoutes.get('/', StorePayoutController.list);

// Get payout details
storePayoutRoutes.get('/:id', StorePayoutController.getById);

// Preview stats (dry run)
storePayoutRoutes.get('/stats/preview', StorePayoutController.previewStats);

// Manual generate single
storePayoutRoutes.post('/generate', StorePayoutController.generate);

// Manual generate batch
storePayoutRoutes.post('/generate-batch', StorePayoutController.generateBatch);

// Process payout (Paid/Failed)
storePayoutRoutes.patch('/:id/process', StorePayoutController.process);

export { storePayoutRoutes };
