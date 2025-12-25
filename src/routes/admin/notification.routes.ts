import { Hono } from 'hono';
import { NotificationController } from '../../controllers/admin/notification.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const notificationRoutes = new Hono();

notificationRoutes.use('*', adminAuthMiddleware);
notificationRoutes.use('*', cityAdminMiddleware);
notificationRoutes.use('*', geoAccessMiddleware);

// List user notifications
notificationRoutes.get('/', NotificationController.list);

// Send to single user
notificationRoutes.post('/send', NotificationController.send);

// Broadcast to multiple users
notificationRoutes.post('/broadcast', NotificationController.broadcast);

export { notificationRoutes };
