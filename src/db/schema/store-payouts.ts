import { pgTable, uuid, varchar, timestamp, decimal, integer, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";

/**
 * Payout Status
 */
export const payoutStatuses = ["pending", "processing", "paid", "failed"] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];

/**
 * Store Payouts Table
 * Pre-calculated store earnings for payout periods
 */
export const storePayouts = pgTable("store_payouts", {
    id: uuid("id").primaryKey().defaultRandom(),

    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "restrict" }),

    // Period
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),

    // Order stats
    totalOrders: integer("total_orders").notNull().default(0),
    completedOrders: integer("completed_orders").notNull().default(0),
    cancelledOrders: integer("cancelled_orders").notNull().default(0),

    // Financials
    grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull(),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
    commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).notNull(),
    adjustments: decimal("adjustments", { precision: 12, scale: 2 }).default("0"), // Refunds, bonuses, etc.
    netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),

    // Payment status
    status: varchar("status", { length: 20 }).notNull().$type<PayoutStatus>().default("pending"),

    // Bank transfer details
    transactionReference: varchar("transaction_reference", { length: 255 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: varchar("failure_reason", { length: 500 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_payouts_store_idx").on(table.storeId),
    index("store_payouts_period_idx").on(table.periodStart, table.periodEnd),
    index("store_payouts_status_idx").on(table.status),
    index("store_payouts_store_period_idx").on(table.storeId, table.periodStart),
]);

// Relations
export const storePayoutsRelations = relations(storePayouts, ({ one }) => ({
    store: one(stores, {
        fields: [storePayouts.storeId],
        references: [stores.id],
    }),
}));

export type StorePayout = typeof storePayouts.$inferSelect;
export type NewStorePayout = typeof storePayouts.$inferInsert;
