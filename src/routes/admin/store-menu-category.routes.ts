import { Hono } from 'hono';
import { StoreMenuCategoryController } from '../../controllers/admin/store-menu-category.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const storeMenuCategoryRoutes = new Hono();

// All routes require auth + city admin level + geo access
storeMenuCategoryRoutes.use('*', adminAuthMiddleware);
storeMenuCategoryRoutes.use('*', cityAdminMiddleware);
storeMenuCategoryRoutes.use('*', geoAccessMiddleware);

// List categories for a store
storeMenuCategoryRoutes.get('/store/:storeId', StoreMenuCategoryController.list);

// Get category by ID
storeMenuCategoryRoutes.get('/:id', StoreMenuCategoryController.getById);

// Create category
storeMenuCategoryRoutes.post('/store/:storeId', StoreMenuCategoryController.create);

// Update category
storeMenuCategoryRoutes.put('/:id', StoreMenuCategoryController.update);

// Delete category
storeMenuCategoryRoutes.delete('/:id', StoreMenuCategoryController.delete);

// Toggle active status
storeMenuCategoryRoutes.patch('/:id/toggle-status', StoreMenuCategoryController.toggleStatus);

// Reorder categories
storeMenuCategoryRoutes.post('/store/:storeId/reorder', StoreMenuCategoryController.reorder);

export { storeMenuCategoryRoutes };
