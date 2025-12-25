import { Hono } from 'hono';
import { PaymentOptionController } from '../../controllers/admin/payment-option.controller';
import { PaymentController } from '../../controllers/admin/payment.controller';
import { TransactionController } from '../../controllers/admin/transaction.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const paymentRoutes = new Hono();

paymentRoutes.use('*', adminAuthMiddleware);
paymentRoutes.use('*', cityAdminMiddleware);
paymentRoutes.use('*', geoAccessMiddleware);

// ========== Payment Options ==========

paymentRoutes.get('/options', PaymentOptionController.list);
paymentRoutes.get('/options/:id', PaymentOptionController.getById);
paymentRoutes.post('/options', PaymentOptionController.create);
paymentRoutes.put('/options/:id', PaymentOptionController.update);
paymentRoutes.delete('/options/:id', PaymentOptionController.delete);
paymentRoutes.patch('/options/:id/toggle-status', PaymentOptionController.toggleStatus);

// ========== Payments (Order Payments) ==========

paymentRoutes.get('/stats', PaymentController.getStats);
paymentRoutes.get('/', PaymentController.list);
paymentRoutes.get('/:id', PaymentController.getById);

// ========== Transactions (Wallet/Coins) ==========

paymentRoutes.get('/transactions', TransactionController.list);
paymentRoutes.get('/transactions/ref/:reference', TransactionController.getByReference);
paymentRoutes.get('/transactions/:id', TransactionController.getById);

export { paymentRoutes };
