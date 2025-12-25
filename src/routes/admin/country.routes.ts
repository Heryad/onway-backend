import { Hono } from 'hono';
import { CountryController } from '../../controllers/admin/country.controller';
import { adminAuthMiddleware, ownerOnlyMiddleware } from '../../middleware/admin/auth';

const countryRoutes = new Hono();

// All routes require authentication + owner only (countries are global)
countryRoutes.use('*', adminAuthMiddleware);
countryRoutes.use('*', ownerOnlyMiddleware);

// CRUD endpoints
countryRoutes.get('/', CountryController.list);
countryRoutes.get('/:id', CountryController.getById);
countryRoutes.post('/', CountryController.create);
countryRoutes.put('/:id', CountryController.update);
countryRoutes.delete('/:id', CountryController.delete);
countryRoutes.patch('/:id/toggle-status', CountryController.toggleStatus);

export { countryRoutes };
