import { pgTable, uuid, jsonb, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";
import { cityZones } from "./city-zones";

/**
 * Vehicle Types Enum
 */
export const vehicleTypes = ["bike", "motor", "scooter", "car"] as const;
export type VehicleType = (typeof vehicleTypes)[number];

/**
 * Drivers Table
 * Delivery drivers with their own authentication
 */
export const drivers = pgTable("drivers", {
    id: uuid("id").primaryKey().defaultRandom(),

    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    avatar: varchar("avatar", { length: 500 }),

    // Vehicle info
    vehicleType: varchar("vehicle_type", { length: 20 }).notNull().$type<VehicleType>(),
    vehiclePlate: varchar("vehicle_plate", { length: 20 }),

    // Status
    isOnline: boolean("is_online").default(false).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(), // Can accept new orders

    // Current location: { lat: number, lng: number }
    currentLocation: jsonb("current_location").$type<{ lat: number; lng: number }>(),

    // Rating (calculated average)
    rating: varchar("rating", { length: 5 }).default("5.0"),
    totalDeliveries: integer("total_deliveries").default(0),

    zoneId: uuid("zone_id").references(() => cityZones.id, { onDelete: "set null" }),
    cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "restrict" }),
    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "restrict" }),

    isActive: boolean("is_active").default(true).notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("drivers_email_idx").on(table.email),
    index("drivers_phone_idx").on(table.phone),
    index("drivers_city_id_idx").on(table.cityId),
    index("drivers_country_id_idx").on(table.countryId),
    index("drivers_zone_id_idx").on(table.zoneId),
    index("drivers_is_online_idx").on(table.isOnline),
    index("drivers_available_idx").on(table.cityId, table.isOnline, table.isAvailable),
]);

// Relations
export const driversRelations = relations(drivers, ({ one }) => ({
    zone: one(cityZones, {
        fields: [drivers.zoneId],
        references: [cityZones.id],
    }),
    city: one(cities, {
        fields: [drivers.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [drivers.countryId],
        references: [countries.id],
    }),
}));

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;
