import { pgTable, uuid, varchar, boolean, timestamp, text, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { admins } from "./admins";
import { storeItems } from "./store-items";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Story Media Types
 */
export const storyMediaTypes = ["image", "video"] as const;
export type StoryMediaType = (typeof storyMediaTypes)[number];

/**
 * Stories Table
 * Instagram-like stories for stores, admins, or users
 */
export const stories = pgTable("stories", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Who posted the story (one of these)
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    adminId: uuid("admin_id").references(() => admins.id, { onDelete: "cascade" }),

    // Media
    type: varchar("type", { length: 10 }).notNull().$type<StoryMediaType>(),
    mediaUrl: varchar("media_url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }), // For video stories

    // Content
    caption: text("caption"),

    // Link to a product (optional)
    productId: uuid("product_id").references(() => storeItems.id, { onDelete: "set null" }),

    // Engagement (counter cache, updated by jobs)
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),

    // Location - for feed filtering by region
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // Stories expire (typically 24h)
}, (table) => [
    index("stories_user_id_idx").on(table.userId),
    index("stories_store_id_idx").on(table.storeId),
    index("stories_city_id_idx").on(table.cityId),
    index("stories_country_id_idx").on(table.countryId),
    index("stories_expires_idx").on(table.expiresAt),
    index("stories_created_idx").on(table.createdAt),
]);

// Relations
export const storiesRelations = relations(stories, ({ one }) => ({
    user: one(users, {
        fields: [stories.userId],
        references: [users.id],
    }),
    store: one(stores, {
        fields: [stories.storeId],
        references: [stores.id],
    }),
    admin: one(admins, {
        fields: [stories.adminId],
        references: [admins.id],
    }),
    product: one(storeItems, {
        fields: [stories.productId],
        references: [storeItems.id],
    }),
    city: one(cities, {
        fields: [stories.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [stories.countryId],
        references: [countries.id],
    }),
}));

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
