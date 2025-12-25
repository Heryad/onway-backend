import { Hono } from 'hono';
import { DriverController } from '../../controllers/admin/driver.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const driverRoutes = new Hono();

// Auth + Role + Geo restriction
driverRoutes.use('*', adminAuthMiddleware);
driverRoutes.use('*', cityAdminMiddleware);
driverRoutes.use('*', geoAccessMiddleware);

// List drivers
driverRoutes.get('/', DriverController.list);

// Get driver
driverRoutes.get('/:id', DriverController.getById);

// Create driver
driverRoutes.post('/', DriverController.create);

// Update driver
driverRoutes.put('/:id', DriverController.update);

// Delete driver
driverRoutes.delete('/:id', DriverController.delete);

// Toggle status (Active/Inactive)
driverRoutes.patch('/:id/toggle-status', DriverController.toggleStatus);

// Reset password
driverRoutes.post('/:id/reset-password', DriverController.resetPassword);

export { driverRoutes };
