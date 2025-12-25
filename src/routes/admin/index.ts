import { Hono } from 'hono';
import { authRoutes } from './auth.routes';
import { adminCrudRoutes } from './admin.routes';

const adminRoutes = new Hono();

// Mount auth routes
adminRoutes.route('/auth', authRoutes);

// Mount admin CRUD routes
adminRoutes.route('/admins', adminCrudRoutes);

export { adminRoutes };
