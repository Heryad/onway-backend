import { pgTable, uuid, varchar, timestamp, decimal, text, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { drivers } from "./drivers";

/**
 * Driver Order Status
 */
export const driverOrderStatuses = [
    "assigned",      // Assigned to driver, waiting for response
    "accepted",      // Driver accepted
    "rejected",      // Driver rejected
    "arrived_store", // Driver arrived at store
    "picked_up",     // Driver picked up order
    "on_the_way",    // En route to customer
    "arrived",       // Arrived at delivery location
    "delivered",     // Successfully delivered
    "cancelled",     // Driver cancelled after accepting
    "reassigned",    // Reassigned to another driver
] as const;
export type DriverOrderStatus = (typeof driverOrderStatuses)[number];

/**
 * Rejection Reasons
 */
export const driverRejectionReasons = [
    "too_far",
    "busy",
    "vehicle_issue",
    "personal_emergency",
    "order_too_large",
    "bad_weather",
    "other",
] as const;
export type DriverRejectionReason = (typeof driverRejectionReasons)[number];

/**
 * Driver Orders Table
 * Tracks driver assignments and delivery history for orders
 */
export const driverOrders = pgTable("driver_orders", {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").notNull().references(() => drivers.id, { onDelete: "restrict" }),

    status: varchar("status", { length: 20 }).notNull().$type<DriverOrderStatus>().default("assigned"),

    // Rejection info
    rejectionReason: varchar("rejection_reason", { length: 30 }).$type<DriverRejectionReason>(),
    rejectionNotes: text("rejection_notes"),

    // For batch deliveries (multiple orders, one trip)
    batchId: varchar("batch_id", { length: 50 }),
    pickupSequence: varchar("pickup_sequence", { length: 10 }),   // Order of pickup
    deliverySequence: varchar("delivery_sequence", { length: 10 }), // Order of delivery

    // Distance and time
    distanceKm: decimal("distance_km", { precision: 10, scale: 2 }),
    estimatedMinutes: varchar("estimated_minutes", { length: 10 }),
    actualMinutes: varchar("actual_minutes", { length: 10 }),

    // Live location tracking during delivery
    currentLocation: jsonb("current_location").$type<{ lat: number; lng: number }>(),
    routePolyline: text("route_polyline"), // Encoded polyline for map display

    // Earnings for this delivery
    baseFee: decimal("base_fee", { precision: 10, scale: 2 }),
    distanceBonus: decimal("distance_bonus", { precision: 10, scale: 2 }).default("0"),
    tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
    totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }),

    // Timestamps
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }), // Accepted or rejected
    arrivedStoreAt: timestamp("arrived_store_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("driver_orders_order_id_idx").on(table.orderId),
    index("driver_orders_driver_id_idx").on(table.driverId),
    index("driver_orders_status_idx").on(table.status),
    index("driver_orders_batch_id_idx").on(table.batchId),
    index("driver_orders_driver_status_idx").on(table.driverId, table.status),
    index("driver_orders_assigned_at_idx").on(table.assignedAt),
]);

// Relations
export const driverOrdersRelations = relations(driverOrders, ({ one }) => ({
    order: one(orders, {
        fields: [driverOrders.orderId],
        references: [orders.id],
    }),
    driver: one(drivers, {
        fields: [driverOrders.driverId],
        references: [drivers.id],
    }),
}));

export type DriverOrder = typeof driverOrders.$inferSelect;
export type NewDriverOrder = typeof driverOrders.$inferInsert;
