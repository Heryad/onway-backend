import { Hono } from 'hono';
import { SectionController } from '../../controllers/admin/section.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const sectionRoutes = new Hono();

sectionRoutes.use('*', adminAuthMiddleware);
sectionRoutes.use('*', cityAdminMiddleware);
sectionRoutes.use('*', geoAccessMiddleware);

sectionRoutes.get('/', SectionController.list);
sectionRoutes.get('/:id', SectionController.getById);
sectionRoutes.post('/', SectionController.create);
sectionRoutes.put('/:id', SectionController.update);
sectionRoutes.delete('/:id', SectionController.delete);
sectionRoutes.patch('/:id/toggle-status', SectionController.toggleStatus);

export { sectionRoutes };
