import type { Context } from 'hono';
import { z } from 'zod';
import { SupportService } from '../../services/admin/support.service';
import { ApiResponse } from '../../lib';
import { ticketStatuses, ticketDepartments, ticketPriorities } from '../../db/schema/support-tickets';
import { messageTypes } from '../../db/schema/support-messages';

const listTicketsSchema = z.object({
    userId: z.string().uuid().optional(),
    assignedAdminId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    status: z.enum(ticketStatuses).optional(),
    department: z.enum(ticketDepartments).optional(),
    priority: z.enum(ticketPriorities).optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

const updateStatusSchema = z.object({
    status: z.enum(ticketStatuses),
});

const assignSchema = z.object({
    adminId: z.string().uuid().nullable(),
});

const updatePrioritySchema = z.object({
    priority: z.enum(ticketPriorities),
});

const updateDepartmentSchema = z.object({
    department: z.enum(ticketDepartments),
});

const addMessageSchema = z.object({
    body: z.string().min(1),
    type: z.enum(messageTypes).default('text'),
    mediaUrl: z.string().optional(),
});

export class SupportController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listTicketsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await SupportService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const ticket = await SupportService.getById(id);

        if (!ticket) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && ticket.cityId && ticket.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && ticket.countryId && ticket.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        // Mark messages as read when admin views ticket
        await SupportService.markMessagesAsRead(id);

        return ApiResponse.success(c, { message: 'Ticket retrieved', data: ticket });
    }

    static async updateStatus(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateStatusSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SupportService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const ticket = await SupportService.updateStatus(id, validation.data.status);
        return ApiResponse.success(c, { message: `Status updated to ${validation.data.status}`, data: ticket });
    }

    static async assign(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = assignSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SupportService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const ticket = await SupportService.assign(id, validation.data.adminId);
        return ApiResponse.success(c, {
            message: validation.data.adminId ? 'Ticket assigned' : 'Ticket unassigned',
            data: ticket,
        });
    }

    static async updatePriority(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updatePrioritySchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SupportService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const ticket = await SupportService.updatePriority(id, validation.data.priority);
        return ApiResponse.success(c, { message: `Priority updated to ${validation.data.priority}`, data: ticket });
    }

    static async updateDepartment(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateDepartmentSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SupportService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const ticket = await SupportService.updateDepartment(id, validation.data.department);
        return ApiResponse.success(c, { message: `Department updated to ${validation.data.department}`, data: ticket });
    }

    // ========== Messages ==========

    static async getMessages(c: Context) {
        const id = c.req.param('id');

        const existing = await SupportService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const messages = await SupportService.getMessages(id);
        return ApiResponse.success(c, { message: 'Messages retrieved', data: messages });
    }

    static async addMessage(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = addMessageSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await SupportService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Ticket not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && existing.cityId && existing.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && existing.countryId && existing.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const admin = c.get('admin');
        const message = await SupportService.addMessage(
            id,
            validation.data.body,
            'admin',
            admin.adminId,
            validation.data.type,
            validation.data.mediaUrl
        );

        return ApiResponse.created(c, message, 'Message sent');
    }
}
