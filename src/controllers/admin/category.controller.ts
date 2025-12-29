import type { Context } from 'hono';
import { z } from 'zod';
import { CategoryService } from '../../services/admin/category.service';
import { ApiResponse } from '../../lib';

const createCategorySchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().optional(),
    sorting: z.number().int().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
});

const updateCategorySchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().nullable().optional(),
    sorting: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

const listCategoriesSchema = z.object({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class CategoryController {
    static async list(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');
        const validation = listCategoriesSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const filters = {
            ...validation.data,
            countryId: geoFilter.countryId ?? validation.data.countryId,
            cityId: geoFilter.cityId ?? validation.data.cityId,
        };

        const { data, total } = await CategoryService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const category = await CategoryService.getById(id);

        if (!category) {
            return ApiResponse.notFound(c, 'Category not found');
        }

        return ApiResponse.success(c, { message: 'Category retrieved', data: category });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createCategorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const category = await CategoryService.create(validation.data);
        return ApiResponse.created(c, category, 'Category created successfully');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateCategorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await CategoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Category not found');
        }

        const category = await CategoryService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Category updated successfully', data: category });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await CategoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Category not found');
        }

        await CategoryService.delete(id);
        return ApiResponse.success(c, { message: 'Category deleted successfully' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await CategoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Category not found');
        }

        const category = await CategoryService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Category ${category?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: category,
        });
    }
}
