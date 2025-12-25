import type { Context } from 'hono';
import { z } from 'zod';
import { PaymentService } from '../../services/admin/payment.service';
import { ApiResponse } from '../../lib';
import { paymentTransactionStatuses } from '../../db/schema/payments';

const listPaymentsSchema = z.object({
    orderId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    status: z.enum(paymentTransactionStatuses).optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

export class PaymentController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listPaymentsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await PaymentService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const payment = await PaymentService.getById(id);

        if (!payment) {
            return ApiResponse.notFound(c, 'Payment not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && payment.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && payment.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Payment details', data: payment });
    }

    static async getStats(c: Context) {
        const query = c.req.query();
        const geoFilter = c.get('geoFilter');

        const stats = await PaymentService.getStats({
            ...geoFilter,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
        });

        return ApiResponse.success(c, { message: 'Payment stats', data: stats });
    }
}
