import { Hono } from 'hono';
import { adminRoutes } from './admin';

const routes = new Hono();

// Mount admin routes under /admin
routes.route('/admin', adminRoutes);

// Mount upload routes
import { uploadRoutes } from './upload.routes';
routes.route('/upload', uploadRoutes);

export { routes };
