import type { Context } from 'hono';
import { z } from 'zod';
import { SectionService } from '../../services/admin/section.service';
import { ApiResponse } from '../../lib';

const createSectionSchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().optional(),
    sorting: z.number().int().optional(),
    comingSoon: z.boolean().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
});

const updateSectionSchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().nullable().optional(),
    sorting: z.number().int().optional(),
    comingSoon: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

const listSectionsSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    comingSoon: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class SectionController {
    static async list(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');
        const validation = listSectionsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const filters = {
            ...validation.data,
            countryId: geoFilter.countryId ?? validation.data.countryId,
            cityId: geoFilter.cityId ?? validation.data.cityId,
        };

        const { data, total } = await SectionService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const section = await SectionService.getById(id);

        if (!section) {
            return ApiResponse.notFound(c, 'Section not found');
        }

        return ApiResponse.success(c, { message: 'Section retrieved', data: section });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createSectionSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const section = await SectionService.create(validation.data);
        return ApiResponse.created(c, section, 'Section created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateSectionSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SectionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Section not found');
        }

        const section = await SectionService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Section updated successfully', data: section });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await SectionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Section not found');
        }

        await SectionService.delete(id);
        return ApiResponse.success(c, { message: 'Section deleted successfully' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await SectionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Section not found');
        }

        const section = await SectionService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Section ${section?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: section,
        });
    }
}
