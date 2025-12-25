import { eq, and, desc, SQL, between, sql } from 'drizzle-orm';
import { db, payments } from '../../db';
import type { Payment, PaymentTransactionStatus } from '../../db/schema/payments';

export interface ListPaymentsFilters {
    orderId?: string;
    userId?: string;
    status?: PaymentTransactionStatus;
    cityId?: string;
    countryId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export class PaymentService {
    static async getById(id: string): Promise<Payment | null> {
        const payment = await db.query.payments.findFirst({
            where: eq(payments.id, id),
            with: {
                order: { columns: { id: true, orderNumber: true, status: true } },
                user: { columns: { id: true, username: true, email: true } },
                paymentOption: true,
                refundedByAdmin: { columns: { id: true, username: true } },
                city: true,
                country: true,
            },
        });
        return payment ?? null;
    }

    static async list(filters: ListPaymentsFilters): Promise<{ data: Payment[]; total: number }> {
        const {
            orderId,
            userId,
            status,
            cityId,
            countryId,
            dateFrom,
            dateTo,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];

        if (orderId) conditions.push(eq(payments.orderId, orderId));
        if (userId) conditions.push(eq(payments.userId, userId));
        if (status) conditions.push(eq(payments.status, status));
        if (cityId) conditions.push(eq(payments.cityId, cityId));
        if (countryId) conditions.push(eq(payments.countryId, countryId));

        if (dateFrom && dateTo) {
            conditions.push(between(payments.createdAt, new Date(dateFrom), new Date(dateTo)));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.payments.findMany({
                where: whereClause,
                with: {
                    order: { columns: { id: true, orderNumber: true } },
                    user: { columns: { id: true, username: true } },
                    paymentOption: { columns: { id: true, name: true } },
                },
                orderBy: desc(payments.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: payments.id }).from(payments).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async getStats(filters: { cityId?: string; countryId?: string; dateFrom?: string; dateTo?: string }) {
        const conditions: SQL[] = [];

        if (filters.cityId) conditions.push(eq(payments.cityId, filters.cityId));
        if (filters.countryId) conditions.push(eq(payments.countryId, filters.countryId));
        if (filters.dateFrom && filters.dateTo) {
            conditions.push(between(payments.createdAt, new Date(filters.dateFrom), new Date(filters.dateTo)));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

        const stats = await db.execute(sql`
            SELECT 
                COUNT(*) as total_payments,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
                COALESCE(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0) as refunded,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_amount,
                COALESCE(SUM(refunded_amount), 0) as total_refunded
            FROM payments
            WHERE ${whereClause}
        `);

        return stats[0];
    }
}
