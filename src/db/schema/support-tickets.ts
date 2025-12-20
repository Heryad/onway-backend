import { pgTable, uuid, varchar, boolean, timestamp, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { admins } from "./admins";
import { orders } from "./orders";
import { countries } from "./countries";
import { cities } from "./cities";

/**
 * Ticket Status
 */
export const ticketStatuses = ["open", "in_progress", "waiting_user", "resolved", "closed"] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

/**
 * Ticket Departments
 */
export const ticketDepartments = ["orders", "technical", "general", "payment", "driver", "store"] as const;
export type TicketDepartment = (typeof ticketDepartments)[number];

/**
 * Ticket Priority
 */
export const ticketPriorities = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

/**
 * Support Tickets Table
 * Customer support tickets - city_id/country_id for regional support routing
 */
export const supportTickets = pgTable("support_tickets", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Ticket number for display (e.g., "TKT-2025-001234")
    ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    status: varchar("status", { length: 20 }).notNull().$type<TicketStatus>().default("open"),
    department: varchar("department", { length: 20 }).notNull().$type<TicketDepartment>().default("general"),
    priority: varchar("priority", { length: 20 }).notNull().$type<TicketPriority>().default("medium"),

    // Related order (if applicable)
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),

    // User who created the ticket
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    // Assigned admin
    assignedAdminId: uuid("assigned_admin_id").references(() => admins.id, { onDelete: "set null" }),

    // Location - for regional support routing and analytics
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
}, (table) => [
    index("support_tickets_user_id_idx").on(table.userId),
    index("support_tickets_admin_id_idx").on(table.assignedAdminId),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_department_idx").on(table.department),
    index("support_tickets_ticket_number_idx").on(table.ticketNumber),
    index("support_tickets_order_id_idx").on(table.orderId),
    index("support_tickets_country_id_idx").on(table.countryId),
]);

// Relations
export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
    user: one(users, {
        fields: [supportTickets.userId],
        references: [users.id],
    }),
    assignedAdmin: one(admins, {
        fields: [supportTickets.assignedAdminId],
        references: [admins.id],
    }),
    order: one(orders, {
        fields: [supportTickets.orderId],
        references: [orders.id],
    }),
    city: one(cities, {
        fields: [supportTickets.cityId],
        references: [cities.id],
    }),
    country: one(countries, {
        fields: [supportTickets.countryId],
        references: [countries.id],
    }),
}));

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
