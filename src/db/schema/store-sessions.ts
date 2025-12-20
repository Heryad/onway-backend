import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { storeAuth } from "./store-auth";

/**
 * Store Sessions Table
 * Tracks active sessions for store users
 */
export const storeSessions = pgTable("store_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),

    storeAuthId: uuid("store_auth_id").notNull().references(() => storeAuth.id, { onDelete: "cascade" }),

    deviceId: varchar("device_id", { length: 255 }),
    deviceName: varchar("device_name", { length: 255 }),

    refreshTokenHash: varchar("refresh_token_hash", { length: 255 }).notNull(),

    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: varchar("user_agent", { length: 500 }),

    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("store_sessions_store_auth_id_idx").on(table.storeAuthId),
    index("store_sessions_expires_idx").on(table.expiresAt),
]);

// Relations
export const storeSessionsRelations = relations(storeSessions, ({ one }) => ({
    storeAuth: one(storeAuth, {
        fields: [storeSessions.storeAuthId],
        references: [storeAuth.id],
    }),
}));

export type StoreSession = typeof storeSessions.$inferSelect;
export type NewStoreSession = typeof storeSessions.$inferInsert;
