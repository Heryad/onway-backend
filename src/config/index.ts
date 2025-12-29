import { z } from 'zod';

const envSchema = z.object({
    // App
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Fix: Move default before transform, or allow coercion
    PORT: z.string().default('3000').transform(Number),
    SOCKET_PORT: z.string().default('3008').transform(Number),
    API_VERSION: z.string().default('v1'),
    API_PREFIX: z.string().default('/api/v1'),

    // Database
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string(),

    // Typesense
    TYPESENSE_HOST: z.string().default('localhost'),
    TYPESENSE_PORT: z.string().default('8108').transform(Number),
    TYPESENSE_PROTOCOL: z.enum(['http', 'https']).default('http'),
    TYPESENSE_API_KEY: z.string(),

    // S3 (MinIO)
    S3_ENDPOINT: z.string().url(),
    S3_BUCKET: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_REGION: z.string().default('us-east-1'),
    S3_PUBLIC_URL: z.string().url(),

    // JWT
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // CORS
    CORS_ORIGINS: z.string().default('http://localhost:3001,http://localhost:5173'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

    // File Upload
    MAX_FILE_SIZE: z.string().default('52428800').transform(Number), // 50MB
});

// Validate and parse environment variables
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        console.error('❌ Invalid environment variables:', error);
        throw new Error('Invalid environment configuration');
    }
}

// Export the parsed config
export const config = parseEnv();

// Helper to check if production
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
