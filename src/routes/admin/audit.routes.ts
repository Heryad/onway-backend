import { Hono } from 'hono';
import { AuditController } from '../../controllers/admin/audit.controller';
import { adminAuthMiddleware, ownerOnlyMiddleware } from '../../middleware/admin/auth';

const auditRoutes = new Hono();

auditRoutes.use('*', adminAuthMiddleware);
auditRoutes.use('*', ownerOnlyMiddleware); // Owner only can view audit logs

// List audit logs
auditRoutes.get('/', AuditController.list);

// Get specific log
auditRoutes.get('/:id', AuditController.getById);

// Get logs for a specific record
auditRoutes.get('/record/:table/:recordId', AuditController.getForRecord);

// Get logs for a specific admin
auditRoutes.get('/admin/:adminId', AuditController.getForAdmin);

export { auditRoutes };
