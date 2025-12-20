import { pgTable, uuid, varchar, timestamp, text, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { drivers } from "./drivers";
import { orders } from "./orders";
import { supportTickets } from "./support-tickets";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Review Types
 */
export const reviewTypes = ["store", "driver", "support"] as const;
export type ReviewType = (typeof reviewTypes)[number];

/**
 * Review Status
 */
export const reviewStatuses = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

/**
 * Reviews Table
 * Reviews for stores, drivers, and support - city_id/country_id for analytics
 */
export const reviews = pgTable("reviews", {
    id: uuid("id").primaryKey().defaultRandom(),

    type: varchar("type", { length: 20 }).notNull().$type<ReviewType>(),

    // Rating 1-5
    rating: integer("rating").notNull(),
    comment: text("comment"),

    // Images attached to review
    images: varchar("images", { length: 500 }),

    // Reviewer
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    // What's being reviewed (one of these based on type)
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }),

    // Related order
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),

    // Moderation
    status: varchar("status", { length: 20 }).notNull().$type<ReviewStatus>().default("pending"),
    rejectionReason: text("rejection_reason"),

    // Location - for regional analytics
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("reviews_user_id_idx").on(table.userId),
    index("reviews_store_id_idx").on(table.storeId),
    index("reviews_driver_id_idx").on(table.driverId),
    index("reviews_order_id_idx").on(table.orderId),
    index("reviews_type_status_idx").on(table.type, table.status),
    index("reviews_store_rating_idx").on(table.storeId, table.rating),
    index("reviews_country_id_idx").on(table.countryId),
]);

// Relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
    store: one(stores, {
        fields: [reviews.storeId],
        references: [stores.id],
    }),
    driver: one(drivers, {
        fields: [reviews.driverId],
        references: [drivers.id],
    }),
    ticket: one(supportTickets, {
        fields: [reviews.ticketId],
        references: [supportTickets.id],
    }),
    order: one(orders, {
        fields: [reviews.orderId],
        references: [orders.id],
    }),
    city: one(cities, {
        fields: [reviews.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [reviews.countryId],
        references: [countries.id],
    }),
}));

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
