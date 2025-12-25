import type { Context } from 'hono';
import { z } from 'zod';
import { SettingsService } from '../../services/admin/settings.service';
import { ApiResponse } from '../../lib';
import { splashScreenTypes } from '../../db/schema/settings';

const themeSchema = z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string(),
    darkMode: z.object({
        primaryColor: z.string(),
        secondaryColor: z.string(),
        accentColor: z.string(),
        backgroundColor: z.string(),
    }).optional(),
}).optional();

const socialMediaSchema = z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
}).optional();

const supportContactsSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    telegram: z.string().optional(),
}).optional();

const updateSettingsSchema = z.object({
    availableLanguages: z.array(z.string()).optional(),
    defaultLanguage: z.string().optional(),
    coinRewardsEnabled: z.boolean().optional(),
    coinsPerOrder: z.number().int().optional(),
    coinsPerReferral: z.number().int().optional(),
    coinsToCurrencyRate: z.number().int().optional(),
    socialMedia: socialMediaSchema,
    supportContacts: supportContactsSchema,
    theme: themeSchema,
    splashScreenType: z.enum(splashScreenTypes).optional(),
    splashMediaUrl: z.string().optional(),
    splashDurationMs: z.number().int().optional(),
    minAppVersion: z.string().optional(),
    latestAppVersion: z.string().optional(),
    forceUpdate: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
    maintenanceMessage: z.string().optional(),
});

const createSettingsSchema = updateSettingsSchema.extend({
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
});

export class SettingsController {
    // Get settings for admin's scope
    static async get(c: Context) {
        const geoFilter = c.get('geoFilter');
        const setting = await SettingsService.getForScope(geoFilter.cityId, geoFilter.countryId);

        if (!setting) {
            return ApiResponse.notFound(c, 'No settings found for this scope');
        }

        return ApiResponse.success(c, { message: 'Settings retrieved', data: setting });
    }

    // Get global settings
    static async getGlobal(c: Context) {
        const setting = await SettingsService.getGlobal();

        if (!setting) {
            return ApiResponse.notFound(c, 'Global settings not found');
        }

        return ApiResponse.success(c, { message: 'Global settings retrieved', data: setting });
    }

    // List all settings (owner only)
    static async list(c: Context) {
        const all = await SettingsService.list();
        return ApiResponse.success(c, { message: 'All settings', data: all });
    }

    // Create settings for scope
    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createSettingsSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const setting = await SettingsService.create(validation.data);
        return ApiResponse.created(c, setting, 'Settings created');
    }

    // Update settings
    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateSettingsSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SettingsService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Settings not found');
        }

        const setting = await SettingsService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Settings updated', data: setting });
    }

    // Delete settings
    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await SettingsService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Settings not found');
        }

        // Don't allow deleting global settings
        if (!existing.cityId && !existing.countryId) {
            return ApiResponse.badRequest(c, 'Cannot delete global settings');
        }

        await SettingsService.delete(id);
        return ApiResponse.success(c, { message: 'Settings deleted' });
    }
}
