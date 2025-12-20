import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Gender Enum
 */
export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

/**
 * Users Table
 * App users (customers) - OAuth authentication only
 */
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),

    username: varchar("username", { length: 100 }),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    avatar: varchar("avatar", { length: 500 }),

    gender: varchar("gender", { length: 10 }).$type<Gender>(),
    birthDate: date("birth_date"),

    // Premium membership
    isPrime: boolean("is_prime").default(false).notNull(),
    primeExpiresAt: timestamp("prime_expires_at", { withTimezone: true }),

    // In-app currency
    coinsBalance: integer("coins_balance").default(0).notNull(),

    // Flexible metadata for additional user data
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Location - needed for analytics (users per country/city)
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "set null" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("users_email_idx").on(table.email),
    index("users_phone_idx").on(table.phone),
    index("users_city_id_idx").on(table.cityId),
    index("users_country_id_idx").on(table.countryId),
    index("users_is_prime_idx").on(table.isPrime),
    index("users_is_active_idx").on(table.isActive),
]);

// Relations
export const usersRelations = relations(users, ({ one }) => ({
    city: one(cities, {
        fields: [users.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [users.countryId],
        references: [countries.id],
    }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
