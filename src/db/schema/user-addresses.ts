import { pgTable, uuid, jsonb, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Address Types Enum
 */
export const addressTypes = ["home", "office", "other"] as const;
export type AddressType = (typeof addressTypes)[number];

/**
 * User Addresses Table
 * Delivery addresses for users
 */
export const userAddresses = pgTable("user_addresses", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Address details
    label: varchar("label", { length: 100 }), // "My Home", "Work", etc.
    street: varchar("street", { length: 255 }).notNull(),
    building: varchar("building", { length: 100 }),
    floor: varchar("floor", { length: 20 }),
    apartment: varchar("apartment", { length: 20 }),
    instructions: varchar("instructions", { length: 500 }), // Delivery instructions

    type: varchar("type", { length: 20 }).notNull().$type<AddressType>().default("home"),

    // Geo location: { lat: number, lng: number }
    geoLocation: jsonb("geo_location").notNull().$type<{ lat: number; lng: number }>(),

    isDefault: boolean("is_default").default(false).notNull(),

    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "restrict" }),
    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "restrict" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("user_addresses_user_id_idx").on(table.userId),
    index("user_addresses_user_default_idx").on(table.userId, table.isDefault),
    index("user_addresses_city_idx").on(table.cityId),
]);

// Relations
export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
    user: one(users, {
        fields: [userAddresses.userId],
        references: [users.id],
    }),
    city: one(cities, {
        fields: [userAddresses.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [userAddresses.countryId],
        references: [countries.id],
    }),
}));

export type UserAddress = typeof userAddresses.$inferSelect;
export type NewUserAddress = typeof userAddresses.$inferInsert;
