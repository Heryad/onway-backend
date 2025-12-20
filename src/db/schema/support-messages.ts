import { pgTable, uuid, varchar, timestamp, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { supportTickets } from "./support-tickets";
import { users } from "./users";
import { admins } from "./admins";

/**
 * Message Sender Types
 */
export const messageSenderTypes = ["user", "admin", "system"] as const;
export type MessageSenderType = (typeof messageSenderTypes)[number];

/**
 * Message Types
 */
export const messageTypes = ["text", "image", "file"] as const;
export type MessageType = (typeof messageTypes)[number];

/**
 * Support Messages Table
 * Messages within a support ticket
 */
export const supportMessages = pgTable("support_messages", {
    id: uuid("id").primaryKey().defaultRandom(),

    ticketId: uuid("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),

    body: text("body").notNull(),
    type: varchar("type", { length: 20 }).notNull().$type<MessageType>().default("text"),
    mediaUrl: varchar("media_url", { length: 500 }), // For image/file messages

    senderType: varchar("sender_type", { length: 20 }).notNull().$type<MessageSenderType>(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    adminId: uuid("admin_id").references(() => admins.id, { onDelete: "set null" }),

    // Read tracking
    isRead: timestamp("is_read", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("support_messages_ticket_id_idx").on(table.ticketId),
    index("support_messages_created_idx").on(table.ticketId, table.createdAt),
]);

// Relations
export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
    ticket: one(supportTickets, {
        fields: [supportMessages.ticketId],
        references: [supportTickets.id],
    }),
    user: one(users, {
        fields: [supportMessages.userId],
        references: [users.id],
    }),
    admin: one(admins, {
        fields: [supportMessages.adminId],
        references: [admins.id],
    }),
}));

export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = typeof supportMessages.$inferInsert;
