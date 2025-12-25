import type { Context } from 'hono';
import { z } from 'zod';
import { StorePayoutService } from '../../services/admin/store-payout.service';
import { StoreService } from '../../services/admin/store.service';
import { ApiResponse } from '../../lib';
import { payoutStatuses } from '../../db/schema/store-payouts';

const generatePayoutSchema = z.object({
    storeId: z.string().uuid(),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

const generateBatchSchema = z.object({
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    confirm: z.boolean().optional(),
});

const listPayoutsSchema = z.object({
    storeId: z.string().uuid().optional(),
    status: z.enum(payoutStatuses).optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

const processPayoutSchema = z.object({
    status: z.enum(['paid', 'failed']),
    transactionReference: z.string().optional(), // Required if paid
    failureReason: z.string().optional(), // Required if failed
}).refine(data => {
    if (data.status === 'paid' && !data.transactionReference) return false;
    if (data.status === 'failed' && !data.failureReason) return false;
    return true;
}, {
    message: "transactionReference required for paid, failureReason required for failed",
});

export class StorePayoutController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listPayoutsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const { data, total } = await StorePayoutService.list(validation.data);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const payout = await StorePayoutService.getById(id);

        if (!payout) {
            return ApiResponse.notFound(c, 'Payout not found');
        }

        return ApiResponse.success(c, { message: 'Payout retrieved', data: payout });
    }

    // Manual generation for single store
    static async generate(c: Context) {
        const body = await c.req.json();
        const validation = generatePayoutSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const store = await StoreService.getById(validation.data.storeId);
        if (!store) {
            return ApiResponse.notFound(c, 'Store not found');
        }

        try {
            const payout = await StorePayoutService.create(
                validation.data.storeId,
                validation.data.periodStart,
                validation.data.periodEnd
            );
            return ApiResponse.created(c, payout, 'Payout generated successfully');
        } catch (error: any) {
            return ApiResponse.badRequest(c, error.message || 'Failed to generate payout');
        }
    }

    // Manual batch generation (Cron simulation)
    static async generateBatch(c: Context) {
        const body = await c.req.json();
        const validation = generateBatchSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        if (!validation.data.confirm) {
            return ApiResponse.success(c, {
                message: 'Dry run: Pass "confirm: true" to execute based on active stores',
            });
        }

        const stats = await StorePayoutService.generateForAllStores(
            validation.data.periodStart,
            validation.data.periodEnd
        );

        return ApiResponse.success(c, {
            message: 'Batch generation complete',
            data: stats,
        });
    }

    // Preview Stats (Dry Run for single store)
    static async previewStats(c: Context) {
        const storeId = c.req.query('storeId');
        const start = c.req.query('periodStart');
        const end = c.req.query('periodEnd');

        if (!storeId || !start || !end) {
            return ApiResponse.badRequest(c, 'Missing storeId, periodStart, or periodEnd');
        }

        try {
            const stats = await StorePayoutService.generateStats(storeId, start, end);
            return ApiResponse.success(c, { message: 'Payout preview', data: stats });
        } catch (error: any) {
            return ApiResponse.badRequest(c, error.message);
        }
    }

    // Process payout (Mark paid/failed)
    static async process(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = processPayoutSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const existing = await StorePayoutService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Payout not found');
        }

        let payout;
        if (validation.data.status === 'paid') {
            payout = await StorePayoutService.markAsPaid(id, validation.data.transactionReference!);
        } else {
            payout = await StorePayoutService.markAsFailed(id, validation.data.failureReason!);
        }

        return ApiResponse.success(c, { message: `Payout marked as ${validation.data.status}`, data: payout });
    }
}
