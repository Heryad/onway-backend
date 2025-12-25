import type { Context } from 'hono';
import { z } from 'zod';
import { ReviewService } from '../../services/admin/review.service';
import { ApiResponse } from '../../lib';
import { reviewTypes, reviewStatuses } from '../../db/schema/reviews';

const listReviewsSchema = z.object({
    type: z.enum(reviewTypes).optional(),
    status: z.enum(reviewStatuses).optional(),
    rating: z.coerce.number().min(1).max(5).optional(),
    userId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
    driverId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

const rejectSchema = z.object({
    reason: z.string().min(5),
});

export class ReviewController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listReviewsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await ReviewService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const review = await ReviewService.getById(id);

        if (!review) {
            return ApiResponse.notFound(c, 'Review not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && review.cityId && review.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && review.countryId && review.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Review retrieved', data: review });
    }

    static async approve(c: Context) {
        const id = c.req.param('id');

        const existing = await ReviewService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Review not found');
        }

        if (existing.status === 'approved') {
            return ApiResponse.badRequest(c, 'Review is already approved');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const review = await ReviewService.approve(id);
        return ApiResponse.success(c, { message: 'Review approved', data: review });
    }

    static async reject(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = rejectSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await ReviewService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Review not found');
        }

        if (existing.status === 'rejected') {
            return ApiResponse.badRequest(c, 'Review is already rejected');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const review = await ReviewService.reject(id, validation.data.reason);
        return ApiResponse.success(c, { message: 'Review rejected', data: review });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await ReviewService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Review not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        await ReviewService.delete(id);
        return ApiResponse.success(c, { message: 'Review deleted' });
    }

    static async getPendingCount(c: Context) {
        const geoFilter = c.get('geoFilter');
        const count = await ReviewService.getPendingCount(geoFilter);
        return ApiResponse.success(c, { message: 'Pending count', data: { count } });
    }
}
