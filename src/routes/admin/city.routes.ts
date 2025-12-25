import { Hono } from 'hono';
import { CityController } from '../../controllers/admin/city.controller';
import { adminAuthMiddleware, countryAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const cityRoutes = new Hono();

// All routes require authentication + country admin level + geo access
cityRoutes.use('*', adminAuthMiddleware);
cityRoutes.use('*', countryAdminMiddleware);
cityRoutes.use('*', geoAccessMiddleware);

// CRUD endpoints
cityRoutes.get('/', CityController.list);
cityRoutes.get('/:id', CityController.getById);
cityRoutes.post('/', CityController.create);
cityRoutes.put('/:id', CityController.update);
cityRoutes.delete('/:id', CityController.delete);
cityRoutes.patch('/:id/toggle-status', CityController.toggleStatus);

export { cityRoutes };
