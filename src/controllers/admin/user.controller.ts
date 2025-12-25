import type { Context } from 'hono';
import { z } from 'zod';
import { UserService } from '../../services/admin/user.service';
import { ApiResponse } from '../../lib';
import { genders } from '../../db/schema/users';

const listUsersSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    isPrime: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortBy: z.enum(['createdAt', 'username', 'email']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateUserSchema = z.object({
    username: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    gender: z.enum(genders).optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    isPrime: z.boolean().optional(),
    primeExpiresAt: z.string().optional(),
    coinsBalance: z.number().int().optional(),
    isActive: z.boolean().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
});

const toggleStatusSchema = z.object({
    isActive: z.boolean(),
});

export class UserController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listUsersSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await UserService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const user = await UserService.getById(id);

        if (!user) {
            return ApiResponse.notFound(c, 'User not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && user.cityId && user.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && user.countryId && user.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'User retrieved', data: user });
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await UserService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'User not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        // TODO: Check duplicates if email/phone changed?
        // Usually handled by DB unique constraint, but handling gracefully is better.
        // For brevity, relying on DB error or Service could handle it. 
        // Admin updates to email are RARE.

        try {
            const user = await UserService.update(id, validation.data);
            return ApiResponse.success(c, { message: 'User updated', data: user });
        } catch (error: any) {
            if (error.code === '23505') { // Postgres unique violation
                return ApiResponse.conflict(c, 'Email or Phone already in use');
            }
            throw error;
        }
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await UserService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'User not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const user = await UserService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `User ${user?.isActive ? 'activated' : 'deactivated'}`,
            data: { id, isActive: user?.isActive }
        });
    }

    static async getAddresses(c: Context) {
        const id = c.req.param('id');

        // Check user existence & access
        const existing = await UserService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'User not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const addresses = await UserService.getAddresses(id);
        return ApiResponse.success(c, { message: 'User addresses', data: addresses });
    }
}
