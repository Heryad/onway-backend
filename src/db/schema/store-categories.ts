import { pgTable, uuid, jsonb, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";

/**
 * Store Categories Table
 * Categories within a store (e.g., "Burgers", "Drinks", "Desserts")
 * Inherits city_id/country_id from parent store
 */
export const storeCategories = pgTable("store_categories", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language name
    name: jsonb("name").notNull().$type<Record<string, string>>(),
    description: jsonb("description").$type<Record<string, string>>(),
    avatar: varchar("avatar", { length: 500 }),

    sorting: integer("sorting").default(0).notNull(),

    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_categories_store_id_idx").on(table.storeId),
    index("store_categories_sorting_idx").on(table.storeId, table.sorting),
    index("store_categories_active_idx").on(table.storeId, table.isActive),
]);

// Relations
export const storeCategoriesRelations = relations(storeCategories, ({ one }) => ({
    store: one(stores, {
        fields: [storeCategories.storeId],
        references: [stores.id],
    }),
}));

export type StoreCategory = typeof storeCategories.$inferSelect;
export type NewStoreCategory = typeof storeCategories.$inferInsert;
