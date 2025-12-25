import { Hono } from 'hono';
import { adminRoutes } from './admin';

const routes = new Hono();

// Mount admin routes under /admin
routes.route('/admin', adminRoutes);

export { routes };
