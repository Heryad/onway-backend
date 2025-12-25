import { eq, and, desc, asc, SQL, between, sql } from 'drizzle-orm';
import { db, storePayouts, orders, stores } from '../../db';
import type { StorePayout, NewStorePayout, PayoutStatus } from '../../db/schema/store-payouts';
import { logger } from '../../lib/logger';
import { StoreService } from './store.service';

export interface CreatePayoutInput {
    storeId: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string;   // YYYY-MM-DD
    grossAmount: string;
    commissionRate: string;
    commissionAmount: string;
    adjustments?: string;
    netAmount: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
}

export interface ListPayoutsFilters {
    storeId?: string;
    status?: PayoutStatus;
    periodStart?: string;
    periodEnd?: string;
    page?: number;
    limit?: number;
}

export interface PayoutStats {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
}

export class StorePayoutService {
    // Generate stats/dry-run
    static async generateStats(storeId: string, periodStart: string, periodEnd: string): Promise<PayoutStats> {
        // Get store for commission rate
        const store = await StoreService.getById(storeId);
        if (!store) throw new Error('Store not found');
        const commissionRate = parseFloat(store.commissionRate || '15.00');

        // Query orders
        // Note: Using subtotal for calculation as simplified base
        // Filter: storeId + created_at in range + status delivered/cancelled
        // We only pay for 'delivered' orders usually.

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999);

        const orderRecords = await db.query.orders.findMany({
            where: and(
                eq(orders.storeId, storeId),
                between(orders.createdAt, start, end)
            ),
            columns: {
                id: true,
                status: true,
                subtotal: true,
            },
        });

        let totalOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0;
        let grossAmount = 0;

        for (const order of orderRecords) {
            totalOrders++;
            if (order.status === 'delivered') {
                completedOrders++;
                grossAmount += parseFloat(order.subtotal);
            } else if (order.status === 'cancelled') {
                cancelledOrders++;
            }
        }

        const commissionAmount = (grossAmount * commissionRate) / 100;
        const netAmount = grossAmount - commissionAmount;

        return {
            totalOrders,
            completedOrders,
            cancelledOrders,
            grossAmount: parseFloat(grossAmount.toFixed(2)),
            commissionAmount: parseFloat(commissionAmount.toFixed(2)),
            netAmount: parseFloat(netAmount.toFixed(2)),
        };
    }

    // Create payout record
    static async create(storeId: string, periodStart: string, periodEnd: string): Promise<StorePayout> {
        // Check if payout already exists for this period
        const existing = await db.query.storePayouts.findFirst({
            where: and(
                eq(storePayouts.storeId, storeId),
                eq(storePayouts.periodStart, periodStart),
                eq(storePayouts.periodEnd, periodEnd)
            ),
        });

        if (existing) {
            throw new Error(`Payout for store ${storeId} already exists for this period`);
        }

        const stats = await this.generateStats(storeId, periodStart, periodEnd);
        const store = await StoreService.getById(storeId);

        const [payout] = await db.insert(storePayouts).values({
            storeId,
            periodStart,
            periodEnd,
            totalOrders: stats.totalOrders,
            completedOrders: stats.completedOrders,
            cancelledOrders: stats.cancelledOrders,
            grossAmount: stats.grossAmount.toFixed(2),
            commissionRate: store?.commissionRate || '15.00',
            commissionAmount: stats.commissionAmount.toFixed(2),
            netAmount: stats.netAmount.toFixed(2),
            status: 'pending',
        }).returning();

        logger.info({ payoutId: payout.id, storeId }, 'Store payout created');
        return payout;
    }

    // Process/Mark as paid
    static async markAsPaid(id: string, transactionReference: string): Promise<StorePayout | null> {
        const [payout] = await db.update(storePayouts)
            .set({
                status: 'paid',
                transactionReference,
                paidAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(storePayouts.id, id))
            .returning();

        return payout ?? null;
    }

    // Mark as failed
    static async markAsFailed(id: string, reason: string): Promise<StorePayout | null> {
        const [payout] = await db.update(storePayouts)
            .set({
                status: 'failed',
                failureReason: reason,
                updatedAt: new Date(),
            })
            .where(eq(storePayouts.id, id))
            .returning();

        return payout ?? null;
    }

    static async getById(id: string): Promise<StorePayout | null> {
        const payout = await db.query.storePayouts.findFirst({
            where: eq(storePayouts.id, id),
            with: { store: true },
        });
        return payout ?? null;
    }

    static async list(filters: ListPayoutsFilters): Promise<{ data: StorePayout[]; total: number }> {
        const { storeId, status, periodStart, periodEnd, page = 1, limit = 50 } = filters;

        const conditions: SQL[] = [];

        if (storeId) conditions.push(eq(storePayouts.storeId, storeId));
        if (status) conditions.push(eq(storePayouts.status, status));
        if (periodStart) conditions.push(eq(storePayouts.periodStart, periodStart));
        if (periodEnd) conditions.push(eq(storePayouts.periodEnd, periodEnd));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.storePayouts.findMany({
                where: whereClause,
                with: { store: true },
                orderBy: desc(storePayouts.periodStart),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: storePayouts.id }).from(storePayouts).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    // Helper for cron: Generate for all active stores
    static async generateForAllStores(periodStart: string, periodEnd: string): Promise<{ created: number; errors: number }> {
        const activeStores = await db.query.stores.findMany({
            where: eq(stores.isActive, true),
        });

        let created = 0;
        let errors = 0;

        for (const store of activeStores) {
            try {
                // Check if already exists to avoid duplicates
                const existing = await db.query.storePayouts.findFirst({
                    where: and(
                        eq(storePayouts.storeId, store.id),
                        eq(storePayouts.periodStart, periodStart),
                        eq(storePayouts.periodEnd, periodEnd)
                    ),
                });

                if (!existing) {
                    await this.create(store.id, periodStart, periodEnd);
                    created++;
                }
            } catch (err) {
                logger.error({ storeId: store.id, err }, 'Failed to auto-generate payout');
                errors++;
            }
        }

        return { created, errors };
    }
}
