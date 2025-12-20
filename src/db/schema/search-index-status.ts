import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Sync Status
 */
export const syncStatuses = ["idle", "syncing", "completed", "error"] as const;
export type SyncStatus = (typeof syncStatuses)[number];

/**
 * Search Index Status Table
 * Tracks Typesense sync status for each indexable table
 */
export const searchIndexStatus = pgTable("search_index_status", {
    id: uuid("id").primaryKey().defaultRandom(),

    tableName: varchar("table_name", { length: 100 }).notNull().unique(),

    // Last successfully synced record
    lastSyncedId: uuid("last_synced_id"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

    // Current status
    status: varchar("status", { length: 20 }).notNull().$type<SyncStatus>().default("idle"),

    // Error tracking
    lastError: varchar("last_error", { length: 1000 }),
    lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
    errorCount: varchar("error_count", { length: 10 }).default("0"),

    // Stats
    totalDocuments: varchar("total_documents", { length: 20 }).default("0"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("search_index_table_idx").on(table.tableName),
    index("search_index_status_idx").on(table.status),
]);

export type SearchIndexStatus = typeof searchIndexStatus.$inferSelect;
export type NewSearchIndexStatus = typeof searchIndexStatus.$inferInsert;
