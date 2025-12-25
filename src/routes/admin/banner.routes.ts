import { Hono } from 'hono';
import { BannerController } from '../../controllers/admin/banner.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const bannerRoutes = new Hono();

bannerRoutes.use('*', adminAuthMiddleware);
bannerRoutes.use('*', cityAdminMiddleware);
bannerRoutes.use('*', geoAccessMiddleware);

bannerRoutes.get('/', BannerController.list);
bannerRoutes.get('/:id', BannerController.getById);
bannerRoutes.post('/', BannerController.create);
bannerRoutes.put('/:id', BannerController.update);
bannerRoutes.delete('/:id', BannerController.delete);
bannerRoutes.patch('/:id/toggle-status', BannerController.toggleStatus);

export { bannerRoutes };
