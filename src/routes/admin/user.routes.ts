import { Hono } from 'hono';
import { UserController } from '../../controllers/admin/user.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const userRoutes = new Hono();

// Auth + Role + Geo
userRoutes.use('*', adminAuthMiddleware);
userRoutes.use('*', cityAdminMiddleware);
userRoutes.use('*', geoAccessMiddleware);

// List users
userRoutes.get('/', UserController.list);

// Get user details
userRoutes.get('/:id', UserController.getById);

// Update user
userRoutes.put('/:id', UserController.update);

// Toggle status (Ban/Unban)
userRoutes.patch('/:id/toggle-status', UserController.toggleStatus);

// Get user addresses
userRoutes.get('/:id/addresses', UserController.getAddresses);

export { userRoutes };
