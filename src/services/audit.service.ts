import { eq, and, desc, SQL, between } from 'drizzle-orm';
import { db, auditLogs } from '../db';
import type { AuditLog, ActorType, ActionType } from '../db/schema/audit-logs';

export interface LogAuditInput {
    actorType: ActorType;
    actorId?: string;
    actorEmail?: string;
    action: ActionType;
    tableName: string;
    recordId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    description?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
}

export interface ListAuditFilters {
    actorType?: ActorType;
    actorId?: string;
    action?: ActionType;
    tableName?: string;
    recordId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export class AuditService {
    /**
     * Log an action to audit trail
     */
    static async log(input: LogAuditInput): Promise<AuditLog> {
        const [log] = await db.insert(auditLogs).values({
            actorType: input.actorType,
            actorId: input.actorId,
            actorEmail: input.actorEmail,
            action: input.action,
            tableName: input.tableName,
            recordId: input.recordId,
            oldValues: input.oldValues,
            newValues: input.newValues,
            description: input.description,
            metadata: input.metadata,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            requestId: input.requestId,
        }).returning();

        return log;
    }

    /**
     * Get log by ID
     */
    static async getById(id: string): Promise<AuditLog | null> {
        const log = await db.query.auditLogs.findFirst({
            where: eq(auditLogs.id, id),
        });
        return log ?? null;
    }

    /**
     * List audit logs with filters
     */
    static async list(filters: ListAuditFilters): Promise<{ data: AuditLog[]; total: number }> {
        const {
            actorType,
            actorId,
            action,
            tableName,
            recordId,
            dateFrom,
            dateTo,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];

        if (actorType) conditions.push(eq(auditLogs.actorType, actorType));
        if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
        if (action) conditions.push(eq(auditLogs.action, action));
        if (tableName) conditions.push(eq(auditLogs.tableName, tableName));
        if (recordId) conditions.push(eq(auditLogs.recordId, recordId));

        if (dateFrom && dateTo) {
            conditions.push(between(auditLogs.createdAt, new Date(dateFrom), new Date(dateTo)));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.auditLogs.findMany({
                where: whereClause,
                orderBy: desc(auditLogs.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: auditLogs.id }).from(auditLogs).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    /**
     * Get logs for a specific record
     */
    static async getForRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
        const logs = await db.query.auditLogs.findMany({
            where: and(eq(auditLogs.tableName, tableName), eq(auditLogs.recordId, recordId)),
            orderBy: desc(auditLogs.createdAt),
        });
        return logs;
    }

    /**
     * Get logs for a specific actor
     */
    static async getForActor(actorType: ActorType, actorId: string, options?: { limit?: number }): Promise<AuditLog[]> {
        const logs = await db.query.auditLogs.findMany({
            where: and(eq(auditLogs.actorType, actorType), eq(auditLogs.actorId, actorId)),
            orderBy: desc(auditLogs.createdAt),
            limit: options?.limit ?? 100,
        });
        return logs;
    }
}
