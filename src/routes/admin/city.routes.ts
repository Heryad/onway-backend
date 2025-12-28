import { Hono } from 'hono';
import { CityController } from '../../controllers/admin/city.controller';
import { adminAuthMiddleware, countryAdminMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const cityRoutes = new Hono();

// All routes require authentication
cityRoutes.use('*', adminAuthMiddleware);

// List and view - accessible by owner, country admins, and city admins (with geo filtering)
cityRoutes.get('/', cityAdminMiddleware, CityController.list);
cityRoutes.get('/:id', cityAdminMiddleware, geoAccessMiddleware, CityController.getById);

// Create and delete - owner and country admin only
cityRoutes.post('/', countryAdminMiddleware, geoAccessMiddleware, CityController.create);
cityRoutes.delete('/:id', countryAdminMiddleware, geoAccessMiddleware, CityController.delete);

// Update and toggle status - owner, country admin, and city admin (with geo check)
cityRoutes.put('/:id', cityAdminMiddleware, geoAccessMiddleware, CityController.update);
cityRoutes.patch('/:id/toggle-status', cityAdminMiddleware, geoAccessMiddleware, CityController.toggleStatus);

export { cityRoutes };
