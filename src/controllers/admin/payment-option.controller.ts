import type { Context } from 'hono';
import { z } from 'zod';
import { PaymentOptionService } from '../../services/admin/payment-option.service';
import { ApiResponse } from '../../lib';

const createPaymentOptionSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    avatar: z.string().nullable().optional(),
    gateway: z.string().optional(),
    fee: z.string().default('0'),
    feeType: z.enum(['fixed', 'percent']).default('fixed'),
    countryId: z.string().uuid(),
    sorting: z.string().default('0'),
});

const updatePaymentOptionSchema = createPaymentOptionSchema.partial().extend({
    isActive: z.boolean().optional(),
});

const listPaymentOptionsSchema = z.object({
    countryId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    gateway: z.string().optional(),
});

export class PaymentOptionController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listPaymentOptionsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const data = await PaymentOptionService.list(validation.data);
        return ApiResponse.success(c, { message: 'Payment options', data });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const option = await PaymentOptionService.getById(id);

        if (!option) {
            return ApiResponse.notFound(c, 'Payment option not found');
        }

        return ApiResponse.success(c, { message: 'Payment option', data: option });
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createPaymentOptionSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const option = await PaymentOptionService.create(validation.data);
        return ApiResponse.created(c, option, 'Payment option created');
    }

    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updatePaymentOptionSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await PaymentOptionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Payment option not found');
        }

        const option = await PaymentOptionService.update(id, validation.data);
        return ApiResponse.success(c, { message: 'Payment option updated', data: option });
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        const existing = await PaymentOptionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Payment option not found');
        }

        await PaymentOptionService.delete(id);
        return ApiResponse.success(c, { message: 'Payment option deleted' });
    }

    static async toggleStatus(c: Context) {
        const id = c.req.param('id');

        const existing = await PaymentOptionService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Payment option not found');
        }

        const option = await PaymentOptionService.update(id, { isActive: !existing.isActive });
        return ApiResponse.success(c, {
            message: `Payment option ${option?.isActive ? 'activated' : 'deactivated'}`,
            data: { id, isActive: option?.isActive },
        });
    }
}
