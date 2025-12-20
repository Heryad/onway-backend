import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { storeItems } from "./store-items";

/**
 * Favorite Types Enum
 */
export const favoriteTypes = ["store", "item"] as const;
export type FavoriteType = (typeof favoriteTypes)[number];

/**
 * User Favorites Table
 * Stores and items that users have favorited
 */
export const userFavorites = pgTable("user_favorites", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    type: varchar("type", { length: 20 }).notNull().$type<FavoriteType>(),

    // One of these will be set based on type
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    storeItemId: uuid("store_item_id").references(() => storeItems.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("user_favorites_user_id_idx").on(table.userId),
    index("user_favorites_user_type_idx").on(table.userId, table.type),
    index("user_favorites_store_idx").on(table.storeId),
    index("user_favorites_item_idx").on(table.storeItemId),
]);

// Relations
export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
    user: one(users, {
        fields: [userFavorites.userId],
        references: [users.id],
    }),
    store: one(stores, {
        fields: [userFavorites.storeId],
        references: [stores.id],
    }),
    storeItem: one(storeItems, {
        fields: [userFavorites.storeItemId],
        references: [storeItems.id],
    }),
}));

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
