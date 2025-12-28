import { Hono } from 'hono';
import { SettingsController } from '../../controllers/admin/settings.controller';
import { adminAuthMiddleware, ownerOnlyMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const settingsRoutes = new Hono();

settingsRoutes.use('*', adminAuthMiddleware);

// Get global settings (all admins)
settingsRoutes.get('/global', geoAccessMiddleware, SettingsController.getGlobal);

// Get settings for current scope
settingsRoutes.get('/current', cityAdminMiddleware, geoAccessMiddleware, SettingsController.get);

// List all settings (filtered by scope)
settingsRoutes.get('/', cityAdminMiddleware, geoAccessMiddleware, SettingsController.list);

// Create settings (scope restricted)
settingsRoutes.post('/', cityAdminMiddleware, geoAccessMiddleware, SettingsController.create);

// Update settings (scope restricted)
settingsRoutes.put('/:id', cityAdminMiddleware, geoAccessMiddleware, SettingsController.update);

// Delete settings (scope restricted)
settingsRoutes.delete('/:id', cityAdminMiddleware, geoAccessMiddleware, SettingsController.delete);

export { settingsRoutes };
