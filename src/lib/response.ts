import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Response status codes
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// Base response structure
interface BaseResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
    meta?: PaginationMeta;
    timestamp: string;
}

// Pagination metadata
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// Success response options
interface SuccessOptions<T> {
    message?: string;
    data?: T;
    meta?: PaginationMeta;
    status?: number;
}

// Error response options
interface ErrorOptions {
    message: string;
    error?: string;
    errors?: Record<string, string[]>;
    status?: number;
}

// Response handler class
export class ApiResponse {
    // Success response
    static success<T>(c: Context, options: SuccessOptions<T> = {}) {
        const {
            message = 'Success',
            data,
            meta,
            status = HttpStatus.OK,
        } = options;

        const response: BaseResponse<T> = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
        };

        if (data !== undefined) {
            response.data = data;
        }

        if (meta) {
            response.meta = meta;
        }

        return c.json(response, status as ContentfulStatusCode);
    }

    // Created response (201)
    static created<T>(c: Context, data: T, message = 'Created successfully') {
        return this.success(c, {
            message,
            data,
            status: HttpStatus.CREATED,
        });
    }

    // No content response (204)
    static noContent(c: Context) {
        return c.body(null, HttpStatus.NO_CONTENT);
    }

    // Paginated response
    static paginated<T>(
        c: Context,
        data: T[],
        pagination: { page: number; limit: number; total: number },
        message = 'Success'
    ) {
        const { page, limit, total } = pagination;
        const totalPages = Math.ceil(total / limit);

        return this.success(c, {
            message,
            data,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    }

    // Error response
    static error(c: Context, options: ErrorOptions) {
        const {
            message,
            error,
            errors,
            status = HttpStatus.INTERNAL_SERVER_ERROR,
        } = options;

        const response: BaseResponse = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };

        if (error) {
            response.error = error;
        }

        if (errors) {
            response.errors = errors;
        }

        return c.json(response, status as ContentfulStatusCode);
    }

    // Bad request (400)
    static badRequest(c: Context, message = 'Bad request', errors?: Record<string, string[]>) {
        return this.error(c, {
            message,
            errors,
            status: HttpStatus.BAD_REQUEST,
        });
    }

    // Unauthorized (401)
    static unauthorized(c: Context, message = 'Unauthorized') {
        return this.error(c, {
            message,
            status: HttpStatus.UNAUTHORIZED,
        });
    }

    // Forbidden (403)
    static forbidden(c: Context, message = 'Forbidden') {
        return this.error(c, {
            message,
            status: HttpStatus.FORBIDDEN,
        });
    }

    // Not found (404)
    static notFound(c: Context, message = 'Resource not found') {
        return this.error(c, {
            message,
            status: HttpStatus.NOT_FOUND,
        });
    }

    // Conflict (409)
    static conflict(c: Context, message = 'Resource already exists') {
        return this.error(c, {
            message,
            status: HttpStatus.CONFLICT,
        });
    }

    // Validation error (422)
    static validationError(c: Context, errors: Record<string, string[]>, message = 'Validation failed') {
        return this.error(c, {
            message,
            errors,
            status: HttpStatus.UNPROCESSABLE_ENTITY,
        });
    }

    // Too many requests (429)
    static tooManyRequests(c: Context, message = 'Too many requests') {
        return this.error(c, {
            message,
            status: HttpStatus.TOO_MANY_REQUESTS,
        });
    }

    // Internal server error (500)
    static internalError(c: Context, message = 'Internal server error', error?: string) {
        return this.error(c, {
            message,
            error,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    // Service unavailable (503)
    static serviceUnavailable(c: Context, message = 'Service temporarily unavailable') {
        return this.error(c, {
            message,
            status: HttpStatus.SERVICE_UNAVAILABLE,
        });
    }
}
