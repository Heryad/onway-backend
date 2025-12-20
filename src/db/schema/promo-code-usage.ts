import { pgTable, uuid, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { promoCodes } from "./promo-codes";
import { users } from "./users";
import { orders } from "./orders";

/**
 * Promo Code Usage Table
 * Tracks each use of a promo code
 */
export const promoCodeUsage = pgTable("promo_code_usage", {
    id: uuid("id").primaryKey().defaultRandom(),

    promoCodeId: uuid("promo_code_id").notNull().references(() => promoCodes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),

    // Actual discount applied
    discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("promo_usage_promo_id_idx").on(table.promoCodeId),
    index("promo_usage_user_id_idx").on(table.userId),
    index("promo_usage_order_id_idx").on(table.orderId),
    index("promo_usage_user_promo_idx").on(table.userId, table.promoCodeId), // For checking per-user usage
]);

// Relations
export const promoCodeUsageRelations = relations(promoCodeUsage, ({ one }) => ({
    promoCode: one(promoCodes, {
        fields: [promoCodeUsage.promoCodeId],
        references: [promoCodes.id],
    }),
    user: one(users, {
        fields: [promoCodeUsage.userId],
        references: [users.id],
    }),
    order: one(orders, {
        fields: [promoCodeUsage.orderId],
        references: [orders.id],
    }),
}));

export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;
export type NewPromoCodeUsage = typeof promoCodeUsage.$inferInsert;
