import { pgTable, uuid, varchar, boolean, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Splash Screen Types
 */
export const splashScreenTypes = ["default", "image", "video"] as const;
export type SplashScreenType = (typeof splashScreenTypes)[number];

/**
 * Theme Configuration Type
 */
export type ThemeConfig = {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    darkMode?: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
    };
};

/**
 * Social Media Links Type
 */
export type SocialMediaLinks = {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
};

/**
 * Support Contact Type
 */
export type SupportContact = {
    email?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
};

/**
 * Settings Table
 * Application settings per city/country
 */
export const settings = pgTable("settings", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Settings scope (null = global, set = specific)
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    // Available languages: ["en", "ar", "fr"]
    availableLanguages: jsonb("available_languages").$type<string[]>().default(["en"]),
    defaultLanguage: varchar("default_language", { length: 10 }).default("en"),

    // Coin rewards
    coinRewardsEnabled: boolean("coin_rewards_enabled").default(true),
    coinsPerOrder: integer("coins_per_order").default(10),
    coinsPerReferral: integer("coins_per_referral").default(50),
    coinsToCurrencyRate: integer("coins_to_currency_rate").default(100), // 100 coins = 1 currency unit

    // Social media links
    socialMedia: jsonb("social_media").$type<SocialMediaLinks>(),

    // Support contacts
    supportContacts: jsonb("support_contacts").$type<SupportContact>(),

    // Theme customization
    theme: jsonb("theme").$type<ThemeConfig>(),

    // Splash screen
    splashScreenType: varchar("splash_screen_type", { length: 20 }).$type<SplashScreenType>().default("default"),
    splashMediaUrl: varchar("splash_media_url", { length: 500 }),
    splashDurationMs: integer("splash_duration_ms").default(2000),

    // App version requirements
    minAppVersion: varchar("min_app_version", { length: 20 }),
    latestAppVersion: varchar("latest_app_version", { length: 20 }),
    forceUpdate: boolean("force_update").default(false),

    // Maintenance mode
    maintenanceMode: boolean("maintenance_mode").default(false),
    maintenanceMessage: varchar("maintenance_message", { length: 500 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("settings_city_idx").on(table.cityId),
    index("settings_country_idx").on(table.countryId),
]);

// Relations
export const settingsRelations = relations(settings, ({ one }) => ({
    city: one(cities, {
        fields: [settings.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [settings.countryId],
        references: [countries.id],
    }),
}));

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
