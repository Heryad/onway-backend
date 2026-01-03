import type { Context } from 'hono';
import { z } from 'zod';
import { AnalyticsService } from '../../services/admin/analytics.service';
import { ApiResponse } from '../../lib';

const analyticsQuerySchema = z.object({
    countryId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export class AnalyticsController {
    /**
     * Get comprehensive analytics
     * Role-based access:
     * - owner: sees everything (countryId and cityId optional)
     * - country_admin: sees everything within their country (cityId optional)
     * - city_admin: sees everything within their city only
     */
    static async getAnalytics(c: Context) {
        const query = c.req.query();
        const validation = analyticsQuerySchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(
                c,
                validation.error.flatten().fieldErrors as Record<string, string[]>
            );
        }

        const admin = c.get('admin');
        const geoFilter = c.get('geoFilter');

        // Build filters based on role and request
        const filters = {
            startDate: validation.data.startDate,
            endDate: validation.data.endDate,
            countryId: validation.data.countryId,
            cityId: validation.data.cityId,
        };

        // Apply role-based geographic restrictions
        if (admin.role === 'city_admin') {
            // City admin can only see their city
            if (!geoFilter.cityId) {
                return ApiResponse.forbidden(c, 'City admin must have a city assignment');
            }
            filters.cityId = geoFilter.cityId;
            filters.countryId = geoFilter.countryId;
        } else if (admin.role === 'country_admin') {
            // Country admin can see their entire country or specific city within it
            if (!geoFilter.countryId) {
                return ApiResponse.forbidden(c, 'Country admin must have a country assignment');
            }
            filters.countryId = geoFilter.countryId;

            // If they request a specific city, verify it's in their country
            if (validation.data.cityId) {
                // The geoAccessMiddleware already validated this
                filters.cityId = validation.data.cityId;
            }
        }
        // Owner can see everything - use provided filters as-is

        // Validate date range
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        if (start > end) {
            return ApiResponse.badRequest(c, 'Start date must be before end date');
        }

        // Max 1 year range
        const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
        if (end.getTime() - start.getTime() > maxRange) {
            return ApiResponse.badRequest(c, 'Date range cannot exceed 1 year');
        }

        const analytics = await AnalyticsService.getAnalytics(filters);

        return ApiResponse.success(c, {
            message: 'Analytics retrieved successfully',
            data: analytics,
        });
    }
}
