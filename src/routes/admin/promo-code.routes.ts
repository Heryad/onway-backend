import { Hono } from 'hono';
import { PromoCodeController } from '../../controllers/admin/promo-code.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const promoCodeRoutes = new Hono();

promoCodeRoutes.use('*', adminAuthMiddleware);
promoCodeRoutes.use('*', cityAdminMiddleware);
promoCodeRoutes.use('*', geoAccessMiddleware);

// List promo codes
promoCodeRoutes.get('/', PromoCodeController.list);

// Get promo code details
promoCodeRoutes.get('/:id', PromoCodeController.getById);

// Create promo code
promoCodeRoutes.post('/', PromoCodeController.create);

// Update promo code
promoCodeRoutes.put('/:id', PromoCodeController.update);

// Delete promo code
promoCodeRoutes.delete('/:id', PromoCodeController.delete);

// Toggle status
promoCodeRoutes.patch('/:id/toggle-status', PromoCodeController.toggleStatus);

export { promoCodeRoutes };
