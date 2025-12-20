import { pgTable, uuid, jsonb, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Countries Table
 * Stores country information with multi-language support
 */
export const countries = pgTable("countries", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language name: { en: "UAE", ar: "الإمارات" }
    name: jsonb("name").notNull().$type<Record<string, string>>(),

    phoneCode: varchar("phone_code", { length: 10 }).notNull(),
    currency: varchar("currency", { length: 50 }).notNull(),
    currencyCode: varchar("currency_code", { length: 10 }).notNull(),
    currencySymbol: varchar("currency_symbol", { length: 10 }).notNull(),
    avatar: varchar("avatar", { length: 500 }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("countries_is_active_idx").on(table.isActive),
]);

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
