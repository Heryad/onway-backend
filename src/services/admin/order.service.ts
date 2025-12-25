import { eq, and, desc, asc, SQL, between, sql } from 'drizzle-orm';
import { db, orders, orderItems, orderStatusHistory, driverOrders, stores } from '../../db';
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../db/schema/orders';
import type { OrderItem } from '../../db/schema/order-items';
import type { OrderStatusHistory } from '../../db/schema/order-status-history';

export interface ListOrdersFilters {
    storeId?: string;
    userId?: string;
    cityId?: string;
    countryId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    dateFrom?: string;
    dateTo?: string;
    orderNumber?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'total' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export class OrderService {
    static async getById(id: string): Promise<Order | null> {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, id),
            with: {
                store: {
                    columns: { id: true, name: true, avatar: true },
                },
                user: {
                    columns: { id: true, username: true, email: true, phone: true, avatar: true },
                },
                city: true,
                country: true,
            },
        });
        return order ?? null;
    }

    static async list(filters: ListOrdersFilters): Promise<{ data: Order[]; total: number }> {
        const {
            storeId,
            userId,
            cityId,
            countryId,
            status,
            paymentStatus,
            paymentMethod,
            dateFrom,
            dateTo,
            orderNumber,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (storeId) conditions.push(eq(orders.storeId, storeId));
        if (userId) conditions.push(eq(orders.userId, userId));
        if (cityId) conditions.push(eq(orders.cityId, cityId));
        if (countryId) conditions.push(eq(orders.countryId, countryId));
        if (status) conditions.push(eq(orders.status, status));
        if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus));
        if (paymentMethod) conditions.push(eq(orders.paymentMethod, paymentMethod));

        if (orderNumber) {
            conditions.push(sql`${orders.orderNumber} ILIKE ${`%${orderNumber}%`}`);
        }

        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            conditions.push(between(orders.createdAt, from, to));
        } else if (dateFrom) {
            conditions.push(sql`${orders.createdAt} >= ${new Date(dateFrom)}`);
        } else if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            conditions.push(sql`${orders.createdAt} <= ${to}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.orders.findMany({
                where: whereClause,
                with: {
                    store: {
                        columns: { id: true, name: true },
                    },
                    user: {
                        columns: { id: true, username: true, email: true },
                    },
                    city: {
                        columns: { id: true, name: true },
                    },
                },
                orderBy: orderFn(orders[sortBy] || orders.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: orders.id }).from(orders).where(whereClause),
        ]);

        return { data: data as Order[], total: countResult.length };
    }

    static async getItems(orderId: string): Promise<OrderItem[]> {
        const items = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, orderId),
            with: {
                storeItem: {
                    columns: { id: true, name: true },
                },
            },
        });
        return items;
    }

    static async getStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
        const history = await db.query.orderStatusHistory.findMany({
            where: eq(orderStatusHistory.orderId, orderId),
            orderBy: desc(orderStatusHistory.createdAt),
        });
        return history;
    }

    static async getByOrderNumber(orderNumber: string): Promise<Order | null> {
        const order = await db.query.orders.findFirst({
            where: eq(orders.orderNumber, orderNumber),
            with: {
                store: true,
                user: true,
                city: true,
                country: true,
            },
        });
        return order ?? null;
    }

    // ========== Phase 2: Order Operations ==========

    static async updateStatus(
        id: string,
        newStatus: OrderStatus,
        changedByType: 'admin' | 'system',
        changedById?: string,
        notes?: string
    ): Promise<Order | null> {
        const existing = await this.getById(id);
        if (!existing) return null;

        const fromStatus = existing.status;

        // Update timestamp based on status
        const timestamps: Partial<Record<OrderStatus, string>> = {
            accepted: 'acceptedAt',
            preparing: 'preparingAt',
            ready_for_pickup: 'readyAt',
            picked_up: 'pickedUpAt',
            delivered: 'deliveredAt',
            cancelled: 'cancelledAt',
        };

        const updateData: any = {
            status: newStatus,
            updatedAt: new Date(),
        };

        const timestampField = timestamps[newStatus];
        if (timestampField) {
            updateData[timestampField] = new Date();
        }

        const [order] = await db.update(orders)
            .set(updateData)
            .where(eq(orders.id, id))
            .returning();

        // Log to status history
        await db.insert(orderStatusHistory).values({
            orderId: id,
            fromStatus,
            toStatus: newStatus,
            changedByType,
            changedById,
            notes,
        });

        // Trigger driver dispatch when order is accepted
        if (newStatus === 'accepted') {
            const { dispatchQueue } = await import('../../jobs/queues');
            const { JOB_NAMES } = await import('../../jobs/definitions');

            // Get store location
            const store = await db.query.stores.findFirst({
                where: eq(stores.id, order.storeId),
                columns: { geoLocation: true },
            });

            await dispatchQueue.add(
                JOB_NAMES.FIND_DRIVER,
                {
                    orderId: id,
                    storeId: order.storeId,
                    cityId: order.cityId,
                    storeLocation: store?.geoLocation ?? undefined,
                    attempt: 1,
                },
                { priority: 1 } // High priority
            );
        }

        return order;
    }

    static async cancel(
        id: string,
        reason: string,
        cancelledBy: 'user' | 'store' | 'driver' | 'admin' | 'system',
        notes?: string
    ): Promise<Order | null> {
        const existing = await this.getById(id);
        if (!existing) return null;

        const fromStatus = existing.status;

        const [order] = await db.update(orders)
            .set({
                status: 'cancelled',
                cancelReason: reason as any,
                cancelledBy,
                cancellationNotes: notes,
                cancelledAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, id))
            .returning();

        // Log to history
        await db.insert(orderStatusHistory).values({
            orderId: id,
            fromStatus,
            toStatus: 'cancelled',
            changedByType: cancelledBy === 'admin' ? 'admin' : cancelledBy === 'system' ? 'system' : cancelledBy,
            notes: `Reason: ${reason}. ${notes || ''}`,
        });

        return order;
    }

    static async addNote(id: string, noteType: 'store' | 'delivery', note: string): Promise<Order | null> {
        const updateData: any = { updatedAt: new Date() };

        if (noteType === 'store') {
            updateData.storeNotes = note;
        } else {
            updateData.deliveryNotes = note;
        }

        const [order] = await db.update(orders)
            .set(updateData)
            .where(eq(orders.id, id))
            .returning();

        return order ?? null;
    }

    // ========== Phase 3: Dispatch & Assignment ==========

    static async getAssignedDriver(orderId: string) {
        const assignment = await db.query.driverOrders.findFirst({
            where: and(
                eq(driverOrders.orderId, orderId),
                sql`${driverOrders.status} NOT IN ('rejected', 'reassigned', 'cancelled')`
            ),
            with: {
                driver: {
                    columns: { id: true, username: true, phone: true, vehicleType: true, avatar: true },
                },
            },
            orderBy: desc(driverOrders.assignedAt),
        });
        return assignment ?? null;
    }

    static async assignDriver(orderId: string, driverId: string): Promise<any> {
        // Check if already assigned
        const existing = await this.getAssignedDriver(orderId);
        if (existing) {
            throw new Error('Order already has an assigned driver. Use reassign instead.');
        }

        const [assignment] = await db.insert(driverOrders).values({
            orderId,
            driverId,
            status: 'assigned',
        }).returning();

        // Update order status
        await this.updateStatus(orderId, 'driver_assigned', 'admin');

        return assignment;
    }

    static async reassignDriver(orderId: string, newDriverId: string, reason?: string): Promise<any> {
        // Mark old assignment as reassigned
        const existing = await this.getAssignedDriver(orderId);
        if (existing) {
            await db.update(driverOrders)
                .set({ status: 'reassigned', updatedAt: new Date() })
                .where(eq(driverOrders.id, existing.id));
        }

        // Create new assignment
        const [assignment] = await db.insert(driverOrders).values({
            orderId,
            driverId: newDriverId,
            status: 'assigned',
        }).returning();

        return assignment;
    }

    // ========== Phase 4: Refunds ==========

    static async initiateRefund(orderId: string, refundType: 'full' | 'partial', amount?: string): Promise<Order | null> {
        const order = await this.getById(orderId);
        if (!order) return null;

        const newPaymentStatus = refundType === 'full' ? 'refunded' : 'partially_refunded';

        const [updated] = await db.update(orders)
            .set({
                paymentStatus: newPaymentStatus,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // Log to history
        await db.insert(orderStatusHistory).values({
            orderId,
            fromStatus: order.status,
            toStatus: order.status, // Status doesn't change, just payment status
            changedByType: 'admin',
            notes: `Refund initiated: ${refundType}${amount ? ` - Amount: ${amount}` : ''}`,
        });

        return updated;
    }
}
