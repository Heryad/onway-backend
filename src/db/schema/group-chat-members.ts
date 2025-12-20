import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { groupChats } from "./group-chats";
import { users } from "./users";

/**
 * Group Member Roles
 */
export const groupMemberRoles = ["member", "moderator", "admin"] as const;
export type GroupMemberRole = (typeof groupMemberRoles)[number];

/**
 * Group Chat Members Table
 * Members of group chats
 */
export const groupChatMembers = pgTable("group_chat_members", {
    id: uuid("id").primaryKey().defaultRandom(),

    groupId: uuid("group_id").notNull().references(() => groupChats.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    role: varchar("role", { length: 20 }).notNull().$type<GroupMemberRole>().default("member"),

    // Mute settings
    isMuted: boolean("is_muted").default(false),
    mutedUntil: timestamp("muted_until", { withTimezone: true }),

    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
}, (table) => [
    index("group_members_group_idx").on(table.groupId),
    index("group_members_user_idx").on(table.userId),
    index("group_members_unique_idx").on(table.groupId, table.userId),
]);

// Relations
export const groupChatMembersRelations = relations(groupChatMembers, ({ one }) => ({
    group: one(groupChats, {
        fields: [groupChatMembers.groupId],
        references: [groupChats.id],
    }),
    user: one(users, {
        fields: [groupChatMembers.userId],
        references: [users.id],
    }),
}));

export type GroupChatMember = typeof groupChatMembers.$inferSelect;
export type NewGroupChatMember = typeof groupChatMembers.$inferInsert;
