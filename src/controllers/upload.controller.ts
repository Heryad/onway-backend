import type { Context } from 'hono';
import { StorageService } from '../services/storage.service';
import { ApiResponse } from '../lib';
import { config } from '../config';

export class UploadController {
    static async upload(c: Context) {
        try {
            const body = await c.req.parseBody();
            const file = body['file'];
            const type = body['type'] as string || 'general'; // Folder: avatars, products, etc.
            const countryId = body['countryId'] as string; // Optional isolation

            if (!file) {
                return ApiResponse.badRequest(c, 'No file provided');
            }

            // Hono returns File or string. Ensure it's a file.
            if (!(file instanceof File)) {
                return ApiResponse.badRequest(c, 'Invalid file');
            }

            // Validate Size
            if (file.size > config.MAX_FILE_SIZE) {
                return ApiResponse.badRequest(c, `File too large. Max ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);
            }

            // Validate Type (Optional whitelist)
            // For now allow all, but secure against scripts?
            // S3 assumes files are static. 
            // Minio/S3 content-type is set.

            const buffer = Buffer.from(await file.arrayBuffer());

            const result = await StorageService.upload({
                file,
                buffer,
                filename: file.name,
                mimeType: file.type,
                folder: type,
                countryId,
            });

            return ApiResponse.created(c, result, 'File uploaded successfully');

        } catch (error: any) {
            return ApiResponse.internalError(c, 'Upload failed', error.message);
        }
    }
}
