import { Hono } from 'hono';
import { StoreItemController } from '../../controllers/admin/store-item.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const storeItemRoutes = new Hono();

// All routes require auth + city admin level + geo access
storeItemRoutes.use('*', adminAuthMiddleware);
storeItemRoutes.use('*', cityAdminMiddleware);
storeItemRoutes.use('*', geoAccessMiddleware);

// List items for a store
storeItemRoutes.get('/store/:storeId', StoreItemController.list);

// Get item by ID
storeItemRoutes.get('/:id', StoreItemController.getById);

// Create item
storeItemRoutes.post('/store/:storeId', StoreItemController.create);

// Update item
storeItemRoutes.put('/:id', StoreItemController.update);

// Delete item
storeItemRoutes.delete('/:id', StoreItemController.delete);

// Toggle status
storeItemRoutes.patch('/:id/toggle-status', StoreItemController.toggleStatus);

// Toggle stock
storeItemRoutes.patch('/:id/toggle-stock', StoreItemController.toggleStock);

// Bulk update stock
storeItemRoutes.post('/bulk-stock', StoreItemController.bulkStock);

// Reorder items
storeItemRoutes.post('/reorder', StoreItemController.reorder);

export { storeItemRoutes };
