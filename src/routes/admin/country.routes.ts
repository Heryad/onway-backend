import { Hono } from 'hono';
import { CountryController } from '../../controllers/admin/country.controller';
import { adminAuthMiddleware, ownerOnlyMiddleware, countryAdminMiddleware } from '../../middleware/admin/auth';

const countryRoutes = new Hono();

// All routes require authentication
countryRoutes.use('*', adminAuthMiddleware);

// List and view - accessible by owner and country admins
countryRoutes.get('/', countryAdminMiddleware, CountryController.list);
countryRoutes.get('/:id', countryAdminMiddleware, CountryController.getById);

// Create and delete - owner only
countryRoutes.post('/', ownerOnlyMiddleware, CountryController.create);
countryRoutes.delete('/:id', ownerOnlyMiddleware, CountryController.delete);

// Update and toggle status - owner and country admin (with geo check)
countryRoutes.put('/:id', countryAdminMiddleware, CountryController.update);
countryRoutes.patch('/:id/toggle-status', countryAdminMiddleware, CountryController.toggleStatus);

export { countryRoutes };
