import { Hono } from 'hono';
import { OrderController } from '../../controllers/admin/order.controller';
import { adminAuthMiddleware, supportAccessMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const orderRoutes = new Hono();

// Auth + Support level + Geo
orderRoutes.use('*', adminAuthMiddleware);
orderRoutes.use('*', supportAccessMiddleware);
orderRoutes.use('*', geoAccessMiddleware);

// List orders
orderRoutes.get('/', OrderController.list);

// Get by order number
orderRoutes.get('/number/:orderNumber', OrderController.getByOrderNumber);

// Get order details
orderRoutes.get('/:id', OrderController.getById);

// Get order items
orderRoutes.get('/:id/items', OrderController.getItems);

// Get status history
orderRoutes.get('/:id/history', OrderController.getStatusHistory);

// ========== Phase 2: Operations ==========

// Update status
orderRoutes.patch('/:id/status', OrderController.updateStatus);

// Cancel order
orderRoutes.post('/:id/cancel', OrderController.cancel);

// Add internal note
orderRoutes.post('/:id/notes', OrderController.addNote);

// ========== Phase 3: Dispatch & Assignment ==========

// Get assigned driver
orderRoutes.get('/:id/driver', OrderController.getAssignedDriver);

// Assign driver
orderRoutes.post('/:id/assign-driver', OrderController.assignDriver);

// Reassign driver
orderRoutes.post('/:id/reassign-driver', OrderController.reassignDriver);

// ========== Phase 4: Refunds ==========

// Initiate refund
orderRoutes.post('/:id/refund', OrderController.initiateRefund);

export { orderRoutes };
