import { Hono } from 'hono';
import { DriverPayoutController } from '../../controllers/admin/driver-payout.controller';
import { adminAuthMiddleware, financeAccessMiddleware } from '../../middleware/admin/auth';

const driverPayoutRoutes = new Hono();

// Access: Finance or higher (Owner)
driverPayoutRoutes.use('*', adminAuthMiddleware);
driverPayoutRoutes.use('*', financeAccessMiddleware);

// List payouts
driverPayoutRoutes.get('/', DriverPayoutController.list);

// Get payout details
driverPayoutRoutes.get('/:id', DriverPayoutController.getById);

// Preview stats (dry run)
driverPayoutRoutes.get('/stats/preview', DriverPayoutController.previewStats);

// Manual generate single
driverPayoutRoutes.post('/generate', DriverPayoutController.generate);

// Manual generate batch
driverPayoutRoutes.post('/generate-batch', DriverPayoutController.generateBatch);

// Process payout (Paid/Failed)
driverPayoutRoutes.patch('/:id/process', DriverPayoutController.process);

export { driverPayoutRoutes };
