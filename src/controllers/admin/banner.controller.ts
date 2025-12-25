import type { Context } from 'hono';
import { z } from 'zod';
import { BannerService } from '../../services/admin/banner.service';
import { ApiResponse } from '../../lib';
import { bannerTypes } from '../../db/schema/banners';

const createBannerSchema = z.object({
    thumbnail: z.string().url(),
    sorting: z.number().int().optional(),
    type: z.enum(bannerTypes).optional(),
    clickUrl: z.string().url().optional(),
    storeId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    startsAt: z.string().datetime().transform(s => new Date(s)).optional(),
    expiresAt: z.string().datetime().transform(s => new Date(s)).optional(),
});

const updateBannerSchema = z.object({
    thumbnail: z.string().url().optional(),
    sorting: z.number().int().optional(),
    type: z.enum(bannerTypes).optional(),
    clickUrl: z.string().url().nullable().optional(),
    storeId: z.string().uuid().nullable().optional(),
    startsAt: z.string().datetime().transform(s => new Date(s)).nullable().optional(),
    expiresAt: z.string().datetime().transform(s => new Date(s)).nullable().optional(),
    isActive: z.boolean().optional(),
});

const listBannersSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    type: z.enum(bannerTypes).optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class BannerController {
    static async list(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');
        const validation = listBannersSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const filters = {
            ...validation.data,
            countryId: geoFilter.countryId ?? validation.data.countryId,
            cityId: geoFilter.cityId ?? validation.data.cityId,
        };

        const { data, total } = await BannerService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const banner = await BannerService.getById(id);

        if (!banner) {
            return ApiResponse.notFound(c, 'Banner not found');
        }

        return ApiResponse.success(c, { message: 'Banner retrieved', data: banner });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createBannerSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const banner = await BannerService.create(validation.data);
        return ApiResponse.created(c, banner, 'Banner created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateBannerSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await BannerService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Banner not found');
        }

        const banner = await BannerService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Banner updated successfully', data: banner });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await BannerService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Banner not found');
        }

        await BannerService.delete(id);
        return ApiResponse.success(c, { message: 'Banner deleted successfully' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await BannerService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Banner not found');
        }

        const banner = await BannerService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Banner ${banner?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: banner,
        });
    }
}
