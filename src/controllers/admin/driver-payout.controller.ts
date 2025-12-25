import type { Context } from 'hono';
import { z } from 'zod';
import { DriverPayoutService } from '../../services/admin/driver-payout.service';
import { DriverService } from '../../services/admin/driver.service';
import { ApiResponse } from '../../lib';
import { driverPayoutStatuses } from '../../db/schema/driver-payouts';

const generatePayoutSchema = z.object({
    driverId: z.string().uuid(),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const generateBatchSchema = z.object({
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    confirm: z.boolean().optional(),
});

const listPayoutsSchema = z.object({
    driverId: z.string().uuid().optional(),
    status: z.enum(driverPayoutStatuses).optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

const processPayoutSchema = z.object({
    status: z.enum(['paid', 'failed']),
    transactionReference: z.string().optional(),
    failureReason: z.string().optional(),
}).refine(data => {
    if (data.status === 'paid' && !data.transactionReference) return false;
    if (data.status === 'failed' && !data.failureReason) return false;
    return true;
}, {
    message: "transactionReference required for paid, failureReason required for failed",
});

export class DriverPayoutController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listPayoutsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const { data, total } = await DriverPayoutService.list(validation.data);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const payout = await DriverPayoutService.getById(id);

        if (!payout) {
            return ApiResponse.notFound(c, 'Payout not found');
        }

        return ApiResponse.success(c, { message: 'Payout retrieved', data: payout });
    }

    // Manual generation for single driver
    static async generate(c: Context) {
        const body = await c.req.json();
        const validation = generatePayoutSchema.safeParse(body);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const driver = await DriverService.getById(validation.data.driverId);
        if (!driver) {
            return ApiResponse.notFound(c, 'Driver not found');
        }

        try {
            const payout = await DriverPayoutService.create(
                validation.data.driverId,
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
                message: 'Dry run: Pass "confirm: true" to execute based on active drivers',
            });
        }

        const stats = await DriverPayoutService.generateForAllDrivers(
            validation.data.periodStart,
            validation.data.periodEnd
        );

        return ApiResponse.success(c, {
            message: 'Batch generation complete',
            data: stats,
        });
    }

    // Preview Stats (Dry Run for single driver)
    static async previewStats(c: Context) {
        const driverId = c.req.query('driverId');
        const start = c.req.query('periodStart');
        const end = c.req.query('periodEnd');

        if (!driverId || !start || !end) {
            return ApiResponse.badRequest(c, 'Missing driverId, periodStart, or periodEnd');
        }

        try {
            const stats = await DriverPayoutService.generateStats(driverId, start, end);
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

        const existing = await DriverPayoutService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Payout not found');
        }

        let payout;
        if (validation.data.status === 'paid') {
            payout = await DriverPayoutService.markAsPaid(id, validation.data.transactionReference!);
        } else {
            payout = await DriverPayoutService.markAsFailed(id, validation.data.failureReason!);
        }

        return ApiResponse.success(c, { message: `Payout marked as ${validation.data.status}`, data: payout });
    }
}
