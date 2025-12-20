import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Admin Roles Enum
 */
export const adminRoles = ["owner", "country_admin", "city_admin", "finance", "support"] as const;
export type AdminRole = (typeof adminRoles)[number];

/**
 * Admins Table
 * Platform administrators with role-based access
 */
export const admins = pgTable("admins", {
    id: uuid("id").primaryKey().defaultRandom(),

    username: varchar("username", { length: 100 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    avatar: varchar("avatar", { length: 500 }),

    role: varchar("role", { length: 20 }).notNull().$type<AdminRole>().default("support"),

    countryId: uuid("country_id").references(() => countries.id, { onDelete: "set null" }),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),

    isActive: boolean("is_active").default(true).notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("admins_email_idx").on(table.email),
    index("admins_role_idx").on(table.role),
    index("admins_is_active_idx").on(table.isActive),
]);

// Relations
export const adminsRelations = relations(admins, ({ one }) => ({
    country: one(countries, {
        fields: [admins.countryId],
        references: [countries.id],
    }),
    city: one(cities, {
        fields: [admins.cityId],
        references: [cities.id],
    }),
}));

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
