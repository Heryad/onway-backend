import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * User Sessions Table
 * Tracks active sessions for token management and device logout
 */
export const userSessions = pgTable("user_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    // Device identification
    deviceId: varchar("device_id", { length: 255 }),
    deviceName: varchar("device_name", { length: 255 }),
    deviceType: varchar("device_type", { length: 50 }), // "ios", "android", "web"

    // Token tracking (store hash, not actual token)
    refreshTokenHash: varchar("refresh_token_hash", { length: 255 }).notNull(),

    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: varchar("user_agent", { length: 500 }),

    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_expires_idx").on(table.expiresAt),
    index("user_sessions_device_idx").on(table.userId, table.deviceId),
]);

// Relations
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
    user: one(users, {
        fields: [userSessions.userId],
        references: [users.id],
    }),
}));

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
