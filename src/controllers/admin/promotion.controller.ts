import type { Context } from 'hono';
import { z } from 'zod';
import { PromotionService } from '../../services/admin/promotion.service';
import { ApiResponse } from '../../lib';
import { promotionDiscountTypes } from '../../db/schema/promotions';

const createPromotionSchema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    discountType: z.enum(promotionDiscountTypes),
    discountAmount: z.string(),
    maxDiscountAmount: z.string().optional(),
    hasMainView: z.boolean().default(false),
    sorting: z.number().int().default(0),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
});

const updatePromotionSchema = createPromotionSchema.partial().extend({
    isActive: z.boolean().optional(),
});

const listPromotionsSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    hasMainView: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

const addStoreSchema = z.object({
    storeId: z.string().uuid(),
    sorting: z.number().int().default(0),
});

export class PromotionController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listPromotionsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await PromotionService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const promotion = await PromotionService.getById(id);

        if (!promotion) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && promotion.cityId && promotion.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && promotion.countryId && promotion.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Promotion retrieved', data: promotion });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createPromotionSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const promotion = await PromotionService.create(validation.data);
        return ApiResponse.created(c, promotion, 'Promotion created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updatePromotionSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await PromotionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const promotion = await PromotionService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Promotion updated', data: promotion });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await PromotionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        await PromotionService.delete(id);
        return ApiResponse.success(c, { message: 'Promotion deleted' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await PromotionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const promotion = await PromotionService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Promotion ${promotion?.isActive ? 'activated' : 'deactivated'}`,
            data: { id, isActive: promotion?.isActive },
        });
    }

    // ========== Store Links ==========

    static async getStores(c: Context) {
        const id = c.req.param('id');

        const existing = await PromotionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        const stores = await PromotionService.getStores(id);
        return ApiResponse.success(c, { message: 'Promotion stores', data: stores });
    }

    static async addStore(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = addStoreSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await PromotionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        try {
            const link = await PromotionService.addStore(id, validation.data.storeId, validation.data.sorting);
            return ApiResponse.created(c, link, 'Store added to promotion');
        } catch (error: any) {
            return ApiResponse.badRequest(c, error.message);
        }
    }

    static async removeStore(c: Context) {
        const id = c.req.param('id');
        const storeId = c.req.param('storeId');

        const existing = await PromotionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promotion not found');
        }

        await PromotionService.removeStore(id, storeId);
        return ApiResponse.success(c, { message: 'Store removed from promotion' });
    }
}
