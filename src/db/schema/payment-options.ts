import { pgTable, uuid, varchar, boolean, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";

/**
 * Payment Options Table
 * Available payment methods per country (e.g., "Visa", "Mastercard", "Apple Pay")
 */
export const paymentOptions = pgTable("payment_options", {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 255 }),
    avatar: varchar("avatar", { length: 500 }),

    // Payment gateway code (e.g., "stripe", "tap", "payfort")
    gateway: varchar("gateway", { length: 50 }),

    // Processing fee (if any)
    fee: decimal("fee", { precision: 5, scale: 2 }).default("0"),
    feeType: varchar("fee_type", { length: 20 }).default("fixed"), // "fixed" or "percent"

    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    sorting: varchar("sorting", { length: 10 }).default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("payment_options_country_id_idx").on(table.countryId),
    index("payment_options_active_idx").on(table.countryId, table.isActive),
]);

// Relations
export const paymentOptionsRelations = relations(paymentOptions, ({ one }) => ({
    country: one(countries, {
        fields: [paymentOptions.countryId],
        references: [countries.id],
    }),
}));

export type PaymentOption = typeof paymentOptions.$inferSelect;
export type NewPaymentOption = typeof paymentOptions.$inferInsert;
