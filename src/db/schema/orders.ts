import { pgTable, uuid, varchar, boolean, timestamp, decimal, integer, text, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { users } from "./users";
import { userAddresses } from "./user-addresses";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Order Status Enum
 */
export const orderStatuses = [
    "pending",           // Just placed
    "accepted",          // Store accepted
    "preparing",         // Store is preparing
    "ready_for_pickup",  // Ready for driver
    "driver_assigned",   // Driver assigned
    "driver_arrived",    // Driver at store
    "picked_up",         // Driver picked up
    "on_the_way",        // Driver en route
    "arrived",           // Driver at delivery location
    "delivered",         // Successfully delivered
    "cancelled",         // Order cancelled
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

/**
 * Payment Status Enum
 */
export const paymentStatuses = ["pending", "paid", "failed", "refunded", "partially_refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/**
 * Payment Methods
 */
export const paymentMethods = ["cash", "card", "wallet", "apple_pay", "google_pay"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

/**
 * Cancel Reasons Enum
 */
export const cancelReasons = [
    "user_requested",
    "store_rejected",
    "store_closed",
    "out_of_stock",
    "no_driver_available",
    "driver_cancelled",
    "payment_failed",
    "other",
] as const;
export type CancelReason = (typeof cancelReasons)[number];

/**
 * Orders Table
 * Main orders table - city_id and country_id needed for reporting
 */
export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Order number for display (e.g., "ORD-2025-001234")
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),

    // Relationships
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "restrict" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    userAddressId: uuid("user_address_id").notNull().references(() => userAddresses.id, { onDelete: "restrict" }),

    // Snapshot of delivery address at time of order
    deliveryAddress: jsonb("delivery_address").notNull().$type<{
        street: string;
        building?: string;
        floor?: string;
        apartment?: string;
        instructions?: string;
        geoLocation: { lat: number; lng: number };
    }>(),

    // Financials
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).notNull().default("0"),

    // Discounts
    hasDiscount: boolean("has_discount").default(false).notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
    promoCodeId: uuid("promo_code_id"), // Reference to applied promo code

    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    // Payment
    paymentMethod: varchar("payment_method", { length: 20 }).notNull().$type<PaymentMethod>(),
    paymentStatus: varchar("payment_status", { length: 30 }).notNull().$type<PaymentStatus>().default("pending"),

    // Notes
    storeNotes: text("store_notes"),
    deliveryNotes: text("delivery_notes"),

    // Status tracking
    status: varchar("status", { length: 30 }).notNull().$type<OrderStatus>().default("pending"),
    cancelReason: varchar("cancel_reason", { length: 30 }).$type<CancelReason>(),
    cancelledBy: varchar("cancelled_by", { length: 20 }), // "user", "store", "driver", "admin", "system"
    cancellationNotes: text("cancellation_notes"),

    // Scheduling
    isScheduled: boolean("is_scheduled").default(false).notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),

    // Rewards
    coinsAwarded: integer("coins_awarded").default(0),
    coinsUsed: integer("coins_used").default(0),

    // Location - needed for analytics (orders per country/city)
    cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "restrict" }),
    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "restrict" }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    preparingAt: timestamp("preparing_at", { withTimezone: true }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_store_id_idx").on(table.storeId),
    index("orders_city_id_idx").on(table.cityId),
    index("orders_country_id_idx").on(table.countryId),
    index("orders_status_idx").on(table.status),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_order_number_idx").on(table.orderNumber),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_store_status_idx").on(table.storeId, table.status),
    index("orders_user_created_idx").on(table.userId, table.createdAt),
]);

// Relations
export const ordersRelations = relations(orders, ({ one }) => ({
    store: one(stores, {
        fields: [orders.storeId],
        references: [stores.id],
    }),
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    userAddress: one(userAddresses, {
        fields: [orders.userAddressId],
        references: [userAddresses.id],
    }),
    city: one(cities, {
        fields: [orders.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [orders.countryId],
        references: [countries.id],
    }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
