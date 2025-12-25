import { Hono } from 'hono';
import { SupportController } from '../../controllers/admin/support.controller';
import { adminAuthMiddleware, supportAccessMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const supportRoutes = new Hono();

supportRoutes.use('*', adminAuthMiddleware);
supportRoutes.use('*', supportAccessMiddleware);
supportRoutes.use('*', geoAccessMiddleware);

// List tickets
supportRoutes.get('/', SupportController.list);

// Get ticket details
supportRoutes.get('/:id', SupportController.getById);

// Update status
supportRoutes.patch('/:id/status', SupportController.updateStatus);

// Assign to admin
supportRoutes.patch('/:id/assign', SupportController.assign);

// Update priority
supportRoutes.patch('/:id/priority', SupportController.updatePriority);

// Update department
supportRoutes.patch('/:id/department', SupportController.updateDepartment);

// Get messages
supportRoutes.get('/:id/messages', SupportController.getMessages);

// Reply to ticket
supportRoutes.post('/:id/messages', SupportController.addMessage);

export { supportRoutes };
