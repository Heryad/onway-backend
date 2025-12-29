import { Hono } from 'hono';
import { AdministrativeContextController } from '../../controllers/admin/context.controller';
import { adminAuthMiddleware } from '../../middleware/admin/auth';

const contextRoutes = new Hono();

// GET /admin/context
contextRoutes.get('/', adminAuthMiddleware, AdministrativeContextController.getContext);

export { contextRoutes };
