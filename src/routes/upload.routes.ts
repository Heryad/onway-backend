import { Hono } from 'hono';
import { UploadController } from '../controllers/upload.controller';
import { adminAuthMiddleware } from '../middleware/admin/auth';

const uploadRoutes = new Hono();

// For now, protect with admin auth. 
// TODO: Update to support User/Driver/Store tokens when those APIs are built.
// Or allow public upload if valid use case exists (unlikely due to abuse risk).
uploadRoutes.use('*', adminAuthMiddleware);

uploadRoutes.post('/', UploadController.upload);

export { uploadRoutes };
