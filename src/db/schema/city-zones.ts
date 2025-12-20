import { pgTable, uuid, jsonb, varchar, boolean, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { cities } from "./cities";

/**
 * City Zones Table
 * Defines zones within a city with extra delivery fees (e.g., distant areas)
 * Inherits country_id from parent city
 */
export const cityZones = pgTable("city_zones", {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 255 }).notNull(),

    // Extra fee on top of city's base delivery fee
    extraDeliveryFee: decimal("extra_delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),

    // Polygon defining zone boundaries: [[lat, lng], [lat, lng], ...]
    geoPolygon: jsonb("geo_polygon").notNull().$type<[number, number][]>(),

    cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("city_zones_city_id_idx").on(table.cityId),
    index("city_zones_city_active_idx").on(table.cityId, table.isActive),
]);

// Relations
export const cityZonesRelations = relations(cityZones, ({ one }) => ({
    city: one(cities, {
        fields: [cityZones.cityId],
        references: [cities.id],
    }),
}));

export type CityZone = typeof cityZones.$inferSelect;
export type NewCityZone = typeof cityZones.$inferInsert;
