import { pgTable, uuid, jsonb, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Store Category Assignments Table
 * Junction table: which main categories does a store belong to
 * Replaces the categories[] array on stores table for better querying
 */
export const storeCategoryAssignments = pgTable("store_category_assignments", {
    id: uuid("id").primaryKey().defaultRandom(),

    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),

    // Sorting for sponsored stores within category
    sorting: integer("sorting").default(0).notNull(),
    isSponsored: boolean("is_sponsored").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_cat_assign_store_idx").on(table.storeId),
    index("store_cat_assign_category_idx").on(table.categoryId),
    index("store_cat_assign_sponsored_idx").on(table.categoryId, table.isSponsored, table.sorting),
]);

// Forward declaration of categories to avoid circular dependency
import { categories } from "./categories";

// Relations
export const storeCategoryAssignmentsRelations = relations(storeCategoryAssignments, ({ one }) => ({
    store: one(stores, {
        fields: [storeCategoryAssignments.storeId],
        references: [stores.id],
    }),
    category: one(categories, {
        fields: [storeCategoryAssignments.categoryId],
        references: [categories.id],
    }),
}));

export type StoreCategoryAssignment = typeof storeCategoryAssignments.$inferSelect;
export type NewStoreCategoryAssignment = typeof storeCategoryAssignments.$inferInsert;
