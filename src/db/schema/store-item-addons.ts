import { pgTable, uuid, jsonb, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { storeItems } from "./store-items";

/**
 * Addon Option Type
 * Each option has a name and price
 */
export type AddonOption = {
    id: string; // UUID for identifying selected option
    name: Record<string, string>; // Multi-language: { en: "Large", ar: "كبير" }
    price: number;
    isDefault?: boolean;
};

/**
 * Store Item Addons Table
 * Modifiers/extras for menu items (e.g., "Size", "Extra Toppings")
 * Inherits city_id/country_id from parent store
 */
export const storeItemAddons = pgTable("store_item_addons", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language name: { en: "Size", ar: "الحجم" }
    name: jsonb("name").notNull().$type<Record<string, string>>(),

    // Array of options with prices
    options: jsonb("options").notNull().$type<AddonOption[]>(),

    // Selection rules
    isRequired: boolean("is_required").default(false).notNull(),
    minSelections: integer("min_selections").default(0), // Minimum options to select
    maxSelections: integer("max_selections").default(1), // Maximum options (1 = single select, >1 = multi-select)

    sorting: integer("sorting").default(0).notNull(),

    storeItemId: uuid("store_item_id").notNull().references(() => storeItems.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_item_addons_item_id_idx").on(table.storeItemId),
    index("store_item_addons_store_id_idx").on(table.storeId),
    index("store_item_addons_sorting_idx").on(table.storeItemId, table.sorting),
]);

// Relations
export const storeItemAddonsRelations = relations(storeItemAddons, ({ one }) => ({
    storeItem: one(storeItems, {
        fields: [storeItemAddons.storeItemId],
        references: [storeItems.id],
    }),
    store: one(stores, {
        fields: [storeItemAddons.storeId],
        references: [stores.id],
    }),
}));

export type StoreItemAddon = typeof storeItemAddons.$inferSelect;
export type NewStoreItemAddon = typeof storeItemAddons.$inferInsert;
