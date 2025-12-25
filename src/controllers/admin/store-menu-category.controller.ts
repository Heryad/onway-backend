import type { Context } from 'hono';
import { z } from 'zod';
import { StoreMenuCategoryService } from '../../services/admin/store-menu-category.service';
import { StoreService } from '../../services/admin/store.service';
import { ApiResponse } from '../../lib';

const createCategorySchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().optional(),
    sorting: z.number().int().optional(),
});

const updateCategorySchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    avatar: z.string().url().nullable().optional(),
    sorting: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

const listCategoriesSchema = z.object({
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

const reorderSchema = z.object({
    categoryIds: z.array(z.string().uuid()).min(1),
});

export class StoreMenuCategoryController {
    static async list(c: Context) {
        const storeId = c.req.param('storeId');
        const query = c.req.query();
        const validation = listCategoriesSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const { data, total } = await StoreMenuCategoryService.list({
            storeId,
            ...validation.data,
        });

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const category = await StoreMenuCategoryService.getById(id);

        if (!category) {
            return ApiResponse.notFound(c, 'Menu category not found');
        }

        return ApiResponse.success(c, { message: 'Menu category retrieved', data: category });
    }

    static async create(c: Context) {
        const storeId = c.req.param('storeId');
        const body = await c.req.json();
        const validation = createCategorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const category = await StoreMenuCategoryService.create({
            storeId,
            ...validation.data,
        });

        return ApiResponse.created(c, category, 'Menu category created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateCategorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreMenuCategoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Menu category not found');
        }

        const category = await StoreMenuCategoryService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Menu category updated', data: category });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreMenuCategoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Menu category not found');
        }

        await StoreMenuCategoryService.delete(id);
        return ApiResponse.success(c, { message: 'Menu category deleted' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreMenuCategoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Menu category not found');
        }

        const category = await StoreMenuCategoryService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Menu category ${category?.isActive ? 'activated' : 'deactivated'}`,
            data: category,
        });
    }

    static async reorder(c: Context) {
        const storeId = c.req.param('storeId');
        const body = await c.req.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        await StoreMenuCategoryService.reorder(storeId, validation.data.categoryIds);
        return ApiResponse.success(c, { message: 'Menu categories reordered' });
    }
}
