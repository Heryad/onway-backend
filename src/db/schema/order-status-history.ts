import { pgTable, uuid, varchar, timestamp, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders, type OrderStatus } from "./orders";

/**
 * Changed By Types
 */
export const changedByTypes = ["system", "admin", "store", "driver", "user"] as const;
export type ChangedByType = (typeof changedByTypes)[number];

/**
 * Order Status History Table
 * Tracks all status changes for an order
 */
export const orderStatusHistory = pgTable("order_status_history", {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),

    fromStatus: varchar("from_status", { length: 30 }).$type<OrderStatus>(),
    toStatus: varchar("to_status", { length: 30 }).notNull().$type<OrderStatus>(),

    changedByType: varchar("changed_by_type", { length: 20 }).notNull().$type<ChangedByType>(),
    changedById: uuid("changed_by_id"), // ID of admin/store/driver/user who made the change

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("order_status_history_order_id_idx").on(table.orderId),
    index("order_status_history_created_idx").on(table.orderId, table.createdAt),
]);

// Relations
export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
    order: one(orders, {
        fields: [orderStatusHistory.orderId],
        references: [orders.id],
    }),
}));

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
