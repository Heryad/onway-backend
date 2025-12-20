import { pgTable, uuid, timestamp, integer, text, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { carts } from "./carts";
import { storeItems } from "./store-items";

/**
 * Selected Cart Addon Type
 */
export type SelectedCartAddon = {
    addonId: string;
    selectedOptionIds: string[];
};

/**
 * Cart Items Table
 * Items in a shopping cart
 */
export const cartItems = pgTable("cart_items", {
    id: uuid("id").primaryKey().defaultRandom(),

    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    storeItemId: uuid("store_item_id").notNull().references(() => storeItems.id, { onDelete: "cascade" }),

    quantity: integer("quantity").notNull().default(1),

    // User's addon selections
    selectedAddons: jsonb("selected_addons").$type<SelectedCartAddon[]>().default([]),

    // Special instructions
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("cart_items_cart_id_idx").on(table.cartId),
    index("cart_items_store_item_id_idx").on(table.storeItemId),
]);

// Relations
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id],
    }),
    storeItem: one(storeItems, {
        fields: [cartItems.storeItemId],
        references: [storeItems.id],
    }),
}));

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
