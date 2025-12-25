import { eq, and, desc, asc, SQL, between, sql } from 'drizzle-orm';
import { db, driverPayouts, driverOrders, drivers } from '../../db';
import type { DriverPayout, NewDriverPayout, DriverPayoutStatus } from '../../db/schema/driver-payouts';
import { logger } from '../../lib/logger';
import { DriverService } from './driver.service';

export interface CreateDriverPayoutInput {
    driverId: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string;   // YYYY-MM-DD
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    totalDistanceKm: string;
    baseFees: string;
    distanceBonuses: string;
    tips: string;
    incentives?: string;
    deductions?: string;
    netAmount: string;
}

export interface ListDriverPayoutsFilters {
    driverId?: string;
    status?: DriverPayoutStatus;
    periodStart?: string;
    periodEnd?: string;
    page?: number;
    limit?: number;
}

export interface DriverPayoutStats {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    totalDistanceKm: number;
    baseFees: number;
    distanceBonuses: number;
    tips: number;
    netAmount: number; // Sum of components (ignoring manual incentives/deductions for initial stat)
}

export class DriverPayoutService {
    // Generate stats/dry-run
    static async generateStats(driverId: string, periodStart: string, periodEnd: string): Promise<DriverPayoutStats> {
        // Verify driver exists
        const driver = await DriverService.getById(driverId);
        if (!driver) throw new Error('Driver not found');

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999);

        // Query driver orders
        const orderRecords = await db.query.driverOrders.findMany({
            where: and(
                eq(driverOrders.driverId, driverId),
                between(driverOrders.createdAt, start, end)
            ),
            columns: {
                id: true,
                status: true,
                baseFee: true,
                distanceBonus: true,
                tipAmount: true,
                distanceKm: true,
            },
        });

        let totalDeliveries = 0;
        let completedDeliveries = 0;
        let cancelledDeliveries = 0;

        let totalDistanceKm = 0;
        let baseFees = 0;
        let distanceBonuses = 0;
        let tips = 0;

        for (const order of orderRecords) {
            totalDeliveries++;

            if (order.status === 'delivered') {
                completedDeliveries++;
                // Sum up financials
                baseFees += parseFloat(order.baseFee || '0');
                distanceBonuses += parseFloat(order.distanceBonus || '0');
                tips += parseFloat(order.tipAmount || '0');
                totalDistanceKm += parseFloat(order.distanceKm || '0');
            } else if (order.status === 'cancelled') {
                cancelledDeliveries++;
                // Check if any earnings apply to cancelled? Assuming 0 for now.
            }
        }

        const netAmount = baseFees + distanceBonuses + tips;

        return {
            totalDeliveries,
            completedDeliveries,
            cancelledDeliveries,
            totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
            baseFees: parseFloat(baseFees.toFixed(2)),
            distanceBonuses: parseFloat(distanceBonuses.toFixed(2)),
            tips: parseFloat(tips.toFixed(2)),
            netAmount: parseFloat(netAmount.toFixed(2)),
        };
    }

    // Create payout record
    static async create(driverId: string, periodStart: string, periodEnd: string): Promise<DriverPayout> {
        // Check if payout already exists
        const existing = await db.query.driverPayouts.findFirst({
            where: and(
                eq(driverPayouts.driverId, driverId),
                eq(driverPayouts.periodStart, periodStart),
                eq(driverPayouts.periodEnd, periodEnd)
            ),
        });

        if (existing) {
            throw new Error(`Payout for driver ${driverId} already exists for this period`);
        }

        const stats = await this.generateStats(driverId, periodStart, periodEnd);

        const [payout] = await db.insert(driverPayouts).values({
            driverId,
            periodStart,
            periodEnd,
            totalDeliveries: stats.totalDeliveries,
            completedDeliveries: stats.completedDeliveries,
            cancelledDeliveries: stats.cancelledDeliveries,
            totalDistanceKm: stats.totalDistanceKm.toFixed(2),
            baseFees: stats.baseFees.toFixed(2),
            distanceBonuses: stats.distanceBonuses.toFixed(2),
            tips: stats.tips.toFixed(2),
            incentives: '0.00',
            deductions: '0.00',
            netAmount: stats.netAmount.toFixed(2),
            status: 'pending',
        }).returning();

        logger.info({ payoutId: payout.id, driverId }, 'Driver payout created');
        return payout;
    }

    // Process/Mark as paid
    static async markAsPaid(id: string, transactionReference: string): Promise<DriverPayout | null> {
        const [payout] = await db.update(driverPayouts)
            .set({
                status: 'paid',
                transactionReference,
                paidAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(driverPayouts.id, id))
            .returning();

        return payout ?? null;
    }

    // Mark as failed
    static async markAsFailed(id: string, reason: string): Promise<DriverPayout | null> {
        const [payout] = await db.update(driverPayouts)
            .set({
                status: 'failed',
                failureReason: reason,
                updatedAt: new Date(),
            })
            .where(eq(driverPayouts.id, id))
            .returning();

        return payout ?? null;
    }

    static async getById(id: string): Promise<DriverPayout | null> {
        const payout = await db.query.driverPayouts.findFirst({
            where: eq(driverPayouts.id, id),
            with: { driver: true },
        });
        return payout ?? null;
    }

    static async list(filters: ListDriverPayoutsFilters): Promise<{ data: DriverPayout[]; total: number }> {
        const { driverId, status, periodStart, periodEnd, page = 1, limit = 50 } = filters;

        const conditions: SQL[] = [];

        if (driverId) conditions.push(eq(driverPayouts.driverId, driverId));
        if (status) conditions.push(eq(driverPayouts.status, status));
        if (periodStart) conditions.push(eq(driverPayouts.periodStart, periodStart));
        if (periodEnd) conditions.push(eq(driverPayouts.periodEnd, periodEnd));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.driverPayouts.findMany({
                where: whereClause,
                with: { driver: true },
                orderBy: desc(driverPayouts.periodStart),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: driverPayouts.id }).from(driverPayouts).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    // Generate for all active drivers
    static async generateForAllDrivers(periodStart: string, periodEnd: string): Promise<{ created: number; errors: number }> {
        const activeDrivers = await db.query.drivers.findMany({
            where: eq(drivers.isActive, true),
        });

        let created = 0;
        let errors = 0;

        for (const driver of activeDrivers) {
            try {
                const existing = await db.query.driverPayouts.findFirst({
                    where: and(
                        eq(driverPayouts.driverId, driver.id),
                        eq(driverPayouts.periodStart, periodStart),
                        eq(driverPayouts.periodEnd, periodEnd)
                    ),
                });

                if (!existing) {
                    await this.create(driver.id, periodStart, periodEnd);
                    created++;
                }
            } catch (err) {
                logger.error({ driverId: driver.id, err }, 'Failed to auto-generate driver payout');
                errors++;
            }
        }

        return { created, errors };
    }
}
