import { pgTable, uuid, varchar, timestamp, decimal, text, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { users } from "./users";
import { paymentOptions } from "./payment-options";
import { admins } from "./admins";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Payment Transaction Status
 */
export const paymentTransactionStatuses = [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled",
    "refunded",
    "partially_refunded",
] as const;
export type PaymentTransactionStatus = (typeof paymentTransactionStatuses)[number];

/**
 * Payments Table
 * Tracks payment transactions for orders - city_id/country_id needed for financial reporting
 */
export const payments = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    paymentOptionId: uuid("payment_option_id").references(() => paymentOptions.id, { onDelete: "set null" }),

    // Transaction details
    status: varchar("status", { length: 30 }).notNull().$type<PaymentTransactionStatus>().default("pending"),

    // Amounts
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
    refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default("0"),
    processingFee: decimal("processing_fee", { precision: 10, scale: 2 }).default("0"),

    // Gateway response
    transactionId: varchar("transaction_id", { length: 255 }), // External gateway transaction ID
    gatewayResponse: jsonb("gateway_response").$type<Record<string, unknown>>(),
    gatewayError: text("gateway_error"),

    // Refund tracking
    refundTransactionId: varchar("refund_transaction_id", { length: 255 }),
    refundReason: text("refund_reason"),
    refundedBy: uuid("refunded_by").references(() => admins.id, { onDelete: "set null" }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),

    // Location - needed for financial reporting per region
    cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "restrict" }),
    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "restrict" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("payments_order_id_idx").on(table.orderId),
    index("payments_user_id_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
    index("payments_transaction_id_idx").on(table.transactionId),
    index("payments_country_id_idx").on(table.countryId),
    index("payments_created_at_idx").on(table.createdAt),
]);

// Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
    user: one(users, {
        fields: [payments.userId],
        references: [users.id],
    }),
    paymentOption: one(paymentOptions, {
        fields: [payments.paymentOptionId],
        references: [paymentOptions.id],
    }),
    refundedByAdmin: one(admins, {
        fields: [payments.refundedBy],
        references: [admins.id],
    }),
    city: one(cities, {
        fields: [payments.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [payments.countryId],
        references: [countries.id],
    }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
