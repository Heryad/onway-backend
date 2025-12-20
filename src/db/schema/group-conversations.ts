import { pgTable, uuid, varchar, timestamp, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { groupChats } from "./group-chats";
import { users } from "./users";

/**
 * Group Message Types
 */
export const groupMessageTypes = ["text", "image", "video", "file"] as const;
export type GroupMessageType = (typeof groupMessageTypes)[number];

/**
 * Group Conversations Table
 * Messages in group chats
 */
export const groupConversations = pgTable("group_conversations", {
    id: uuid("id").primaryKey().defaultRandom(),

    groupId: uuid("group_id").notNull().references(() => groupChats.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    message: text("message"),
    type: varchar("type", { length: 20 }).notNull().$type<GroupMessageType>().default("text"),
    mediaUrl: varchar("media_url", { length: 500 }),

    // Reply to another message
    replyToId: uuid("reply_to_id"),

    // Deleted by user (soft delete)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("group_conv_group_idx").on(table.groupId),
    index("group_conv_user_idx").on(table.userId),
    index("group_conv_created_idx").on(table.groupId, table.createdAt),
]);

// Relations
export const groupConversationsRelations = relations(groupConversations, ({ one }) => ({
    group: one(groupChats, {
        fields: [groupConversations.groupId],
        references: [groupChats.id],
    }),
    user: one(users, {
        fields: [groupConversations.userId],
        references: [users.id],
    }),
    replyTo: one(groupConversations, {
        fields: [groupConversations.replyToId],
        references: [groupConversations.id],
    }),
}));

export type GroupConversation = typeof groupConversations.$inferSelect;
export type NewGroupConversation = typeof groupConversations.$inferInsert;
