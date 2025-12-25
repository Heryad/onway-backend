import type { Context } from 'hono';
import { z } from 'zod';
import { NotificationService } from '../../services/notification.service';
import { ApiResponse } from '../../lib';
import { notificationTypes } from '../../db/schema/notifications';
import { db, users } from '../../db';
import { eq, and, inArray } from 'drizzle-orm';

const sendNotificationSchema = z.object({
    userId: z.string().uuid(),
    type: z.enum(notificationTypes),
    title: z.string().min(1).max(255),
    body: z.string().min(1).max(500),
    data: z.record(z.string(), z.unknown()).optional(),
    actionUrl: z.string().optional(),
});

const broadcastSchema = z.object({
    type: z.enum(notificationTypes),
    title: z.string().min(1).max(255),
    body: z.string().min(1).max(500),
    data: z.record(z.string(), z.unknown()).optional(),
    actionUrl: z.string().optional(),
    // Target selection
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    userIds: z.array(z.string().uuid()).optional(),
});

export class NotificationController {
    // Send to single user
    static async send(c: Context) {
        const body = await c.req.json();
        const validation = sendNotificationSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const notification = await NotificationService.send(validation.data);
        return ApiResponse.created(c, notification, 'Notification sent');
    }

    // Broadcast to multiple users
    static async broadcast(c: Context) {
        const body = await c.req.json();
        const validation = broadcastSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const { userIds, cityId, countryId, ...notificationData } = validation.data;
        let targetUserIds: string[] = userIds ?? [];

        // If no userIds provided, fetch based on city/country
        if (!userIds || userIds.length === 0) {
            const conditions = [];
            if (cityId) conditions.push(eq(users.cityId, cityId));
            if (countryId) conditions.push(eq(users.countryId, countryId));

            if (conditions.length === 0) {
                return ApiResponse.badRequest(c, 'Provide userIds, cityId, or countryId for targeting');
            }

            const targetUsers = await db.select({ id: users.id })
                .from(users)
                .where(and(...conditions));

            targetUserIds = targetUsers.map(u => u.id);
        }

        if (targetUserIds.length === 0) {
            return ApiResponse.badRequest(c, 'No users found for targeting');
        }

        const count = await NotificationService.broadcast({
            ...notificationData,
            userIds: targetUserIds,
        });

        return ApiResponse.success(c, {
            message: `Notification broadcast to ${count} users`,
            data: { count },
        });
    }

    // List notifications (admin can view any user's)
    static async list(c: Context) {
        const query = c.req.query();
        const userId = query.userId;

        if (!userId) {
            return ApiResponse.badRequest(c, 'userId is required');
        }

        const { data, total } = await NotificationService.listByUser(userId, {
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 50,
            unreadOnly: query.unreadOnly === 'true',
        });

        return ApiResponse.paginated(c, data, {
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 50,
            total,
        });
    }
}
