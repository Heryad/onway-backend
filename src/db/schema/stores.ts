import { pgTable, uuid, jsonb, varchar, boolean, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";
import { cityZones } from "./city-zones";

/**
 * Discount Types Enum
 */
export const discountTypes = ["percent", "fixed"] as const;
export type DiscountType = (typeof discountTypes)[number];

/**
 * Thumbnail Types Enum
 */
export const thumbnailTypes = ["image", "video"] as const;
export type ThumbnailType = (typeof thumbnailTypes)[number];

/**
 * Category Display Settings Enum
 */
export const categoryDisplaySettings = ["compact", "minimized", "expanded"] as const;
export type CategoryDisplaySetting = (typeof categoryDisplaySettings)[number];

/**
 * Working Hours Type
 */
export type WorkingHours = {
    [key: string]: { // "monday", "tuesday", etc.
        open: string;  // "09:00"
        close: string; // "22:00"
        is24Hours?: boolean;
        isClosed?: boolean;
    };
};

/**
 * Stores Table
 * Restaurant/store information
 */
export const stores = pgTable("stores", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Basic info
    name: jsonb("name").notNull().$type<Record<string, string>>(), // Multi-language
    description: jsonb("description").$type<Record<string, string>>(),
    avatar: varchar("avatar", { length: 500 }),
    thumbnail: varchar("thumbnail", { length: 500 }),
    thumbnailType: varchar("thumbnail_type", { length: 10 }).$type<ThumbnailType>().default("image"),

    // Delivery settings
    hasSpecialDeliveryFee: boolean("has_special_delivery_fee").default(false).notNull(),
    specialDeliveryFee: decimal("special_delivery_fee", { precision: 10, scale: 2 }),
    minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),

    // Store discount
    discountType: varchar("discount_type", { length: 20 }).$type<DiscountType>(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
    maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),

    // Sorting and visibility
    sorting: integer("sorting").default(0).notNull(),
    isPrime: boolean("is_prime").default(false).notNull(),
    isSponsored: boolean("is_sponsored").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    // Working hours
    workingHours: jsonb("working_hours").$type<WorkingHours>(),
    preparationTime: integer("preparation_time").default(30), // Minutes

    // Rating (calculated)
    rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
    totalReviews: integer("total_reviews").default(0),

    // Location
    geoLocation: jsonb("geo_location").$type<{ lat: number; lng: number }>(),
    address: varchar("address", { length: 500 }),

    // Display settings
    categoryDisplaySetting: varchar("category_display_setting", { length: 20 })
        .$type<CategoryDisplaySetting>()
        .default("expanded"),

    // Order settings
    canPlaceOrder: boolean("can_place_order").default(true).notNull(),
    acceptsScheduledOrders: boolean("accepts_scheduled_orders").default(false).notNull(),

    // Commission rate for this store
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("15.00"),

    zoneId: uuid("zone_id").references(() => cityZones.id, { onDelete: "set null" }),
    cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "restrict" }),
    countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "restrict" }),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("stores_zone_id_idx").on(table.zoneId),
    index("stores_city_id_idx").on(table.cityId),
    index("stores_country_id_idx").on(table.countryId),
    index("stores_is_active_idx").on(table.isActive),
    index("stores_is_prime_idx").on(table.isPrime),
    index("stores_is_sponsored_idx").on(table.isSponsored),
    index("stores_sorting_idx").on(table.sorting),
    index("stores_rating_idx").on(table.rating),
    index("stores_city_active_idx").on(table.cityId, table.isActive),
]);

// Relations
export const storesRelations = relations(stores, ({ one }) => ({
    zone: one(cityZones, {
        fields: [stores.zoneId],
        references: [cityZones.id],
    }),
    city: one(cities, {
        fields: [stores.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [stores.countryId],
        references: [countries.id],
    }),
}));

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
