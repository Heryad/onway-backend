import { eq, and, desc, SQL, sql } from 'drizzle-orm';
import { db, supportTickets, supportMessages } from '../../db';
import type { SupportTicket, TicketStatus, TicketDepartment, TicketPriority } from '../../db/schema/support-tickets';
import type { SupportMessage, MessageSenderType, MessageType } from '../../db/schema/support-messages';

export interface ListTicketsFilters {
    userId?: string;
    assignedAdminId?: string;
    orderId?: string;
    status?: TicketStatus;
    department?: TicketDepartment;
    priority?: TicketPriority;
    cityId?: string;
    countryId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export class SupportService {
    static async getById(id: string): Promise<SupportTicket | null> {
        const ticket = await db.query.supportTickets.findFirst({
            where: eq(supportTickets.id, id),
            with: {
                user: {
                    columns: { id: true, username: true, email: true, phone: true, avatar: true },
                },
                assignedAdmin: {
                    columns: { id: true, username: true, email: true },
                },
                order: {
                    columns: { id: true, orderNumber: true, status: true, total: true },
                },
                city: true,
                country: true,
            },
        });
        return ticket ?? null;
    }

    static async getByTicketNumber(ticketNumber: string): Promise<SupportTicket | null> {
        const ticket = await db.query.supportTickets.findFirst({
            where: eq(supportTickets.ticketNumber, ticketNumber),
            with: {
                user: true,
                assignedAdmin: true,
                order: true,
            },
        });
        return ticket ?? null;
    }

    static async list(filters: ListTicketsFilters): Promise<{ data: SupportTicket[]; total: number }> {
        const {
            userId,
            assignedAdminId,
            orderId,
            status,
            department,
            priority,
            cityId,
            countryId,
            search,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];

        if (userId) conditions.push(eq(supportTickets.userId, userId));
        if (assignedAdminId) conditions.push(eq(supportTickets.assignedAdminId, assignedAdminId));
        if (orderId) conditions.push(eq(supportTickets.orderId, orderId));
        if (status) conditions.push(eq(supportTickets.status, status));
        if (department) conditions.push(eq(supportTickets.department, department));
        if (priority) conditions.push(eq(supportTickets.priority, priority));
        if (cityId) conditions.push(eq(supportTickets.cityId, cityId));
        if (countryId) conditions.push(eq(supportTickets.countryId, countryId));

        if (search) {
            conditions.push(
                sql`(${supportTickets.ticketNumber} ILIKE ${`%${search}%`} OR ${supportTickets.title} ILIKE ${`%${search}%`})`
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.supportTickets.findMany({
                where: whereClause,
                with: {
                    user: {
                        columns: { id: true, username: true, email: true },
                    },
                    assignedAdmin: {
                        columns: { id: true, username: true },
                    },
                },
                orderBy: [
                    // Priority order: urgent > high > medium > low
                    sql`CASE ${supportTickets.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END`,
                    desc(supportTickets.createdAt),
                ],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: supportTickets.id }).from(supportTickets).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async updateStatus(id: string, status: TicketStatus): Promise<SupportTicket | null> {
        const updateData: any = { status, updatedAt: new Date() };

        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
        } else if (status === 'closed') {
            updateData.closedAt = new Date();
        }

        const [ticket] = await db.update(supportTickets)
            .set(updateData)
            .where(eq(supportTickets.id, id))
            .returning();

        return ticket ?? null;
    }

    static async assign(id: string, adminId: string | null): Promise<SupportTicket | null> {
        const updateData: any = {
            assignedAdminId: adminId,
            updatedAt: new Date(),
        };

        // Auto set to in_progress if assigning
        if (adminId) {
            updateData.status = 'in_progress';
        }

        const [ticket] = await db.update(supportTickets)
            .set(updateData)
            .where(eq(supportTickets.id, id))
            .returning();

        return ticket ?? null;
    }

    static async updatePriority(id: string, priority: TicketPriority): Promise<SupportTicket | null> {
        const [ticket] = await db.update(supportTickets)
            .set({ priority, updatedAt: new Date() })
            .where(eq(supportTickets.id, id))
            .returning();

        return ticket ?? null;
    }

    static async updateDepartment(id: string, department: TicketDepartment): Promise<SupportTicket | null> {
        const [ticket] = await db.update(supportTickets)
            .set({ department, updatedAt: new Date() })
            .where(eq(supportTickets.id, id))
            .returning();

        return ticket ?? null;
    }

    // ========== Messages ==========

    static async getMessages(ticketId: string): Promise<SupportMessage[]> {
        const messages = await db.query.supportMessages.findMany({
            where: eq(supportMessages.ticketId, ticketId),
            with: {
                user: {
                    columns: { id: true, username: true, avatar: true },
                },
                admin: {
                    columns: { id: true, username: true },
                },
            },
            orderBy: desc(supportMessages.createdAt),
        });
        return messages;
    }

    static async addMessage(
        ticketId: string,
        body: string,
        senderType: MessageSenderType,
        senderId: string,
        type: MessageType = 'text',
        mediaUrl?: string
    ): Promise<SupportMessage> {
        const [message] = await db.insert(supportMessages).values({
            ticketId,
            body,
            type,
            mediaUrl,
            senderType,
            adminId: senderType === 'admin' ? senderId : null,
            userId: senderType === 'user' ? senderId : null,
        }).returning();

        // Update ticket timestamp and set to in_progress if open
        await db.update(supportTickets)
            .set({
                updatedAt: new Date(),
                status: sql`CASE WHEN ${supportTickets.status} = 'open' THEN 'in_progress' ELSE ${supportTickets.status} END`,
            })
            .where(eq(supportTickets.id, ticketId));

        return message;
    }

    static async markMessagesAsRead(ticketId: string): Promise<void> {
        await db.update(supportMessages)
            .set({ isRead: new Date() })
            .where(and(
                eq(supportMessages.ticketId, ticketId),
                sql`${supportMessages.isRead} IS NULL`,
                eq(supportMessages.senderType, 'user')
            ));
    }
}
