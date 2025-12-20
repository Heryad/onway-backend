import { pgTable, uuid, jsonb, varchar, boolean, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";

/**
 * Cities Table
 * Stores city information with delivery fees, taxes, and geo boundaries
 */
export const cities = pgTable("cities", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language name: { en: "Dubai", ar: "دبي" }
    name: jsonb("name").notNull().$type<Record<string, string>>(),

    // Delivery fees
    baseDeliveryFee: decimal("base_delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    primeDeliveryFee: decimal("prime_delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }),

    // Fees
    serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"), // Percentage

    // Geo boundary polygon for city limits: [[lat, lng], [lat, lng], ...]
    geoBounds: jsonb("geo_bounds").$type<[number, number][]>(),

    timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),

    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "restrict" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("cities_country_id_idx").on(table.countryId),
    index("cities_is_active_idx").on(table.isActive),
    index("cities_country_active_idx").on(table.countryId, table.isActive),
]);

// Relations
export const citiesRelations = relations(cities, ({ one }) => ({
    country: one(countries, {
        fields: [cities.countryId],
        references: [countries.id],
    }),
}));

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
