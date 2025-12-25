import { Hono } from 'hono';
import { StoreController } from '../../controllers/admin/store.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const storeRoutes = new Hono();

// All routes require auth + city admin level + geo access
storeRoutes.use('*', adminAuthMiddleware);
storeRoutes.use('*', cityAdminMiddleware);
storeRoutes.use('*', geoAccessMiddleware);

// Store CRUD
storeRoutes.get('/', StoreController.list);
storeRoutes.get('/:id', StoreController.getById);
storeRoutes.post('/', StoreController.create);
storeRoutes.put('/:id', StoreController.update);
storeRoutes.delete('/:id', StoreController.delete);
storeRoutes.patch('/:id/toggle-status', StoreController.toggleStatus);

// Store auth management
storeRoutes.post('/:id/reset-password', StoreController.resetPassword);
storeRoutes.post('/:id/auth-users', StoreController.addAuthUser);
storeRoutes.delete('/:id/auth-users/:authId', StoreController.removeAuthUser);

export { storeRoutes };
