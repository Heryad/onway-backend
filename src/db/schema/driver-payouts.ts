import { pgTable, uuid, varchar, timestamp, decimal, integer, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { drivers } from "./drivers";

/**
 * Driver Payout Status
 */
export const driverPayoutStatuses = ["pending", "processing", "paid", "failed"] as const;
export type DriverPayoutStatus = (typeof driverPayoutStatuses)[number];

/**
 * Driver Payouts Table
 * Pre-calculated driver earnings for payout periods
 */
export const driverPayouts = pgTable("driver_payouts", {
    id: uuid("id").primaryKey().defaultRandom(),

    driverId: uuid("driver_id").notNull().references(() => drivers.id, { onDelete: "restrict" }),

    // Period
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),

    // Delivery stats
    totalDeliveries: integer("total_deliveries").notNull().default(0),
    completedDeliveries: integer("completed_deliveries").notNull().default(0),
    cancelledDeliveries: integer("cancelled_deliveries").notNull().default(0),

    // Distance
    totalDistanceKm: decimal("total_distance_km", { precision: 10, scale: 2 }),

    // Financials
    baseFees: decimal("base_fees", { precision: 12, scale: 2 }).notNull(),
    distanceBonuses: decimal("distance_bonuses", { precision: 12, scale: 2 }).default("0"),
    tips: decimal("tips", { precision: 12, scale: 2 }).default("0"),
    incentives: decimal("incentives", { precision: 12, scale: 2 }).default("0"), // Peak hour bonuses, etc.
    deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"), // Penalties, etc.
    netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),

    // Payment status
    status: varchar("status", { length: 20 }).notNull().$type<DriverPayoutStatus>().default("pending"),

    // Bank transfer details
    transactionReference: varchar("transaction_reference", { length: 255 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: varchar("failure_reason", { length: 500 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("driver_payouts_driver_idx").on(table.driverId),
    index("driver_payouts_period_idx").on(table.periodStart, table.periodEnd),
    index("driver_payouts_status_idx").on(table.status),
    index("driver_payouts_driver_period_idx").on(table.driverId, table.periodStart),
]);

// Relations
export const driverPayoutsRelations = relations(driverPayouts, ({ one }) => ({
    driver: one(drivers, {
        fields: [driverPayouts.driverId],
        references: [drivers.id],
    }),
}));

export type DriverPayout = typeof driverPayouts.$inferSelect;
export type NewDriverPayout = typeof driverPayouts.$inferInsert;
