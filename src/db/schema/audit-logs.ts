import { pgTable, uuid, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Actor Types
 */
export const actorTypes = ["admin", "user", "driver", "store", "system"] as const;
export type ActorType = (typeof actorTypes)[number];

/**
 * Action Types
 */
export const actionTypes = [
    "create",
    "update",
    "delete",
    "login",
    "logout",
    "password_change",
    "status_change",
    "payment",
    "refund",
    "assign",
    "export",
] as const;
export type ActionType = (typeof actionTypes)[number];

/**
 * Audit Logs Table
 * Tracks all important actions for debugging and compliance
 */
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Who performed the action
    actorType: varchar("actor_type", { length: 20 }).notNull().$type<ActorType>(),
    actorId: uuid("actor_id"), // Can be null for system actions
    actorEmail: varchar("actor_email", { length: 255 }), // Snapshot for audit trail

    // What action was performed
    action: varchar("action", { length: 30 }).notNull().$type<ActionType>(),

    // What entity was affected
    tableName: varchar("table_name", { length: 100 }).notNull(),
    recordId: uuid("record_id"),

    // Data changes
    oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
    newValues: jsonb("new_values").$type<Record<string, unknown>>(),

    // Additional context
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Request info
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    requestId: varchar("request_id", { length: 100 }), // For tracing requests

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("audit_logs_actor_idx").on(table.actorType, table.actorId),
    index("audit_logs_table_idx").on(table.tableName),
    index("audit_logs_record_idx").on(table.tableName, table.recordId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_idx").on(table.createdAt),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
