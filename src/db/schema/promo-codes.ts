import { pgTable, uuid, varchar, boolean, timestamp, decimal, integer, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Promo Code Discount Types
 */
export const promoDiscountTypes = ["percent", "fixed", "free_delivery"] as const;
export type PromoDiscountType = (typeof promoDiscountTypes)[number];

/**
 * Promo Codes Table
 * Discount codes users can apply to orders
 */
export const promoCodes = pgTable("promo_codes", {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    code: varchar("code", { length: 50 }).notNull().unique(),

    // Discount configuration
    discountType: varchar("discount_type", { length: 20 }).notNull().$type<PromoDiscountType>(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
    maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }), // Cap for percentage discounts

    // Usage limits
    maxUses: integer("max_uses"), // Total uses allowed (null = unlimited)
    maxUsesPerUser: integer("max_uses_per_user").default(1), // Per user limit
    currentUses: integer("current_uses").default(0),

    // Order requirements
    minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),

    // Restrictions
    firstOrderOnly: boolean("first_order_only").default(false).notNull(),
    newUsersOnly: boolean("new_users_only").default(false).notNull(), // Users registered in last X days

    // Validity period
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("promo_codes_code_idx").on(table.code),
    index("promo_codes_city_id_idx").on(table.cityId),
    index("promo_codes_active_idx").on(table.isActive),
    index("promo_codes_dates_idx").on(table.startsAt, table.expiresAt),
]);

// Relations
export const promoCodesRelations = relations(promoCodes, ({ one }) => ({
    city: one(cities, {
        fields: [promoCodes.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [promoCodes.countryId],
        references: [countries.id],
    }),
}));

export type PromoCode = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;
