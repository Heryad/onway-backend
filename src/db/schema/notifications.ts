import { pgTable, uuid, varchar, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * Notification Types
 */
export const notificationTypes = [
    "order_update",
    "order_delivered",
    "promotion",
    "promo_code",
    "chat_message",
    "support_reply",
    "reward",
    "system",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

/**
 * Notifications Table
 * Push/in-app notifications for users
 */
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    type: varchar("type", { length: 30 }).notNull().$type<NotificationType>(),
    title: varchar("title", { length: 255 }).notNull(),
    body: varchar("body", { length: 500 }).notNull(),

    // Additional data payload for deep linking
    data: jsonb("data").$type<Record<string, unknown>>(),

    // Action URL for when notification is clicked
    actionUrl: varchar("action_url", { length: 500 }),

    // Status
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    // Tracking
    isPushSent: boolean("is_push_sent").default(false),
    pushSentAt: timestamp("push_sent_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_user_read_idx").on(table.userId, table.isRead),
    index("notifications_type_idx").on(table.type),
    index("notifications_created_idx").on(table.createdAt),
]);

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
