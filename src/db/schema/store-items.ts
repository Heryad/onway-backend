import { pgTable, uuid, jsonb, varchar, boolean, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { storeCategories } from "./store-categories";

/**
 * Discount Types (re-exported for convenience)
 */
export const itemDiscountTypes = ["percent", "fixed"] as const;
export type ItemDiscountType = (typeof itemDiscountTypes)[number];

/**
 * Store Items Table
 * Menu items/products within a store
 * Inherits city_id/country_id from parent store
 */
export const storeItems = pgTable("store_items", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language content
    name: jsonb("name").notNull().$type<Record<string, string>>(),
    description: jsonb("description").$type<Record<string, string>>(),

    // Pricing
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }), // Original price for showing discount

    // Item discount
    discountType: varchar("discount_type", { length: 20 }).$type<ItemDiscountType>(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),

    // Media: array of image URLs
    photos: jsonb("photos").$type<string[]>().default([]),

    // Inventory
    maxQuantity: integer("max_quantity").default(10), // Max per order
    stockQuantity: integer("stock_quantity"), // If tracking inventory
    outOfStock: boolean("out_of_stock").default(false).notNull(),

    // Notes/tags for the item: ["spicy", "vegetarian", "gluten-free"]
    tags: jsonb("tags").$type<string[]>().default([]),

    // Calories, prep time, etc.
    nutritionInfo: jsonb("nutrition_info").$type<{
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
    }>(),

    preparationTime: integer("preparation_time"), // Minutes, if different from store default

    sorting: integer("sorting").default(0).notNull(),

    // Foreign keys - only store and category (city/country from store)
    categoryId: uuid("category_id").notNull().references(() => storeCategories.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_items_store_id_idx").on(table.storeId),
    index("store_items_category_id_idx").on(table.categoryId),
    index("store_items_sorting_idx").on(table.categoryId, table.sorting),
    index("store_items_active_idx").on(table.storeId, table.isActive),
    index("store_items_out_of_stock_idx").on(table.storeId, table.outOfStock),
]);

// Relations
export const storeItemsRelations = relations(storeItems, ({ one }) => ({
    category: one(storeCategories, {
        fields: [storeItems.categoryId],
        references: [storeCategories.id],
    }),
    store: one(stores, {
        fields: [storeItems.storeId],
        references: [stores.id],
    }),
}));

export type StoreItem = typeof storeItems.$inferSelect;
export type NewStoreItem = typeof storeItems.$inferInsert;
