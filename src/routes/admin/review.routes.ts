import { Hono } from 'hono';
import { ReviewController } from '../../controllers/admin/review.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const reviewRoutes = new Hono();

reviewRoutes.use('*', adminAuthMiddleware);
reviewRoutes.use('*', cityAdminMiddleware);
reviewRoutes.use('*', geoAccessMiddleware);

// Get pending count
reviewRoutes.get('/pending-count', ReviewController.getPendingCount);

// List reviews
reviewRoutes.get('/', ReviewController.list);

// Get review details
reviewRoutes.get('/:id', ReviewController.getById);

// Approve review
reviewRoutes.patch('/:id/approve', ReviewController.approve);

// Reject review
reviewRoutes.patch('/:id/reject', ReviewController.reject);

// Delete review
reviewRoutes.delete('/:id', ReviewController.delete);

export { reviewRoutes };
