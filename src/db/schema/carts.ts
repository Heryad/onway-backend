import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";

/**
 * Carts Table
 * User shopping carts
 */
export const carts = pgTable("carts", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),

    // Cart expiry (for cleanup)
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("carts_user_id_idx").on(table.userId),
    index("carts_store_id_idx").on(table.storeId),
    index("carts_user_store_idx").on(table.userId, table.storeId),
    index("carts_expires_idx").on(table.expiresAt),
]);

// Relations
export const cartsRelations = relations(carts, ({ one }) => ({
    user: one(users, {
        fields: [carts.userId],
        references: [users.id],
    }),
    store: one(stores, {
        fields: [carts.storeId],
        references: [stores.id],
    }),
}));

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
