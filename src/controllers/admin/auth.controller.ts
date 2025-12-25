import type { Context } from 'hono';
import { z } from 'zod';
import { AdminAuthService } from '../../services/admin/auth.service';
import { ApiResponse } from '../../lib';
import { authLogger } from '../../lib/logger';

// Validation schemas
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class AdminAuthController {
    // POST /admin/auth/login
    static async login(c: Context) {
        const body = await c.req.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const { email, password } = validation.data;
        const result = await AdminAuthService.login(email, password);

        if (!result) {
            return ApiResponse.unauthorized(c, 'Invalid email or password');
        }

        return ApiResponse.success(c, {
            message: 'Login successful',
            data: result,
        });
    }

    // POST /admin/auth/refresh
    static async refresh(c: Context) {
        const body = await c.req.json();
        const validation = refreshSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const { refreshToken } = validation.data;
        const tokens = await AdminAuthService.refreshTokens(refreshToken);

        if (!tokens) {
            return ApiResponse.unauthorized(c, 'Invalid or expired refresh token');
        }

        return ApiResponse.success(c, {
            message: 'Tokens refreshed successfully',
            data: tokens,
        });
    }

    // GET /admin/auth/me
    static async me(c: Context) {
        const adminPayload = c.get('admin');
        const admin = await AdminAuthService.getById(adminPayload.adminId);

        if (!admin) {
            return ApiResponse.notFound(c, 'Admin not found');
        }

        // Return safe data (exclude password)
        const { passwordHash, ...safeAdmin } = admin;

        return ApiResponse.success(c, {
            message: 'Admin profile retrieved',
            data: safeAdmin,
        });
    }

    // POST /admin/auth/logout
    static async logout(c: Context) {
        // For stateless JWT, logout is handled client-side
        // This endpoint can be used for logging or token blacklisting if needed
        const adminPayload = c.get('admin');
        authLogger.info({ adminId: adminPayload.adminId }, 'Admin logged out');

        return ApiResponse.success(c, {
            message: 'Logout successful',
        });
    }
}
