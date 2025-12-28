import { eq, and, isNull, or, inArray, SQL, asc } from 'drizzle-orm';
import { db, settings, cities } from '../../db';
import type { Settings, NewSettings, SplashScreenType, ThemeConfig, SocialMediaLinks, SupportContact } from '../../db/schema/settings';

export interface UpdateSettingsInput {
    availableLanguages?: string[];
    defaultLanguage?: string;
    coinRewardsEnabled?: boolean;
    coinsPerOrder?: number;
    coinsPerReferral?: number;
    coinsToCurrencyRate?: number;
    socialMedia?: SocialMediaLinks;
    supportContacts?: SupportContact;
    theme?: ThemeConfig;
    splashScreenType?: SplashScreenType;
    splashMediaUrl?: string;
    splashDurationMs?: number;
    minAppVersion?: string;
    latestAppVersion?: string;
    forceUpdate?: boolean;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
}

export interface CreateSettingsInput extends UpdateSettingsInput {
    cityId?: string;
    countryId?: string;
}

export interface ListSettingsFilters {
    countryId?: string;
    cityId?: string;
}

export class SettingsService {
    // Get settings for a scope (city > country > global fallback)
    static async getForScope(cityId?: string, countryId?: string): Promise<Settings | null> {
        // Try city-specific first
        if (cityId) {
            const citySettings = await db.query.settings.findFirst({
                where: eq(settings.cityId, cityId),
                with: { city: true, country: true },
            });
            if (citySettings) return citySettings;
        }

        // Try country-specific
        if (countryId) {
            const countrySettings = await db.query.settings.findFirst({
                where: and(eq(settings.countryId, countryId), isNull(settings.cityId)),
                with: { city: true, country: true },
            });
            if (countrySettings) return countrySettings;
        }

        // Fall back to global
        return this.getGlobal();
    }

    static async getGlobal(): Promise<Settings | null> {
        const globalSettings = await db.query.settings.findFirst({
            where: and(isNull(settings.cityId), isNull(settings.countryId)),
        });
        return globalSettings ?? null;
    }

    static async getById(id: string): Promise<Settings | null> {
        const setting = await db.query.settings.findFirst({
            where: eq(settings.id, id),
            with: { city: true, country: true },
        });
        return setting ?? null;
    }

    static async create(input: CreateSettingsInput): Promise<Settings> {
        const [setting] = await db.insert(settings).values({
            cityId: input.cityId,
            countryId: input.countryId,
            availableLanguages: input.availableLanguages ?? ['en'],
            defaultLanguage: input.defaultLanguage ?? 'en',
            coinRewardsEnabled: input.coinRewardsEnabled ?? true,
            coinsPerOrder: input.coinsPerOrder ?? 10,
            coinsPerReferral: input.coinsPerReferral ?? 50,
            coinsToCurrencyRate: input.coinsToCurrencyRate ?? 100,
            socialMedia: input.socialMedia,
            supportContacts: input.supportContacts,
            theme: input.theme,
            splashScreenType: input.splashScreenType ?? 'default',
            splashMediaUrl: input.splashMediaUrl,
            splashDurationMs: input.splashDurationMs ?? 2000,
            minAppVersion: input.minAppVersion,
            latestAppVersion: input.latestAppVersion,
            forceUpdate: input.forceUpdate ?? false,
            maintenanceMode: input.maintenanceMode ?? false,
            maintenanceMessage: input.maintenanceMessage,
        }).returning();

        return setting;
    }

    static async update(id: string, input: UpdateSettingsInput): Promise<Settings | null> {
        const updateData: Partial<NewSettings> = { updatedAt: new Date() };

        if (input.availableLanguages !== undefined) updateData.availableLanguages = input.availableLanguages;
        if (input.defaultLanguage !== undefined) updateData.defaultLanguage = input.defaultLanguage;
        if (input.coinRewardsEnabled !== undefined) updateData.coinRewardsEnabled = input.coinRewardsEnabled;
        if (input.coinsPerOrder !== undefined) updateData.coinsPerOrder = input.coinsPerOrder;
        if (input.coinsPerReferral !== undefined) updateData.coinsPerReferral = input.coinsPerReferral;
        if (input.coinsToCurrencyRate !== undefined) updateData.coinsToCurrencyRate = input.coinsToCurrencyRate;
        if (input.socialMedia !== undefined) updateData.socialMedia = input.socialMedia;
        if (input.supportContacts !== undefined) updateData.supportContacts = input.supportContacts;
        if (input.theme !== undefined) updateData.theme = input.theme;
        if (input.splashScreenType !== undefined) updateData.splashScreenType = input.splashScreenType;
        if (input.splashMediaUrl !== undefined) updateData.splashMediaUrl = input.splashMediaUrl;
        if (input.splashDurationMs !== undefined) updateData.splashDurationMs = input.splashDurationMs;
        if (input.minAppVersion !== undefined) updateData.minAppVersion = input.minAppVersion;
        if (input.latestAppVersion !== undefined) updateData.latestAppVersion = input.latestAppVersion;
        if (input.forceUpdate !== undefined) updateData.forceUpdate = input.forceUpdate;
        if (input.maintenanceMode !== undefined) updateData.maintenanceMode = input.maintenanceMode;
        if (input.maintenanceMessage !== undefined) updateData.maintenanceMessage = input.maintenanceMessage;

        const [setting] = await db.update(settings)
            .set(updateData)
            .where(eq(settings.id, id))
            .returning();

        return setting ?? null;
    }

    static async list(filters: ListSettingsFilters = {}): Promise<Settings[]> {
        const { countryId, cityId } = filters;
        const conditions: SQL[] = [];

        if (cityId) {
            // City admin: see their city settings
            conditions.push(eq(settings.cityId, cityId));
        } else if (countryId) {
            // Country admin: see their country settings AND their cities' settings
            const countryScopeCondition = or(
                eq(settings.countryId, countryId),
                inArray(
                    settings.cityId,
                    db.select({ id: cities.id }).from(cities).where(eq(cities.countryId, countryId))
                )
            );

            if (countryScopeCondition) {
                conditions.push(countryScopeCondition);
            }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const all = await db.query.settings.findMany({
            where: whereClause,
            with: { city: true, country: true },
            orderBy: [asc(settings.countryId), asc(settings.cityId)],
        });
        return all;
    }

    static async delete(id: string): Promise<boolean> {
        await db.delete(settings).where(eq(settings.id, id));
        return true;
    }
}
