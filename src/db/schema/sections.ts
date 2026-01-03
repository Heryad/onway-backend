import { pgTable, uuid, jsonb, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";
import { categories } from "./categories";
import { stores } from "./stores";

/**
 * Sections Table
 * Homepage sections for organizing stores (e.g., "Popular Near You", "New Arrivals")
 */
export const sections = pgTable("sections", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Multi-language name
    name: jsonb("name").notNull().$type<Record<string, string>>(),
    description: jsonb("description").$type<Record<string, string>>(),
    avatar: varchar("avatar", { length: 500 }),

    sorting: integer("sorting").default(0).notNull(),

    // "Coming Soon" placeholder section
    comingSoon: boolean("coming_soon").default(false).notNull(),

    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("sections_city_id_idx").on(table.cityId),
    index("sections_sorting_idx").on(table.sorting),
    index("sections_active_idx").on(table.isActive),
]);

// Relations
export const sectionsRelations = relations(sections, ({ one, many }) => ({
    categories: many(categories),
    stores: many(stores),
    city: one(cities, {
        fields: [sections.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [sections.countryId],
        references: [countries.id],
    }),
}));

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
