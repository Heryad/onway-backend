import type { Context } from 'hono';
import { z } from 'zod';
import { AuditService } from '../../services/audit.service';
import { ApiResponse } from '../../lib';
import { actorTypes, actionTypes } from '../../db/schema/audit-logs';

const listAuditSchema = z.object({
    actorType: z.enum(actorTypes).optional(),
    actorId: z.string().uuid().optional(),
    action: z.enum(actionTypes).optional(),
    tableName: z.string().optional(),
    recordId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
});

export class AuditController {
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listAuditSchema.safeParse(query);

        if (!validation.success) {
            return ApiResponse.validationError(c, validation.error.flatten().fieldErrors as Record<string, string[]>);
        }

        const { data, total } = await AuditService.list(validation.data);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    static async getById(c: Context) {
        const id = c.req.param('id');
        const log = await AuditService.getById(id);

        if (!log) {
            return ApiResponse.notFound(c, 'Audit log not found');
        }

        return ApiResponse.success(c, { message: 'Audit log', data: log });
    }

    static async getForRecord(c: Context) {
        const { table, recordId } = c.req.param();

        if (!table || !recordId) {
            return ApiResponse.badRequest(c, 'Table and recordId are required');
        }

        const logs = await AuditService.getForRecord(table, recordId);
        return ApiResponse.success(c, { message: 'Record audit history', data: logs });
    }

    static async getForAdmin(c: Context) {
        const adminId = c.req.param('adminId');

        if (!adminId) {
            return ApiResponse.badRequest(c, 'adminId is required');
        }

        const logs = await AuditService.getForActor('admin', adminId, { limit: 100 });
        return ApiResponse.success(c, { message: 'Admin activity', data: logs });
    }
}
