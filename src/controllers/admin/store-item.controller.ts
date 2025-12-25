import type { Context } from 'hono';
import { z } from 'zod';
import { StoreItemService } from '../../services/admin/store-item.service';
import { StoreMenuCategoryService } from '../../services/admin/store-menu-category.service';
import { StoreService } from '../../services/admin/store.service';
import { ApiResponse } from '../../lib';
import { itemDiscountTypes } from '../../db/schema/store-items';

// Nutrition info schema
const nutritionInfoSchema = z.object({
    calories: z.number().int().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
});

// Create item schema
const createItemSchema = z.object({
    categoryId: z.string().uuid(),
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    description: z.record(z.string(), z.string()).optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/),
    compareAtPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    discountType: z.enum(itemDiscountTypes).optional(),
    discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    photos: z.array(z.string().url()).optional(),
    maxQuantity: z.number().int().min(1).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    outOfStock: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    nutritionInfo: nutritionInfoSchema.optional(),
    preparationTime: z.number().int().min(1).optional(),
    sorting: z.number().int().optional(),
});

// Update item schema
const updateItemSchema = z.object({
    categoryId: z.string().uuid().optional(),
    name: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    compareAtPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
    discountType: z.enum(itemDiscountTypes).nullable().optional(),
    discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
    photos: z.array(z.string().url()).optional(),
    maxQuantity: z.number().int().min(1).optional(),
    stockQuantity: z.number().int().min(0).nullable().optional(),
    outOfStock: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    nutritionInfo: nutritionInfoSchema.nullable().optional(),
    preparationTime: z.number().int().min(1).nullable().optional(),
    sorting: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

// List items schema
const listItemsSchema = z.object({
    categoryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    outOfStock: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

// Reorder schema
const reorderSchema = z.object({
    categoryId: z.string().uuid(),
    itemIds: z.array(z.string().uuid()).min(1),
});

// Bulk stock schema
const bulkStockSchema = z.object({
    itemIds: z.array(z.string().uuid()).min(1),
    outOfStock: z.boolean(),
});

export class StoreItemController {
    static async list(c: Context) {
        const storeId = c.req.param('storeId');
        const query = c.req.query();
        const validation = listItemsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const { data, total } = await StoreItemService.list({
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
        const item = await StoreItemService.getById(id);

        if (!item) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        return ApiResponse.success(c, { message: 'Items retrieved', data: item });
    }

    static async create(c: Context) {
        const storeId = c.req.param('storeId');
        const body = await c.req.json();
        const validation = createItemSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Verify store
        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        // Verify category belongs to store
        // Note: Strict check would require fetching category and checking storeId, 
        // rely on Foreign Key constraints for basic validity, but ideally check logic:
        const category = await StoreMenuCategoryService.getById(validation.data.categoryId);
        if (!category || category.storeId !== storeId) {
            return ApiResponse.badRequest(c, 'Category not found or does not belong to this store');
        }

        const item = await StoreItemService.create({
            storeId,
            ...validation.data,
        });

        return ApiResponse.created(c, item, 'Store item created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateItemSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreItemService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        // If changing category, verify it belongs to same store
        if (validation.data.categoryId) {
            const category = await StoreMenuCategoryService.getById(validation.data.categoryId);
            if (!category || category.storeId !== existing.storeId) {
                return ApiResponse.badRequest(c, 'Target category not found or belongs to different store');
            }
        }

        const item = await StoreItemService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Store item updated', data: item });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreItemService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        await StoreItemService.delete(id);
        return ApiResponse.success(c, { message: 'Store item deleted' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreItemService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        const item = await StoreItemService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Store item ${item?.isActive ? 'activated' : 'deactivated'}`,
            data: item,
        });
    }

    static async toggleStock(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreItemService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        const item = await StoreItemService.toggleStock(id);
        return ApiResponse.success(c, {
            message: `Store item marked as ${item?.outOfStock ? 'Out of Stock' : 'In Stock'}`,
            data: item,
        });
    }

    static async bulkStock(c: Context) {
        const body = await c.req.json();
        const validation = bulkStockSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const count = await StoreItemService.bulkToggleStock(validation.data.itemIds, validation.data.outOfStock);
        return ApiResponse.success(c, { message: `${count} items updated`, data: { count } });
    }

    static async reorder(c: Context) {
        const body = await c.req.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        await StoreItemService.reorder(validation.data.categoryId, validation.data.itemIds);
        return ApiResponse.success(c, { message: 'Store items reordered' });
    }
}
