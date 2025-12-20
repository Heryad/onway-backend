import { pgTable, uuid, varchar, timestamp, decimal, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Transaction Types
 */
export const transactionTypes = ["transfer", "withdraw", "deposit", "reward", "refund", "purchase"] as const;
export type TransactionType = (typeof transactionTypes)[number];

/**
 * Transaction Status
 */
export const transactionStatuses = ["pending", "completed", "failed", "cancelled"] as const;
export type TransactionStatus = (typeof transactionStatuses)[number];

/**
 * Transactions Table
 * Wallet/coin transactions between users - city_id/country_id for financial reporting
 */
export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Transaction reference number
    reference: varchar("reference", { length: 50 }).notNull().unique(),

    // Sender and receiver (both can be null for system transactions)
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
    receiverId: uuid("receiver_id").references(() => users.id, { onDelete: "set null" }),

    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    memo: text("memo"),

    type: varchar("type", { length: 20 }).notNull().$type<TransactionType>(),
    status: varchar("status", { length: 20 }).notNull().$type<TransactionStatus>().default("pending"),

    failureReason: text("failure_reason"),

    // Location - for regional financial reporting
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("transactions_sender_idx").on(table.senderId),
    index("transactions_receiver_idx").on(table.receiverId),
    index("transactions_reference_idx").on(table.reference),
    index("transactions_type_idx").on(table.type),
    index("transactions_status_idx").on(table.status),
    index("transactions_country_id_idx").on(table.countryId),
    index("transactions_created_idx").on(table.createdAt),
]);

// Relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
    sender: one(users, {
        fields: [transactions.senderId],
        references: [users.id],
        relationName: "transactionsSender",
    }),
    receiver: one(users, {
        fields: [transactions.receiverId],
        references: [users.id],
        relationName: "transactionsReceiver",
    }),
    city: one(cities, {
        fields: [transactions.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [transactions.countryId],
        references: [countries.id],
    }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
