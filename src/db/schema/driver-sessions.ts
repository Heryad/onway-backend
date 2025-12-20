import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { drivers } from "./drivers";

/**
 * Driver Sessions Table
 * Tracks active sessions for drivers
 */
export const driverSessions = pgTable("driver_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),

    driverId: uuid("driver_id").notNull().references(() => drivers.id, { onDelete: "cascade" }),

    deviceId: varchar("device_id", { length: 255 }),
    deviceName: varchar("device_name", { length: 255 }),
    deviceType: varchar("device_type", { length: 50 }),

    refreshTokenHash: varchar("refresh_token_hash", { length: 255 }).notNull(),

    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: varchar("user_agent", { length: 500 }),

    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("driver_sessions_driver_id_idx").on(table.driverId),
    index("driver_sessions_expires_idx").on(table.expiresAt),
]);

// Relations
export const driverSessionsRelations = relations(driverSessions, ({ one }) => ({
    driver: one(drivers, {
        fields: [driverSessions.driverId],
        references: [drivers.id],
    }),
}));

export type DriverSession = typeof driverSessions.$inferSelect;
export type NewDriverSession = typeof driverSessions.$inferInsert;
