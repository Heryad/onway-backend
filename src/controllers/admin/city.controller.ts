import type { Context } from 'hono';
import { z } from 'zod';
import { CityService } from '../../services/admin/city.service';
import { CountryService } from '../../services/admin/country.service';
import { ApiResponse } from '../../lib';

const createCitySchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    countryId: z.string().uuid(),
    baseDeliveryFee: z.string().optional(),
    primeDeliveryFee: z.string().optional(),
    freeDeliveryThreshold: z.string().optional(),
    serviceFee: z.string().optional(),
    taxRate: z.string().optional(),
    geoBounds: z.array(z.tuple([z.number(), z.number()])).optional(),
    timezone: z.string().optional(),
});

const updateCitySchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    baseDeliveryFee: z.string().optional(),
    primeDeliveryFee: z.string().optional(),
    freeDeliveryThreshold: z.string().nullable().optional(),
    serviceFee: z.string().optional(),
    taxRate: z.string().optional(),
    geoBounds: z.array(z.tuple([z.number(), z.number()])).nullable().optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional(),
});

const listCitiesSchema = z.object({
    countryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class CityController {
    static async list(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');
        const validation = listCitiesSchema.safeParse(query);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        // Apply geographic filters based on admin's scope
        const filters = {
            ...validation.data,
            countryId: geoFilter.countryId ?? validation.data.countryId,
            cityId: geoFilter.cityId, // Will filter to specific city for city admins
        };

        const { data, total } = await CityService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const geoFilter = c.get('geoFilter');

        // City admins can only view their assigned city
        if (geoFilter.cityId && id !== geoFilter.cityId) {
            return ApiResponse.forbidden(c, 'Access denied to this city');
        }

        const city = await CityService.getById(id);

        if (!city) {
            return ApiResponse.notFound(c, 'City not found');
        }

        // Additional check: ensure city belongs to admin's country (for country admins)
        if (geoFilter.countryId && city.countryId !== geoFilter.countryId) {
            return ApiResponse.forbidden(c, 'Access denied to this city');
        }

        return ApiResponse.success(c, {
            message: 'City retrieved',
            data: city,
        });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createCitySchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        // Verify country exists
        const country = await CountryService.getById(validation.data.countryId);
        if (!country) {
            return ApiResponse.badRequest(c, 'Country not found');
        }

        const city = await CityService.create(validation.data);

        return ApiResponse.created(c, city, 'City created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const geoFilter = c.get('geoFilter');

        // City admins can only update their assigned city
        if (geoFilter.cityId && id !== geoFilter.cityId) {
            return ApiResponse.forbidden(c, 'Access denied to this city');
        }

        const body = await c.req.json();
        const validation = updateCitySchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const existing = await CityService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'City not found');
        }

        // Additional check: ensure city belongs to admin's country (for country admins)
        if (geoFilter.countryId && existing.countryId !== geoFilter.countryId) {
            return ApiResponse.forbidden(c, 'Access denied to this city');
        }

        const city = await CityService.update(id, validation.data);

        return ApiResponse.success(c, {
            message: 'City updated successfully',
            data: city,
        });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await CityService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'City not found');
        }

        await CityService.delete(id);

        return ApiResponse.success(c, {
            message: 'City deleted successfully',
        });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');
        const geoFilter = c.get('geoFilter');

        // City admins can only toggle status of their assigned city
        if (geoFilter.cityId && id !== geoFilter.cityId) {
            return ApiResponse.forbidden(c, 'Access denied to this city');
        }

        const existing = await CityService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'City not found');
        }

        // Additional check: ensure city belongs to admin's country (for country admins)
        if (geoFilter.countryId && existing.countryId !== geoFilter.countryId) {
            return ApiResponse.forbidden(c, 'Access denied to this city');
        }

        const city = await CityService.update(id, {
            isActive: !existing.isActive,
        });

        return ApiResponse.success(c, {
            message: `City ${city?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: city,
        });
    }
}
