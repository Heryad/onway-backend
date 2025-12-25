import type { Context } from 'hono';
import { z } from 'zod';
import { OrderService } from '../../services/admin/order.service';
import { ApiResponse } from '../../lib';
import { orderStatuses, paymentStatuses, paymentMethods, cancelReasons } from '../../db/schema/orders';

const listOrdersSchema = z.object({
    storeId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    status: z.enum(orderStatuses).optional(),
    paymentStatus: z.enum(paymentStatuses).optional(),
    paymentMethod: z.enum(paymentMethods).optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    orderNumber: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    sortBy: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateStatusSchema = z.object({
    status: z.enum(orderStatuses),
    notes: z.string().optional(),
});

const cancelOrderSchema = z.object({
    reason: z.enum(cancelReasons),
    notes: z.string().optional(),
});

const addNoteSchema = z.object({
    noteType: z.enum(['store', 'delivery']),
    note: z.string().min(1),
});

export class OrderController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listOrdersSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await OrderService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const order = await OrderService.getById(id);

        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Order retrieved', data: order });
    }

    static async getByOrderNumber(c: Context) {
        const orderNumber = c.req.param('orderNumber');
        const order = await OrderService.getByOrderNumber(orderNumber);

        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Order retrieved', data: order });
    }

    static async getItems(c: Context) {
        const id = c.req.param('id');

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const items = await OrderService.getItems(id);
        return ApiResponse.success(c, { message: 'Order items', data: items });
    }

    static async getStatusHistory(c: Context) {
        const id = c.req.param('id');

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const history = await OrderService.getStatusHistory(id);
        return ApiResponse.success(c, { message: 'Status history', data: history });
    }

    // ========== Phase 2: Operations ==========

    static async updateStatus(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateStatusSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const admin = c.get('admin');
        const updated = await OrderService.updateStatus(
            id,
            validation.data.status,
            'admin',
            admin?.adminId,
            validation.data.notes
        );

        return ApiResponse.success(c, { message: `Status updated to ${validation.data.status}`, data: updated });
    }

    static async cancel(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = cancelOrderSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        if (order.status === 'cancelled') {
            return ApiResponse.badRequest(c, 'Order is already cancelled');
        }

        if (order.status === 'delivered') {
            return ApiResponse.badRequest(c, 'Cannot cancel a delivered order');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const cancelled = await OrderService.cancel(id, validation.data.reason, 'admin', validation.data.notes);
        return ApiResponse.success(c, { message: 'Order cancelled', data: cancelled });
    }

    static async addNote(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = addNoteSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const updated = await OrderService.addNote(id, validation.data.noteType, validation.data.note);
        return ApiResponse.success(c, { message: 'Note added', data: updated });
    }

    // ========== Phase 3: Dispatch & Assignment ==========

    static async getAssignedDriver(c: Context) {
        const id = c.req.param('id');

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const assignment = await OrderService.getAssignedDriver(id);
        return ApiResponse.success(c, { message: 'Assigned driver', data: assignment });
    }

    static async assignDriver(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();

        const schema = z.object({ driverId: z.string().uuid() });
        const validation = schema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        try {
            const assignment = await OrderService.assignDriver(id, validation.data.driverId);
            return ApiResponse.success(c, { message: 'Driver assigned', data: assignment });
        } catch (err: any) {
            return ApiResponse.badRequest(c, err.message);
        }
    }

    static async reassignDriver(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();

        const schema = z.object({ driverId: z.string().uuid(), reason: z.string().optional() });
        const validation = schema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const assignment = await OrderService.reassignDriver(id, validation.data.driverId, validation.data.reason);
        return ApiResponse.success(c, { message: 'Driver reassigned', data: assignment });
    }

    // ========== Phase 4: Refunds ==========

    static async initiateRefund(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();

        const schema = z.object({
            type: z.enum(['full', 'partial']),
            method: z.enum(['coins', 'original']),
            amount: z.string().optional(),
        });
        const validation = schema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const order = await OrderService.getById(id);
        if (!order) {
            return ApiResponse.notFound(c, 'Order not found');
        }

        if (order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded') {
            return ApiResponse.badRequest(c, 'Order already has a refund');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && order.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && order.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        const admin = c.get('admin');
        const updated = await OrderService.initiateRefund(
            id,
            validation.data.type,
            validation.data.method,
            validation.data.amount,
            admin.adminId
        );
        return ApiResponse.success(c, { message: `Refund initiated via ${validation.data.method}`, data: updated });
    }
}
