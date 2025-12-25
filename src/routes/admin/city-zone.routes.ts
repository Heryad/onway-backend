import { Hono } from 'hono';
import { CityZoneController } from '../../controllers/admin/city-zone.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const cityZoneRoutes = new Hono();

// All routes require authentication + city admin level + geo access
cityZoneRoutes.use('*', adminAuthMiddleware);
cityZoneRoutes.use('*', cityAdminMiddleware);
cityZoneRoutes.use('*', geoAccessMiddleware);

// CRUD endpoints
cityZoneRoutes.get('/', CityZoneController.list);
cityZoneRoutes.get('/:id', CityZoneController.getById);
cityZoneRoutes.post('/', CityZoneController.create);
cityZoneRoutes.put('/:id', CityZoneController.update);
cityZoneRoutes.delete('/:id', CityZoneController.delete);
cityZoneRoutes.patch('/:id/toggle-status', CityZoneController.toggleStatus);

export { cityZoneRoutes };
