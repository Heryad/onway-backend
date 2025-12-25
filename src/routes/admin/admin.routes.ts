import { Hono } from 'hono';
import { AdminController } from '../../controllers/admin/admin.controller';
import { adminAuthMiddleware, adminManagementMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const adminCrudRoutes = new Hono();

// All routes require authentication + admin management role + geo access
adminCrudRoutes.use('*', adminAuthMiddleware);
adminCrudRoutes.use('*', adminManagementMiddleware);
adminCrudRoutes.use('*', geoAccessMiddleware);

// CRUD endpoints
adminCrudRoutes.get('/', AdminController.list);
adminCrudRoutes.get('/:id', AdminController.getById);
adminCrudRoutes.post('/', AdminController.create);
adminCrudRoutes.put('/:id', AdminController.update);
adminCrudRoutes.delete('/:id', AdminController.delete);
adminCrudRoutes.patch('/:id/toggle-status', AdminController.toggleStatus);

export { adminCrudRoutes };
