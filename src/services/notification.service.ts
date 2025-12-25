import { eq, and, desc, SQL } from 'drizzle-orm';
import { db, notifications } from '../db';
import { emitToUser, isUserOnline } from '../sockets';
import type { Notification, NewNotification, NotificationType } from '../db/schema/notifications';

export interface SendNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
}

export interface BroadcastNotificationInput {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
    userIds: string[];
}

export class NotificationService {
    /**
     * Send notification to a single user
     * Stores in DB and emits via Socket.io if online
     */
    static async send(input: SendNotificationInput): Promise<Notification> {
        // Store in database
        const [notification] = await db.insert(notifications).values({
            userId: input.userId,
            type: input.type,
            title: input.title,
            body: input.body,
            data: input.data,
            actionUrl: input.actionUrl,
        }).returning();

        // Emit via Socket.io if user is online
        const wasDelivered = emitToUser(input.userId, 'notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            actionUrl: notification.actionUrl,
            createdAt: notification.createdAt,
        });

        // Update push sent status if delivered in real-time
        if (wasDelivered) {
            await db.update(notifications)
                .set({ isPushSent: true, pushSentAt: new Date() })
                .where(eq(notifications.id, notification.id));
        }

        return notification;
    }

    /**
     * Broadcast notification to multiple users
     */
    static async broadcast(input: BroadcastNotificationInput): Promise<number> {
        if (input.userIds.length === 0) return 0;

        // Batch insert notifications
        const notificationValues = input.userIds.map(userId => ({
            userId,
            type: input.type,
            title: input.title,
            body: input.body,
            data: input.data,
            actionUrl: input.actionUrl,
        }));

        const inserted = await db.insert(notifications).values(notificationValues).returning();

        // Emit to online users
        for (const notification of inserted) {
            emitToUser(notification.userId, 'notification', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                body: notification.body,
                data: notification.data,
                actionUrl: notification.actionUrl,
                createdAt: notification.createdAt,
            });
        }

        return inserted.length;
    }

    // ========== Convenience Methods for Common Events ==========

    /**
     * Notify user about order status change
     */
    static async notifyOrderUpdate(userId: string, orderId: string, orderNumber: string, status: string): Promise<Notification> {
        const statusMessages: Record<string, string> = {
            accepted: 'Your order has been accepted!',
            preparing: 'Your order is being prepared.',
            ready: 'Your order is ready for pickup!',
            picked_up: 'Your order is on the way!',
            delivered: 'Your order has been delivered!',
            cancelled: 'Your order has been cancelled.',
        };

        return this.send({
            userId,
            type: status === 'delivered' ? 'order_delivered' : 'order_update',
            title: `Order #${orderNumber}`,
            body: statusMessages[status] || `Order status updated to ${status}`,
            data: { orderId, status },
            actionUrl: `/orders/${orderId}`,
        });
    }

    /**
     * Notify user about driver assignment
     */
    static async notifyDriverAssigned(userId: string, orderId: string, orderNumber: string, driverName: string): Promise<Notification> {
        return this.send({
            userId,
            type: 'order_update',
            title: `Order #${orderNumber}`,
            body: `${driverName} is on the way to pick up your order.`,
            data: { orderId, event: 'driver_assigned' },
            actionUrl: `/orders/${orderId}`,
        });
    }

    /**
     * Notify user about support ticket reply
     */
    static async notifySupportReply(userId: string, ticketId: string, ticketNumber: string): Promise<Notification> {
        return this.send({
            userId,
            type: 'support_reply',
            title: 'Support Reply',
            body: `You have a new reply on ticket #${ticketNumber}`,
            data: { ticketId },
            actionUrl: `/support/${ticketId}`,
        });
    }

    /**
     * Notify user about support ticket status change
     */
    static async notifyTicketStatusChange(userId: string, ticketId: string, ticketNumber: string, status: string): Promise<Notification> {
        return this.send({
            userId,
            type: 'support_reply',
            title: `Ticket #${ticketNumber}`,
            body: `Your support ticket has been ${status}.`,
            data: { ticketId, status },
            actionUrl: `/support/${ticketId}`,
        });
    }

    /**
     * Notify user about coin reward
     */
    static async notifyReward(userId: string, amount: number, reason: string): Promise<Notification> {
        return this.send({
            userId,
            type: 'reward',
            title: 'You earned coins! 🎉',
            body: `+${amount} coins - ${reason}`,
            data: { amount, reason },
            actionUrl: '/wallet',
        });
    }

    /**
     * Notify about new promo code
     */
    static async notifyPromoCode(userId: string, code: string, discount: string): Promise<Notification> {
        return this.send({
            userId,
            type: 'promo_code',
            title: 'New Promo Code! 🎁',
            body: `Use code ${code} for ${discount} off!`,
            data: { code },
            actionUrl: '/promo-codes',
        });
    }

    // ========== Query Methods ==========

    static async getById(id: string): Promise<Notification | null> {
        const notification = await db.query.notifications.findFirst({
            where: eq(notifications.id, id),
        });
        return notification ?? null;
    }

    static async listByUser(userId: string, options: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<{ data: Notification[]; total: number }> {
        const { page = 1, limit = 50, unreadOnly = false } = options;

        const conditions: SQL[] = [eq(notifications.userId, userId)];
        if (unreadOnly) {
            conditions.push(eq(notifications.isRead, false));
        }

        const whereClause = and(...conditions);

        const [data, countResult] = await Promise.all([
            db.query.notifications.findMany({
                where: whereClause,
                orderBy: desc(notifications.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: notifications.id }).from(notifications).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async markAsRead(id: string): Promise<void> {
        await db.update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(notifications.id, id));
    }

    static async markAllAsRead(userId: string): Promise<void> {
        await db.update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }

    static async getUnreadCount(userId: string): Promise<number> {
        const result = await db.select({ count: notifications.id })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        return result.length;
    }
}
