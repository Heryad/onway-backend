import { pgTable, uuid, varchar, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Group Chats Table
 * Community group chats
 */
export const groupChats = pgTable("group_chats", {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }),
    thumbnail: varchar("thumbnail", { length: 500 }),

    // Counter cache
    membersCount: integer("members_count").default(0),

    // Supervisor/owner
    supervisorId: uuid("supervisor_id").notNull().references(() => users.id, { onDelete: "restrict" }),

    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("group_chats_supervisor_idx").on(table.supervisorId),
    index("group_chats_city_idx").on(table.cityId),
]);

// Relations
export const groupChatsRelations = relations(groupChats, ({ one }) => ({
    supervisor: one(users, {
        fields: [groupChats.supervisorId],
        references: [users.id],
    }),
    city: one(cities, {
        fields: [groupChats.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [groupChats.countryId],
        references: [countries.id],
    }),
}));

export type GroupChat = typeof groupChats.$inferSelect;
export type NewGroupChat = typeof groupChats.$inferInsert;
