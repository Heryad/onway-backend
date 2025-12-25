import type { Context } from 'hono';
import { z } from 'zod';
import { StoreCategoryAssignmentService } from '../../services/admin/store-category-assignment.service';
import { StoreService } from '../../services/admin/store.service';
import { CategoryService } from '../../services/admin/category.service';
import { ApiResponse } from '../../lib';

const assignCategorySchema = z.object({
    categoryId: z.string().uuid(),
    sorting: z.number().int().optional(),
    isSponsored: z.boolean().optional(),
});

const updateAssignmentSchema = z.object({
    sorting: z.number().int().optional(),
    isSponsored: z.boolean().optional(),
});

const bulkAssignSchema = z.object({
    categoryIds: z.array(z.string().uuid()).min(1),
});

const listAssignmentsSchema = z.object({
    storeId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    isSponsored: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

export class StoreCategoryAssignmentController {
    // List all assignments (for admin view)
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listAssignmentsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const { data, total } = await StoreCategoryAssignmentService.list(validation.data);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    // Get categories for a store
    static async getStoreCategories(c: Context) {
        const storeId = c.req.param('storeId');

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const assignments = await StoreCategoryAssignmentService.getCategoriesForStore(storeId);

        return ApiResponse.success(c, {
            message: 'Store categories retrieved',
            data: assignments,
        });
    }

    // Assign category to store
    static async assignCategory(c: Context) {
        const storeId = c.req.param('storeId');
        const body = await c.req.json();
        const validation = assignCategorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        // Verify store exists
        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        // Verify category exists
        const category = await CategoryService.getById(validation.data.categoryId);
        if (!category) {
            return ApiResponse.notFound(c, 'Category not found');
        }

        // Check if already assigned
        const exists = await StoreCategoryAssignmentService.exists(storeId, validation.data.categoryId);
        if (exists) {
            return ApiResponse.conflict(c, 'Store already assigned to this category');
        }

        const assignment = await StoreCategoryAssignmentService.assign({
            storeId,
            ...validation.data,
        });

        return ApiResponse.created(c, assignment, 'Category assigned to store');
    }

    // Update assignment
    static async updateAssignment(c: Context) {
        const assignmentId = c.req.param('assignmentId');
        const body = await c.req.json();
        const validation = updateAssignmentSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoreCategoryAssignmentService.getById(assignmentId);
        if (!existing) {
            return ApiResponse.notFound(c, 'Assignment not found');
        }

        const assignment = await StoreCategoryAssignmentService.update(assignmentId, validation.data);

        return ApiResponse.success(c, {
            message: 'Assignment updated',
            data: assignment,
        });
    }

    // Remove assignment
    static async removeAssignment(c: Context) {
        const storeId = c.req.param('storeId');
        const categoryId = c.req.param('categoryId');

        const removed = await StoreCategoryAssignmentService.removeByStoreAndCategory(storeId, categoryId);
        if (!removed) {
            return ApiResponse.notFound(c, 'Assignment not found');
        }

        return ApiResponse.success(c, { message: 'Category removed from store' });
    }

    // Bulk assign categories
    static async bulkAssign(c: Context) {
        const storeId = c.req.param('storeId');
        const body = await c.req.json();
        const validation = bulkAssignSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const assignments = await StoreCategoryAssignmentService.bulkAssign(storeId, validation.data.categoryIds);

        return ApiResponse.success(c, {
            message: 'Categories assigned to store',
            data: assignments,
        });
    }

    // Replace all categories for a store
    static async replaceCategories(c: Context) {
        const storeId = c.req.param('storeId');
        const body = await c.req.json();
        const validation = bulkAssignSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        const assignments = await StoreCategoryAssignmentService.replaceCategories(storeId, validation.data.categoryIds);

        return ApiResponse.success(c, {
            message: 'Store categories replaced',
            data: assignments,
        });
    }

    // Get stores in a category
    static async getStoresInCategory(c: Context) {
        const categoryId = c.req.param('categoryId');

        const category = await CategoryService.getById(categoryId);
        if (!category) {
            return ApiResponse.notFound(c, 'Category not found');
        }

        const assignments = await StoreCategoryAssignmentService.getStoresInCategory(categoryId);

        return ApiResponse.success(c, {
            message: 'Stores in category retrieved',
            data: assignments,
        });
    }
}
