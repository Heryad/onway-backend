import { Hono } from 'hono';
import { CategoryController } from '../../controllers/admin/category.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const categoryRoutes = new Hono();

categoryRoutes.use('*', adminAuthMiddleware);
categoryRoutes.use('*', cityAdminMiddleware);
categoryRoutes.use('*', geoAccessMiddleware);

categoryRoutes.get('/', CategoryController.list);
categoryRoutes.get('/:id', CategoryController.getById);
categoryRoutes.post('/', CategoryController.create);
categoryRoutes.put('/:id', CategoryController.update);
categoryRoutes.delete('/:id', CategoryController.delete);
categoryRoutes.patch('/:id/toggle-status', CategoryController.toggleStatus);

export { categoryRoutes };
