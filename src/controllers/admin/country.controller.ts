import type { Context } from 'hono';
import { z } from 'zod';
import { CountryService } from '../../services/admin/country.service';
import { ApiResponse } from '../../lib';

const createCountrySchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    phoneCode: z.string().min(1).max(10),
    currency: z.string().min(1).max(50),
    currencyCode: z.string().min(1).max(10),
    currencySymbol: z.string().min(1).max(10),
    avatar: z.string().url().optional(),
});

const updateCountrySchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    phoneCode: z.string().min(1).max(10).optional(),
    currency: z.string().min(1).max(50).optional(),
    currencyCode: z.string().min(1).max(10).optional(),
    currencySymbol: z.string().min(1).max(10).optional(),
    avatar: z.string().url().optional(),
    isActive: z.boolean().optional(),
});

const listCountriesSchema = z.object({
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class CountryController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listCountriesSchema.safeParse(query);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const { data, total } = await CountryService.list(validation.data);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const country = await CountryService.getById(id);

        if (!country) {
            return ApiResponse.notFound(c, 'Country not found');
        }

        return ApiResponse.success(c, {
            message: 'Country retrieved',
            data: country,
        });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createCountrySchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const country = await CountryService.create(validation.data);

        return ApiResponse.created(c, country, 'Country created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateCountrySchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const existing = await CountryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Country not found');
        }

        const country = await CountryService.update(id, validation.data);

        return ApiResponse.success(c, {
            message: 'Country updated successfully',
            data: country,
        });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await CountryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Country not found');
        }

        await CountryService.delete(id);

        return ApiResponse.success(c, {
            message: 'Country deleted successfully',
        });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await CountryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Country not found');
        }

        const country = await CountryService.update(id, {
            isActive: !existing.isActive,
        });

        return ApiResponse.success(c, {
            message: `Country ${country?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: country,
        });
    }
}
