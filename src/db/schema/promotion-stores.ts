import { pgTable, uuid, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { promotions } from "./promotions";
import { stores } from "./stores";

/**
 * Promotion Stores Table
 * Junction table: which stores are part of a promotion
 */
export const promotionStores = pgTable("promotion_stores", {
    id: uuid("id").primaryKey().defaultRandom(),

    promotionId: uuid("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),

    sorting: integer("sorting").default(0).notNull(),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("promo_stores_promotion_idx").on(table.promotionId),
    index("promo_stores_store_idx").on(table.storeId),
    index("promo_stores_sorting_idx").on(table.promotionId, table.sorting),
]);

// Relations
export const promotionStoresRelations = relations(promotionStores, ({ one }) => ({
    promotion: one(promotions, {
        fields: [promotionStores.promotionId],
        references: [promotions.id],
    }),
    store: one(stores, {
        fields: [promotionStores.storeId],
        references: [stores.id],
    }),
}));

export type PromotionStore = typeof promotionStores.$inferSelect;
export type NewPromotionStore = typeof promotionStores.$inferInsert;
