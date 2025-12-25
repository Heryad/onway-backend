import { Hono } from 'hono';
import { StoreCategoryAssignmentController } from '../../controllers/admin/store-category-assignment.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const storeCategoryAssignmentRoutes = new Hono();

// All routes require auth + city admin level + geo access
storeCategoryAssignmentRoutes.use('*', adminAuthMiddleware);
storeCategoryAssignmentRoutes.use('*', cityAdminMiddleware);
storeCategoryAssignmentRoutes.use('*', geoAccessMiddleware);

// List all assignments (admin view)
storeCategoryAssignmentRoutes.get('/', StoreCategoryAssignmentController.list);

// Get categories for a store
storeCategoryAssignmentRoutes.get('/store/:storeId', StoreCategoryAssignmentController.getStoreCategories);

// Get stores in a category
storeCategoryAssignmentRoutes.get('/category/:categoryId', StoreCategoryAssignmentController.getStoresInCategory);

// Assign single category to store
storeCategoryAssignmentRoutes.post('/store/:storeId', StoreCategoryAssignmentController.assignCategory);

// Bulk assign categories to store
storeCategoryAssignmentRoutes.post('/store/:storeId/bulk', StoreCategoryAssignmentController.bulkAssign);

// Replace all categories for a store
storeCategoryAssignmentRoutes.put('/store/:storeId', StoreCategoryAssignmentController.replaceCategories);

// Update assignment (sorting, sponsored)
storeCategoryAssignmentRoutes.patch('/:assignmentId', StoreCategoryAssignmentController.updateAssignment);

// Remove category from store
storeCategoryAssignmentRoutes.delete('/store/:storeId/category/:categoryId', StoreCategoryAssignmentController.removeAssignment);

export { storeCategoryAssignmentRoutes };
