import { Hono } from 'hono';
import { PromotionController } from '../../controllers/admin/promotion.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const promotionRoutes = new Hono();

promotionRoutes.use('*', adminAuthMiddleware);
promotionRoutes.use('*', cityAdminMiddleware);
promotionRoutes.use('*', geoAccessMiddleware);

// List promotions
promotionRoutes.get('/', PromotionController.list);

// Get promotion details
promotionRoutes.get('/:id', PromotionController.getById);

// Create promotion
promotionRoutes.post('/', PromotionController.create);

// Update promotion
promotionRoutes.put('/:id', PromotionController.update);

// Delete promotion
promotionRoutes.delete('/:id', PromotionController.delete);

// Toggle status
promotionRoutes.patch('/:id/toggle-status', PromotionController.toggleStatus);

// ========== Store Links ==========

// Get linked stores
promotionRoutes.get('/:id/stores', PromotionController.getStores);

// Add store to promotion
promotionRoutes.post('/:id/stores', PromotionController.addStore);

// Remove store from promotion
promotionRoutes.delete('/:id/stores/:storeId', PromotionController.removeStore);

export { promotionRoutes };
