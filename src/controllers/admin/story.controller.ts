import type { Context } from 'hono';
import { z } from 'zod';
import { StoryService } from '../../services/admin/story.service';
import { ApiResponse } from '../../lib';
import { storyMediaTypes } from '../../db/schema/stories';

const createStorySchema = z.object({
    type: z.enum(storyMediaTypes),
    mediaUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    caption: z.string().max(500).optional(),
    productId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    expiresAt: z.string().optional(),
});

const updateStorySchema = z.object({
    caption: z.string().max(500).optional(),
    productId: z.string().uuid().nullable().optional(),
    expiresAt: z.string().optional(),
});

const listStoriesSchema = z.object({
    storeId: z.string().uuid().optional(),
    adminId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    expired: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    type: z.enum(storyMediaTypes).optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

export class StoryController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listStoriesSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await StoryService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const story = await StoryService.getById(id);

        if (!story) {
            return ApiResponse.notFound(c, 'Story not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && story.cityId && story.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && story.countryId && story.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Story retrieved', data: story });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createStorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const admin = c.get('admin');
        const story = await StoryService.create(validation.data, admin.adminId);

        return ApiResponse.created(c, story, 'Story created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateStorySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Story not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const story = await StoryService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Story updated', data: story });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await StoryService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Story not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        await StoryService.delete(id);
        return ApiResponse.success(c, { message: 'Story deleted' });
    }
}
