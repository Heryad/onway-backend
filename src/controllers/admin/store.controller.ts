import type { Context } from 'hono';
import { z } from 'zod';
import { StoreService, storeAuthRoles } from '../../services/admin/store.service';
import { CityService } from '../../services/admin/city.service';
import { ApiResponse } from '../../lib';
import { discountTypes, thumbnailTypes, categoryDisplaySettings } from '../../db/schema/stores';

// Working hours schema
const workingHoursSchema = z.record(
    z.string(),
    z.object({
        open: z.string(),
        close: z.string(),
        is24Hours: z.boolean().optional(),
        isClosed: z.boolean().optional(),
    })
);

// Create store schema
const createStoreSchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().optional(),
    thumbnail: z.string().url().optional(),
    thumbnailType: z.enum(thumbnailTypes).optional(),

    hasSpecialDeliveryFee: z.boolean().optional(),
    specialDeliveryFee: z.string().optional(),
    minOrderAmount: z.string().optional(),

    discountType: z.enum(discountTypes).optional(),
    discountAmount: z.string().optional(),
    maxDiscountAmount: z.string().optional(),

    sorting: z.number().int().optional(),
    isPrime: z.boolean().optional(),
    isSponsored: z.boolean().optional(),
    isFeatured: z.boolean().optional(),

    workingHours: workingHoursSchema.optional(),
    preparationTime: z.number().int().min(1).optional(),

    geoLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
    address: z.string().max(500).optional(),

    categoryDisplaySetting: z.enum(categoryDisplaySettings).optional(),
    canPlaceOrder: z.boolean().optional(),
    acceptsScheduledOrders: z.boolean().optional(),
    commissionRate: z.string().optional(),
    sectionId: z.string().uuid().optional(),

    cityId: z.string().uuid(),
    countryId: z.string().uuid(),

    auth: z.object({
        username: z.string().min(3).max(100),
        email: z.string().email(),
        phone: z.string().optional(),
        password: z.string().min(8),
    }),
});

// Update store schema
const updateStoreSchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().nullable().optional(),
    thumbnail: z.string().url().nullable().optional(),
    thumbnailType: z.enum(thumbnailTypes).optional(),

    hasSpecialDeliveryFee: z.boolean().optional(),
    specialDeliveryFee: z.string().nullable().optional(),
    minOrderAmount: z.string().optional(),

    discountType: z.enum(discountTypes).nullable().optional(),
    discountAmount: z.string().nullable().optional(),
    maxDiscountAmount: z.string().nullable().optional(),

    sorting: z.number().int().optional(),
    isPrime: z.boolean().optional(),
    isSponsored: z.boolean().optional(),
    isFeatured: z.boolean().optional(),

    workingHours: workingHoursSchema.optional(),
    preparationTime: z.number().int().min(1).optional(),

    geoLocation: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
    address: z.string().max(500).optional(),

    categoryDisplaySetting: z.enum(categoryDisplaySettings).optional(),
    canPlaceOrder: z.boolean().optional(),
    acceptsScheduledOrders: z.boolean().optional(),
    commissionRate: z.string().optional(),
    sectionId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
});

// List stores schema
const listStoresSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    isPrime: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    isSponsored: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    isFeatured: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    sectionId: z.string().uuid().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    sortBy: z.enum(['createdAt', 'name', 'rating', 'sorting']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Add auth user schema
const addAuthUserSchema = z.object({
    username: z.string().min(3).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    role: z.enum(storeAuthRoles),
});

// Reset password schema
const resetPasswordSchema = z.object({
    authId: z.string().uuid(),
    newPassword: z.string().min(8),
});

export class StoreController {
    static async list(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');
        const validation = listStoresSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const filters = {
            ...validation.data,
            countryId: geoFilter.countryId ?? validation.data.countryId,
            cityId: geoFilter.cityId ?? validation.data.cityId,
        };

        const { data, total } = await StoreService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const store = await StoreService.getById(id);

        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        return ApiResponse.success(c, { message: 'Store retrieved', data: store });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createStoreSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Verify city exists
        const city = await CityService.getById(validation.data.cityId);
        if (!city) {
            return ApiResponse.badRequest(c, 'City not found');
        }

        // Check email uniqueness
        const emailExists = await StoreService.emailExists(validation.data.auth.email);
        if (emailExists) {
            return ApiResponse.conflict(c, 'Email already in use');
        }

        const store = await StoreService.create(validation.data);
        return ApiResponse.created(c, store, 'Store created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateStoreSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const store = await StoreService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Store updated successfully', data: store });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        await StoreService.delete(id);
        return ApiResponse.success(c, { message: 'Store deleted successfully' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const store = await StoreService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Store ${store?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: store,
        });
    }

    static async resetPassword(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = resetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const success = await StoreService.resetPassword(id, validation.data.authId, validation.data.newPassword);
        if (!success) {
            return ApiResponse.notFound(c, 'Auth user not found');
        }

        return ApiResponse.success(c, { message: 'Password reset successfully' });
    }

    static async addAuthUser(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = addAuthUserSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        // Check email uniqueness
        const emailExists = await StoreService.emailExists(validation.data.email);
        if (emailExists) {
            return ApiResponse.conflict(c, 'Email already in use');
        }

        const auth = await StoreService.addAuthUser(id, validation.data);
        return ApiResponse.created(c, auth, 'Auth user added successfully');
    }

    static async removeAuthUser(c: Context) {
        const storeId = c.req.param('id');
        const authId = c.req.param('authId');

        const existing = await StoreService.getById(storeId);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        // Prevent removing last auth user
        if (existing.auth && existing.auth.length <= 1) {
            return ApiResponse.badRequest(c, 'Cannot remove the last auth user');
        }

        const success = await StoreService.removeAuthUser(storeId, authId);
        if (!success) {
            return ApiResponse.notFound(c, 'Auth user not found');
        }

        return ApiResponse.success(c, { message: 'Auth user removed successfully' });
    }
}
