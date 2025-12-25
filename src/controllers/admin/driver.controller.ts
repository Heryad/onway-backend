import type { Context } from 'hono';
import { z } from 'zod';
import { DriverService } from '../../services/admin/driver.service';
import { ApiResponse } from '../../lib';
import { vehicleTypes } from '../../db/schema/drivers';

const createDriverSchema = z.object({
    username: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(5),
    password: z.string().min(6),
    avatar: z.string().url().optional(),
    vehicleType: z.enum(vehicleTypes),
    vehiclePlate: z.string().optional(),
    cityId: z.string().uuid(),
    countryId: z.string().uuid(),
    zoneId: z.string().uuid().optional(),
});

const updateDriverSchema = z.object({
    username: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    avatar: z.string().url().optional(),
    vehicleType: z.enum(vehicleTypes).optional(),
    vehiclePlate: z.string().optional(),
    zoneId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
});

const listDriversSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    zoneId: z.string().uuid().optional(),
    vehicleType: z.enum(vehicleTypes).optional(),
    isOnline: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortBy: z.enum(['createdAt', 'rating', 'totalDeliveries']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const toogleStatusSchema = z.object({
    isActive: z.boolean(),
});

const resetPasswordSchema = z.object({
    password: z.string().min(6),
});

export class DriverController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listDriversSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Apply geo filters from context if restricted
        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter }; // Override query with enforced geo fitlers

        const { data, total } = await DriverService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const driver = await DriverService.getById(id);

        if (!driver) {
            return ApiResponse.notFound(c, 'Driver not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && driver.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && driver.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const { passwordHash: _, ...safeDriver } = driver;
        return ApiResponse.success(c, { message: 'Driver retrieved', data: safeDriver });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createDriverSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Check duplicates
        if (await DriverService.emailExists(validation.data.email)) {
            return ApiResponse.conflict(c, 'Email already exists');
        }
        if (await DriverService.phoneExists(validation.data.phone)) {
            return ApiResponse.conflict(c, 'Phone already exists');
        }

        const driver = await DriverService.create(validation.data);
        return ApiResponse.created(c, driver, 'Driver created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateDriverSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await DriverService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Driver not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        // Check duplicates if changing email/phone
        if (validation.data.email && validation.data.email !== existing.email) {
            if (await DriverService.emailExists(validation.data.email, id)) {
                return ApiResponse.conflict(c, 'Email already exists');
            }
        }
        if (validation.data.phone && validation.data.phone !== existing.phone) {
            if (await DriverService.phoneExists(validation.data.phone, id)) {
                return ApiResponse.conflict(c, 'Phone already exists');
            }
        }

        const driver = await DriverService.update(id, validation.data);
        const { passwordHash: _, ...safeDriver } = driver!;
        return ApiResponse.success(c, { message: 'Driver updated', data: safeDriver });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await DriverService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Driver not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        await DriverService.delete(id);
        return ApiResponse.success(c, { message: 'Driver deleted' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await DriverService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Driver not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const driver = await DriverService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Driver ${driver?.isActive ? 'activated' : 'deactivated'}`,
            data: { id, isActive: driver?.isActive },
        });
    }

    static async resetPassword(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = resetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await DriverService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Driver not found');
        }

        // Access check
        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        await DriverService.resetPassword(id, validation.data.password);
        return ApiResponse.success(c, { message: 'Password reset successfully' });
    }
}
