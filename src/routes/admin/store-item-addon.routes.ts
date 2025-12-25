import { Hono } from 'hono';
import { StoreItemAddonController } from '../../controllers/admin/store-item-addon.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const storeItemAddonRoutes = new Hono();

// All routes require auth + city admin level + geo access
storeItemAddonRoutes.use('*', adminAuthMiddleware);
storeItemAddonRoutes.use('*', cityAdminMiddleware);
storeItemAddonRoutes.use('*', geoAccessMiddleware);

// List addons for an item
storeItemAddonRoutes.get('/item/:itemId', StoreItemAddonController.list);

// Get addon by ID
storeItemAddonRoutes.get('/:id', StoreItemAddonController.getById);

// Create addon
storeItemAddonRoutes.post('/item/:itemId', StoreItemAddonController.create);

// Update addon
storeItemAddonRoutes.put('/:id', StoreItemAddonController.update);

// Delete addon
storeItemAddonRoutes.delete('/:id', StoreItemAddonController.delete);

// Reorder addons
storeItemAddonRoutes.post('/item/:itemId/reorder', StoreItemAddonController.reorder);

// Duplicate addons to another item
storeItemAddonRoutes.post('/item/:itemId/duplicate', StoreItemAddonController.duplicate);

export { storeItemAddonRoutes };
