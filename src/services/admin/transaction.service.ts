import { eq, and, desc, SQL, between } from 'drizzle-orm';
import { db, transactions } from '../../db';
import type { Transaction, TransactionType, TransactionStatus } from '../../db/schema/transactions';

export interface ListTransactionsFilters {
    senderId?: string;
    receiverId?: string;
    type?: TransactionType;
    status?: TransactionStatus;
    cityId?: string;
    countryId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export class TransactionService {
    static async getById(id: string): Promise<Transaction | null> {
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, id),
            with: {
                sender: { columns: { id: true, username: true, email: true } },
                receiver: { columns: { id: true, username: true, email: true } },
                city: true,
                country: true,
            },
        });
        return transaction ?? null;
    }

    static async getByReference(reference: string): Promise<Transaction | null> {
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.reference, reference),
            with: {
                sender: true,
                receiver: true,
            },
        });
        return transaction ?? null;
    }

    static async list(filters: ListTransactionsFilters): Promise<{ data: Transaction[]; total: number }> {
        const {
            senderId,
            receiverId,
            type,
            status,
            cityId,
            countryId,
            dateFrom,
            dateTo,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];

        if (senderId) conditions.push(eq(transactions.senderId, senderId));
        if (receiverId) conditions.push(eq(transactions.receiverId, receiverId));
        if (type) conditions.push(eq(transactions.type, type));
        if (status) conditions.push(eq(transactions.status, status));
        if (cityId) conditions.push(eq(transactions.cityId, cityId));
        if (countryId) conditions.push(eq(transactions.countryId, countryId));

        if (dateFrom && dateTo) {
            conditions.push(between(transactions.createdAt, new Date(dateFrom), new Date(dateTo)));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.transactions.findMany({
                where: whereClause,
                with: {
                    sender: { columns: { id: true, username: true } },
                    receiver: { columns: { id: true, username: true } },
                },
                orderBy: desc(transactions.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: transactions.id }).from(transactions).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }
}
