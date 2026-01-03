import { pgTable, uuid, jsonb, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";
import { sections } from "./sections";

/**
 * Categories Table
 * Main business categories (e.g., "Restaurants", "Groceries", "Pharmacy")
 */
export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language name
    name: jsonb("name").notNull().$type<Record<string, string>>(),
    description: jsonb("description").$type<Record<string, string>>(),
    avatar: varchar("avatar", { length: 500 }),

    sorting: integer("sorting").default(0).notNull(),

    // Relationship to Section (e.g., "Foods", "Groceries")
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),

    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("categories_section_id_idx").on(table.sectionId),
    index("categories_city_id_idx").on(table.cityId),
    index("categories_sorting_idx").on(table.sorting),
    index("categories_active_idx").on(table.isActive),
]);

// Relations
export const categoriesRelations = relations(categories, ({ one }) => ({
    section: one(sections, {
        fields: [categories.sectionId],
        references: [sections.id],
    }),
    city: one(cities, {
        fields: [categories.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [categories.countryId],
        references: [countries.id],
    }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
