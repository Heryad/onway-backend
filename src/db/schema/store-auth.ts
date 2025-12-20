import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";

/**
 * Store Auth Table
 * Login credentials for store owners/managers
 * Inherits city_id/country_id from parent store
 */
export const storeAuth = pgTable("store_auth", {
    id: uuid("id").primaryKey().defaultRandom(),

    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    // Role within the store
    role: varchar("role", { length: 20 }).notNull().default("owner"), // "owner", "manager", "staff"

    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),

    lastLogin: timestamp("last_login", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_auth_email_idx").on(table.email),
    index("store_auth_store_id_idx").on(table.storeId),
]);

// Relations
export const storeAuthRelations = relations(storeAuth, ({ one }) => ({
    store: one(stores, {
        fields: [storeAuth.storeId],
        references: [stores.id],
    }),
}));

export type StoreAuth = typeof storeAuth.$inferSelect;
export type NewStoreAuth = typeof storeAuth.$inferInsert;
