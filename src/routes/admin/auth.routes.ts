import { Hono } from 'hono';
import { AdminAuthController } from '../../controllers/admin/auth.controller';
import { adminAuthMiddleware } from '../../middleware/admin/auth';

const authRoutes = new Hono();

// Public routes
authRoutes.post('/login', AdminAuthController.login);
authRoutes.post('/refresh', AdminAuthController.refresh);

// Protected routes
authRoutes.get('/me', adminAuthMiddleware, AdminAuthController.me);
authRoutes.post('/logout', adminAuthMiddleware, AdminAuthController.logout);

export { authRoutes };
