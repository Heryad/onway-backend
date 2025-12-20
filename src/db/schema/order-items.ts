import { pgTable, uuid, varchar, timestamp, decimal, integer, text, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { storeItems } from "./store-items";

/**
 * Order Item Status
 */
export const orderItemStatuses = ["included", "removed", "substituted"] as const;
export type OrderItemStatus = (typeof orderItemStatuses)[number];

/**
 * Selected Addon Type
 * Stores the user's addon selections for this item
 */
export type SelectedAddon = {
    addonId: string;
    addonName: Record<string, string>;
    selectedOptions: {
        optionId: string;
        optionName: Record<string, string>;
        price: number;
    }[];
};

/**
 * Order Items Table
 * Individual items within an order
 */
export const orderItems = pgTable("order_items", {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    storeItemId: uuid("store_item_id").notNull().references(() => storeItems.id, { onDelete: "restrict" }),

    // Snapshot of item details at time of order
    itemSnapshot: jsonb("item_snapshot").notNull().$type<{
        name: Record<string, string>;
        price: number;
        photo?: string;
    }>(),

    // Selected addons with full details
    selectedAddons: jsonb("selected_addons").$type<SelectedAddon[]>().default([]),

    quantity: integer("quantity").notNull().default(1),

    // User notes for this item
    notes: text("notes"),

    // Pricing
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    addonsPrice: decimal("addons_price", { precision: 10, scale: 2 }).notNull().default("0"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    // Status (in case store removes item)
    status: varchar("status", { length: 20 }).notNull().$type<OrderItemStatus>().default("included"),
    removeReason: text("remove_reason"),

    // For substitutions
    substitutedItemId: uuid("substituted_item_id").references(() => storeItems.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_store_item_id_idx").on(table.storeItemId),
]);

// Relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    storeItem: one(storeItems, {
        fields: [orderItems.storeItemId],
        references: [storeItems.id],
    }),
    substitutedItem: one(storeItems, {
        fields: [orderItems.substitutedItemId],
        references: [storeItems.id],
    }),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
