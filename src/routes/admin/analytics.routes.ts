import { Hono } from 'hono';
import { AnalyticsController } from '../../controllers/admin/analytics.controller';
import { adminAuthMiddleware, supportAccessMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const analyticsRoutes = new Hono();

// All analytics routes require authentication + support level access + geo filtering
analyticsRoutes.use('*', adminAuthMiddleware);
analyticsRoutes.use('*', supportAccessMiddleware);
analyticsRoutes.use('*', geoAccessMiddleware);

// Get comprehensive analytics
analyticsRoutes.get('/', AnalyticsController.getAnalytics);

export { analyticsRoutes };
