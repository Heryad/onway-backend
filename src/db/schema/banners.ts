import { pgTable, uuid, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Banner Types Enum
 */
export const bannerTypes = ["view", "clickable", "url"] as const;
export type BannerType = (typeof bannerTypes)[number];

/**
 * Banners Table
 * Marketing banners for homepage carousels
 */
export const banners = pgTable("banners", {
    id: uuid("id").primaryKey().defaultRandom(),

    thumbnail: varchar("thumbnail", { length: 500 }).notNull(),

    sorting: integer("sorting").default(0).notNull(),

    // Click behavior
    type: varchar("type", { length: 20 }).notNull().$type<BannerType>().default("view"),
    clickUrl: varchar("click_url", { length: 500 }), // For "url" type
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }), // For "clickable" type

    // Analytics
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),

    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("banners_city_id_idx").on(table.cityId),
    index("banners_sorting_idx").on(table.sorting),
    index("banners_active_idx").on(table.isActive),
    index("banners_dates_idx").on(table.startsAt, table.expiresAt),
]);

// Relations
export const bannersRelations = relations(banners, ({ one }) => ({
    store: one(stores, {
        fields: [banners.storeId],
        references: [stores.id],
    }),
    city: one(cities, {
        fields: [banners.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [banners.countryId],
        references: [countries.id],
    }),
}));

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
