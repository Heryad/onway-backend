import { Hono } from 'hono';
import { SettingsController } from '../../controllers/admin/settings.controller';
import { adminAuthMiddleware, ownerOnlyMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const settingsRoutes = new Hono();

settingsRoutes.use('*', adminAuthMiddleware);

// Get global settings (all admins)
settingsRoutes.get('/global', geoAccessMiddleware, SettingsController.getGlobal);

// Get settings for current scope
settingsRoutes.get('/current', cityAdminMiddleware, geoAccessMiddleware, SettingsController.get);

// List all settings (owner only)
settingsRoutes.get('/', ownerOnlyMiddleware, SettingsController.list);

// Create settings (owner only)
settingsRoutes.post('/', ownerOnlyMiddleware, SettingsController.create);

// Update settings (owner only)
settingsRoutes.put('/:id', ownerOnlyMiddleware, SettingsController.update);

// Delete settings (owner only)
settingsRoutes.delete('/:id', ownerOnlyMiddleware, SettingsController.delete);

export { settingsRoutes };
