import type { Context } from 'hono';
import { z } from 'zod';
import { PromoCodeService } from '../../services/admin/promo-code.service';
import { ApiResponse } from '../../lib';
import { promoDiscountTypes } from '../../db/schema/promo-codes';

const createPromoCodeSchema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    code: z.string().min(3).max(50),
    discountType: z.enum(promoDiscountTypes),
    discountAmount: z.string(),
    maxDiscountAmount: z.string().optional(),
    maxUses: z.number().int().positive().optional(),
    maxUsesPerUser: z.number().int().positive().default(1),
    minOrderAmount: z.string().optional(),
    firstOrderOnly: z.boolean().default(false),
    newUsersOnly: z.boolean().default(false),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
});

const updatePromoCodeSchema = createPromoCodeSchema.partial().extend({
    isActive: z.boolean().optional(),
});

const listPromoCodesSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    discountType: z.enum(promoDiscountTypes).optional(),
    expired: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

export class PromoCodeController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listPromoCodesSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await PromoCodeService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const promoCode = await PromoCodeService.getById(id);

        if (!promoCode) {
            return ApiResponse.notFound(c, 'Promo code not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && promoCode.cityId && promoCode.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && promoCode.countryId && promoCode.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Promo code retrieved', data: promoCode });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createPromoCodeSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Check code uniqueness
        const exists = await PromoCodeService.codeExists(validation.data.code);
        if (exists) {
            return ApiResponse.conflict(c, 'Promo code already exists');
        }

        const promoCode = await PromoCodeService.create(validation.data);
        return ApiResponse.created(c, promoCode, 'Promo code created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updatePromoCodeSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await PromoCodeService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promo code not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        // Check code uniqueness if changing
        if (validation.data.code && validation.data.code !== existing.code) {
            const exists = await PromoCodeService.codeExists(validation.data.code, id);
            if (exists) {
                return ApiResponse.conflict(c, 'Promo code already exists');
            }
        }

        const promoCode = await PromoCodeService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Promo code updated', data: promoCode });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await PromoCodeService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promo code not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        await PromoCodeService.delete(id);
        return ApiResponse.success(c, { message: 'Promo code deleted' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await PromoCodeService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Promo code not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const promoCode = await PromoCodeService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Promo code ${promoCode?.isActive ? 'activated' : 'deactivated'}`,
            data: { id, isActive: promoCode?.isActive },
        });
    }
}
