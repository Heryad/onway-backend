import type { Context } from 'hono';
import { z } from 'zod';
import { StoreItemAddonService } from '../../services/admin/store-item-addon.service';
import { StoreItemService } from '../../services/admin/store-item.service';
import { ApiResponse } from '../../lib';

// Option schema
const addonOptionSchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    price: z.number().min(0),
    isDefault: z.boolean().optional(),
});

// Create addon schema
const createAddonSchema = z.object({
    name: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one language required'),
    options: z.array(addonOptionSchema).min(1),
    isRequired: z.boolean().optional(),
    minSelections: z.number().int().min(0).optional(),
    maxSelections: z.number().int().min(1).optional(),
    sorting: z.number().int().optional(),
});

// Update addon schema
const updateAddonSchema = z.object({
    name: z.record(z.string(), z.string()).optional(),
    options: z.array(addonOptionSchema).min(1).optional(),
    isRequired: z.boolean().optional(),
    minSelections: z.number().int().min(0).optional(),
    maxSelections: z.number().int().min(1).optional(),
    sorting: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

// List addons schema
const listAddonsSchema = z.object({
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

// Reorder schema
const reorderSchema = z.object({
    addonIds: z.array(z.string().uuid()).min(1),
});

// Duplicate schema
const duplicateSchema = z.object({
    targetItemId: z.string().uuid(),
});

export class StoreItemAddonController {
    static async list(c: Context) {
        const storeItemId = c.req.param('itemId');
        const query = c.req.query();
        const validation = listAddonsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const item = await StoreItemService.getById(storeItemId);
        if (!item) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        const { data, total } = await StoreItemAddonService.list({
            storeItemId,
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
        const addon = await StoreItemAddonService.getById(id);

        if (!addon) {
            return ApiResponse.notFound(c, 'Store item addon not found');
        }

        return ApiResponse.success(c, { message: 'Addon retrieved', data: addon });
    }

    static async create(c: Context) {
        const itemIds = c.req.param('itemId'); // Note: 'itemId' param from route
        const body = await c.req.json();
        const validation = createAddonSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const item = await StoreItemService.getById(itemIds);
        if (!item) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        const addon = await StoreItemAddonService.create({
            storeId: item.storeId,
            storeItemId: item.id,
            ...validation.data,
        });

        return ApiResponse.created(c, addon, 'Store item addon created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateAddonSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreItemAddonService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store item addon not found');
        }

        const addon = await StoreItemAddonService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Store item addon updated', data: addon });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await StoreItemAddonService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Store item addon not found');
        }

        await StoreItemAddonService.delete(id);
        return ApiResponse.success(c, { message: 'Store item addon deleted' });
    }

    static async reorder(c: Context) {
        const itemId = c.req.param('itemId');
        const body = await c.req.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const item = await StoreItemService.getById(itemId);
        if (!item) {
            return ApiResponse.notFound(c, 'Store item not found');
        }

        await StoreItemAddonService.reorder(itemId, validation.data.addonIds);
        return ApiResponse.success(c, { message: 'Store item addons reordered' });
    }

    static async duplicate(c: Context) {
        const itemId = c.req.param('itemId');
        const body = await c.req.json();
        const validation = duplicateSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Verify source item
        const sourceItem = await StoreItemService.getById(itemId);
        if (!sourceItem) {
            return ApiResponse.notFound(c, 'Source item not found');
        }

        // Verify target item
        const targetItem = await StoreItemService.getById(validation.data.targetItemId);
        if (!targetItem) {
            return ApiResponse.notFound(c, 'Target item not found');
        }

        // Ensure same store (optional constraint, but safer for now)
        if (sourceItem.storeId !== targetItem.storeId) {
            return ApiResponse.badRequest(c, 'Items must belong to the same store');
        }

        const newAddons = await StoreItemAddonService.duplicateAddonsToItem(sourceItem.id, targetItem.id, targetItem.storeId);

        return ApiResponse.success(c, {
            message: `Duplicated ${newAddons.length} addons to target item`,
            data: newAddons
        });
    }
}
