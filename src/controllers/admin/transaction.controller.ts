import type { Context } from 'hono';
import { z } from 'zod';
import { TransactionService } from '../../services/admin/transaction.service';
import { ApiResponse } from '../../lib';
import { transactionTypes, transactionStatuses } from '../../db/schema/transactions';

const listTransactionsSchema = z.object({
    senderId: z.string().uuid().optional(),
    receiverId: z.string().uuid().optional(),
    type: z.enum(transactionTypes).optional(),
    status: z.enum(transactionStatuses).optional(),
    cityId: z.string().uuid().optional(),
    countryId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

export class TransactionController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listTransactionsSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const geoFilter = c.get('geoFilter');
        const filters = { ...validation.data, ...geoFilter };

        const { data, total } = await TransactionService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const transaction = await TransactionService.getById(id);

        if (!transaction) {
            return ApiResponse.notFound(c, 'Transaction not found');
        }

        const geoFilter = c.get('geoFilter');
        if ((geoFilter.cityId && transaction.cityId && transaction.cityId !== geoFilter.cityId) ||
            (geoFilter.countryId && transaction.countryId && transaction.countryId !== geoFilter.countryId)) {
            return ApiResponse.forbidden(c, 'Access denied');
        }

        return ApiResponse.success(c, { message: 'Transaction details', data: transaction });
    }

    static async getByReference(c: Context) {
        const reference = c.req.param('reference');
        const transaction = await TransactionService.getByReference(reference);

        if (!transaction) {
            return ApiResponse.notFound(c, 'Transaction not found');
        }

        return ApiResponse.success(c, { message: 'Transaction details', data: transaction });
    }
}
