import type { Context } from 'hono';
import { z } from 'zod';
import { CityZoneService } from '../../services/admin/city-zone.service';
import { CityService } from '../../services/admin/city.service';
import { ApiResponse } from '../../lib';

const createCityZoneSchema = z.object({
    name: z.string().min(1).max(255),
    cityId: z.string().uuid(),
    extraDeliveryFee: z.string().optional(),
    geoPolygon: z.array(z.tuple([z.number(), z.number()])).min(3, 'Polygon requires at least 3 points'),
});

const updateCityZoneSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    extraDeliveryFee: z.string().optional(),
    geoPolygon: z.array(z.tuple([z.number(), z.number()])).min(3).optional(),
    isActive: z.boolean().optional(),
});

const listCityZonesSchema = z.object({
    cityId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class CityZoneController {
    static async list(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');
        const validation = listCityZonesSchema.safeParse(query);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const filters = {
            ...validation.data,
            cityId: geoFilter.cityId ?? validation.data.cityId,
        };

        const { data, total } = await CityZoneService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const zone = await CityZoneService.getById(id);

        if (!zone) {
            return ApiResponse.notFound(c, 'City zone not found');
        }

        return ApiResponse.success(c, {
            message: 'City zone retrieved',
            data: zone,
        });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createCityZoneSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        // Verify city exists
        const city = await CityService.getById(validation.data.cityId);
        if (!city) {
            return ApiResponse.badRequest(c, 'City not found');
        }

        const zone = await CityZoneService.create(validation.data);

        return ApiResponse.created(c, zone, 'City zone created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateCityZoneSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const existing = await CityZoneService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'City zone not found');
        }

        const zone = await CityZoneService.update(id, validation.data);

        return ApiResponse.success(c, {
            message: 'City zone updated successfully',
            data: zone,
        });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await CityZoneService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'City zone not found');
        }

        await CityZoneService.delete(id);

        return ApiResponse.success(c, {
            message: 'City zone deleted successfully',
        });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await CityZoneService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'City zone not found');
        }

        const zone = await CityZoneService.update(id, {
            isActive: !existing.isActive,
        });

        return ApiResponse.success(c, {
            message: `City zone ${zone?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: zone,
        });
    }
}
