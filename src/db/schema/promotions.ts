import { pgTable, uuid, varchar, boolean, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Promotion Discount Types
 */
export const promotionDiscountTypes = ["percent", "fixed", "free_delivery"] as const;
export type PromotionDiscountType = (typeof promotionDiscountTypes)[number];

/**
 * Promotions Table
 * Special promotions/campaigns that apply to multiple stores
 */
export const promotions = pgTable("promotions", {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }),
    thumbnail: varchar("thumbnail", { length: 500 }),

    // Discount settings
    discountType: varchar("discount_type", { length: 20 }).notNull().$type<PromotionDiscountType>(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
    maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),

    // Display options
    hasMainView: boolean("has_main_view").default(false).notNull(), // Show in main promotion section
    sorting: integer("sorting").default(0).notNull(),

    // Validity
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("promotions_city_id_idx").on(table.cityId),
    index("promotions_active_idx").on(table.isActive),
    index("promotions_dates_idx").on(table.startsAt, table.expiresAt),
    index("promotions_main_view_idx").on(table.hasMainView, table.isActive),
]);

// Relations
export const promotionsRelations = relations(promotions, ({ one }) => ({
    city: one(cities, {
        fields: [promotions.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [promotions.countryId],
        references: [countries.id],
    }),
}));

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
