import { Client } from 'minio';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { config } from '../config';
import { logger } from '../lib/logger';
import path from 'path';

// Parse S3 endpoint to get MinIO config
const s3Url = new URL(config.S3_ENDPOINT);
const useSSL = s3Url.protocol === 'https:';
const port = s3Url.port ? parseInt(s3Url.port) : (useSSL ? 443 : 80);
const endPoint = s3Url.hostname;

const minioClient = new Client({
    endPoint,
    port,
    useSSL,
    accessKey: config.S3_ACCESS_KEY,
    secretKey: config.S3_SECRET_KEY,
    region: config.S3_REGION,
});

export interface UploadFileInput {
    file: File | Blob;
    buffer: Buffer;
    filename: string;
    mimeType: string;
    folder: string; // e.g., 'avatars', 'products', 'documents'
    countryId?: string; // Optional isolation by country
}

export interface UploadResult {
    url: string;
    thumbnailUrl?: string;
    filename: string; // Stored filename
    path: string; // Full key in bucket
    size: number;
    mimeType: string;
}

export class StorageService {
    private static bucket = config.S3_BUCKET;

    /**
     * Initialize bucket if it doesn't exist
     */
    static async params() {
        try {
            const exists = await minioClient.bucketExists(this.bucket);
            if (!exists) {
                await minioClient.makeBucket(this.bucket, config.S3_REGION);

                // Set bucket policy to public read for standard access (optional, depends on requirement)
                // For now, we assume links are public
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${this.bucket}/*`],
                        },
                    ],
                };
                await minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
                logger.info({ bucket: this.bucket }, 'Created MinIO bucket with public policy');
            }
        } catch (error) {
            logger.error({ error }, 'Failed to check/create MinIO bucket');
            // Don't crash, maybe temporary connection issue
        }
    }

    /**
     * Upload file (with optional image optimization and thumbnail generation)
     */
    static async upload(input: UploadFileInput): Promise<UploadResult> {
        const { buffer, filename, mimeType, folder, countryId } = input;

        // Generate secure path structure:
        // {countryId?}/uploads/{folder}/{year}/{month}/{uuid}-{filename}
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uniqueId = nanoid(10);
        const saneFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = path.extname(saneFilename).toLowerCase();

        let basePath = `uploads/${folder}/${year}/${month}`;
        if (countryId) {
            basePath = `${countryId}/${basePath}`;
        }

        const objectName = `${basePath}/${uniqueId}${extension}`;
        const isImage = mimeType.startsWith('image/');
        let finalBuffer = buffer;
        let finalSize = buffer.length;
        let thumbnailUrl: string | undefined;

        try {
            // Processing for Images
            if (isImage) {
                const image = sharp(buffer);
                const metadata = await image.metadata();

                // 1. Optimize Original (convert to WebP or optimize JPEG/PNG)
                // For now, let's just optimize the original slightly if it's very large, 
                // but keep original format unless we want to force WebP.
                // User requirement: "results with uploading specialized to country, job... thumb"
                // Let's standardise on WebP for web usage if it's an uploaded photo, 
                // but keep original if it's something specific.
                // Strategy: Keep original format but compress.

                if (metadata.width && metadata.width > 2000) {
                    finalBuffer = await image.resize(2000, null, { withoutEnlargement: true }).toBuffer();
                } else {
                    // Just optimize standard buffer
                    // distinct format handling
                    if (extension === '.jpg' || extension === '.jpeg') {
                        finalBuffer = await image.jpeg({ quality: 85 }).toBuffer();
                    } else if (extension === '.png') {
                        finalBuffer = await image.png({ quality: 80 }).toBuffer();
                    } else if (extension === '.webp') {
                        finalBuffer = await image.webp({ quality: 85 }).toBuffer();
                    }
                }
                finalSize = finalBuffer.length;

                // 2. Generate Thumbnail (200x200 cover)
                const thumbnailBuffer = await image
                    .resize(300, 300, { fit: 'cover' })
                    .toBuffer();

                const thumbObjectName = `${basePath}/${uniqueId}_thumb${extension}`;
                await minioClient.putObject(this.bucket, thumbObjectName, thumbnailBuffer, thumbnailBuffer.length, {
                    'Content-Type': mimeType,
                });

                thumbnailUrl = `${config.S3_PUBLIC_URL}/${this.bucket}/${thumbObjectName}`;
            }

            // Upload Main File
            await minioClient.putObject(this.bucket, objectName, finalBuffer, finalSize, {
                'Content-Type': mimeType,
            });

            const url = `${config.S3_PUBLIC_URL}/${this.bucket}/${objectName}`;

            return {
                url,
                thumbnailUrl,
                filename: saneFilename,
                path: objectName,
                size: finalSize,
                mimeType,
            };

        } catch (error) {
            logger.error({ error, filename }, 'File upload failed');
            throw error;
        }
    }

    /**
     * Delete file from storage
     */
    static async delete(objectPath: string): Promise<void> {
        try {
            await minioClient.removeObject(this.bucket, objectPath);

            // Try to delete thumbnail if exists
            // Since we know the convention:
            // path: .../uuid.ext -> thumb: .../uuid_thumb.ext
            const ext = path.extname(objectPath);
            const thumbPath = objectPath.replace(ext, `_thumb${ext}`);
            await minioClient.removeObject(this.bucket, thumbPath);

        } catch (error) {
            logger.error({ error, path: objectPath }, 'File delete failed');
            // Don't crash
        }
    }
}

// Initialize on startup
StorageService.params();
