import { eq, and, between, sql, SQL } from 'drizzle-orm';
import {
    db,
    orders,
    payments,
    stores,
    users,
    drivers,
    reviews,
    transactions,
    promoCodes,
    promoCodeUsage,
    driverPayouts,
    storePayouts,
    supportTickets,
    categories,
    sections,
} from '../../db';

export interface AnalyticsFilters {
    countryId?: string;
    cityId?: string;
    startDate: string;
    endDate: string;
}

interface GeoFilters {
    cityId?: string;
    countryId?: string;
}

export class AnalyticsService {
    /**
     * Get comprehensive analytics data
     */
    static async getAnalytics(filters: AnalyticsFilters) {
        const { countryId, cityId, startDate, endDate } = filters;

        // Parse dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const geoFilters: GeoFilters = { cityId, countryId };

        // Run all analytics queries in parallel
        const [
            orderStats,
            revenueStats,
            userStats,
            storeStats,
            driverStats,
            paymentStats,
            reviewStats,
            supportStats,
            promoCodeStats,
            transactionStats,
            categoryPerformance,
            sectionPerformance,
            topStores,
            topDrivers,
            orderStatusBreakdown,
            paymentMethodBreakdown,
            dailyMetrics,
        ] = await Promise.all([
            this.getOrderStats(start, end, geoFilters),
            this.getRevenueStats(start, end, geoFilters),
            this.getUserStats(start, end, geoFilters),
            this.getStoreStats(start, end, geoFilters),
            this.getDriverStats(start, end, geoFilters),
            this.getPaymentStats(start, end, geoFilters),
            this.getReviewStats(start, end, geoFilters),
            this.getSupportStats(start, end, geoFilters),
            this.getPromoCodeStats(start, end, geoFilters),
            this.getTransactionStats(start, end, geoFilters),
            this.getCategoryPerformance(start, end, geoFilters),
            this.getSectionPerformance(start, end, geoFilters),
            this.getTopStores(start, end, geoFilters),
            this.getTopDrivers(start, end, geoFilters),
            this.getOrderStatusBreakdown(start, end, geoFilters),
            this.getPaymentMethodBreakdown(start, end, geoFilters),
            this.getDailyMetrics(start, end, geoFilters),
        ]);

        return {
            period: {
                startDate: startDate,
                endDate: endDate,
                ...(cityId && { cityId }),
                ...(countryId && { countryId }),
            },
            orders: orderStats,
            revenue: revenueStats,
            users: userStats,
            stores: storeStats,
            drivers: driverStats,
            payments: paymentStats,
            reviews: reviewStats,
            support: supportStats,
            promoCodes: promoCodeStats,
            transactions: transactionStats,
            performance: {
                categories: categoryPerformance,
                sections: sectionPerformance,
                topStores,
                topDrivers,
            },
            breakdowns: {
                orderStatus: orderStatusBreakdown,
                paymentMethods: paymentMethodBreakdown,
            },
            trends: {
                daily: dailyMetrics,
            },
        };
    }

    /**
     * Order Statistics
     */
    private static async getOrderStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(orders.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalOrders: sql<number>`count(*)::int`,
                completedOrders: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
                cancelledOrders: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
                pendingOrders: sql<number>`count(*) filter (where ${orders.status} NOT IN ('delivered', 'cancelled'))::int`,
                avgOrderValue: sql<number>`avg(${orders.total})::numeric(10,2)`,
                totalOrderValue: sql<number>`sum(${orders.total})::numeric(10,2)`,
            })
            .from(orders)
            .where(whereClause);

        return result[0] || {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            pendingOrders: 0,
            avgOrderValue: 0,
            totalOrderValue: 0,
        };
    }

    /**
     * Revenue Statistics
     */
    private static async getRevenueStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [
            between(orders.createdAt, start, end),
            eq(orders.status, 'delivered'),
        ];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = and(...conditions);

        const result = await db
            .select({
                totalRevenue: sql<number>`sum(${orders.total})::numeric(10,2)`,
                totalSubtotal: sql<number>`sum(${orders.subtotal})::numeric(10,2)`,
                totalDeliveryFees: sql<number>`sum(${orders.deliveryFee})::numeric(10,2)`,
                totalServiceFees: sql<number>`sum(${orders.serviceFee})::numeric(10,2)`,
                totalTaxAmount: sql<number>`sum(${orders.taxAmount})::numeric(10,2)`,
                totalTips: sql<number>`sum(${orders.tipAmount})::numeric(10,2)`,
                totalDiscounts: sql<number>`sum(${orders.discountAmount})::numeric(10,2)`,
            })
            .from(orders)
            .where(whereClause);

        return result[0] || {
            totalRevenue: 0,
            totalSubtotal: 0,
            totalDeliveryFees: 0,
            totalServiceFees: 0,
            totalTaxAmount: 0,
            totalTips: 0,
            totalDiscounts: 0,
        };
    }

    /**
     * User Statistics
     */
    private static async getUserStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const newUsersConditions: SQL[] = [between(users.createdAt, start, end)];
        const totalUsersConditions: SQL[] = [];

        if (geoFilters.cityId) {
            newUsersConditions.push(eq(users.cityId, geoFilters.cityId));
            totalUsersConditions.push(eq(users.cityId, geoFilters.cityId));
        } else if (geoFilters.countryId) {
            newUsersConditions.push(eq(users.countryId, geoFilters.countryId));
            totalUsersConditions.push(eq(users.countryId, geoFilters.countryId));
        }

        const newUsersWhereClause = newUsersConditions.length > 0 ? and(...newUsersConditions) : undefined;
        const totalUsersWhereClause = totalUsersConditions.length > 0 ? and(...totalUsersConditions) : undefined;

        const [newUsersResult, totalUsersResult, primeUsersResult] = await Promise.all([
            db.select({ count: sql<number>`count(*)::int` }).from(users).where(newUsersWhereClause),
            db.select({ count: sql<number>`count(*)::int` }).from(users).where(totalUsersWhereClause),
            db.select({ count: sql<number>`count(*) filter (where ${users.isPrime} = true)::int` })
                .from(users)
                .where(totalUsersWhereClause),
        ]);

        return {
            newUsers: newUsersResult[0]?.count || 0,
            totalUsers: totalUsersResult[0]?.count || 0,
            primeUsers: primeUsersResult[0]?.count || 0,
        };
    }

    /**
     * Store Statistics
     */
    private static async getStoreStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [];

        if (geoFilters.cityId) conditions.push(eq(stores.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(stores.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalStores: sql<number>`count(*)::int`,
                activeStores: sql<number>`count(*) filter (where ${stores.isActive} = true)::int`,
                primeStores: sql<number>`count(*) filter (where ${stores.isPrime} = true)::int`,
                sponsoredStores: sql<number>`count(*) filter (where ${stores.isSponsored} = true)::int`,
                featuredStores: sql<number>`count(*) filter (where ${stores.isFeatured} = true)::int`,
                avgRating: sql<number>`avg(${stores.rating})::numeric(2,1)`,
            })
            .from(stores)
            .where(whereClause);

        return result[0] || {
            totalStores: 0,
            activeStores: 0,
            primeStores: 0,
            sponsoredStores: 0,
            featuredStores: 0,
            avgRating: 0,
        };
    }

    /**
     * Driver Statistics
     */
    private static async getDriverStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [];

        if (geoFilters.cityId) conditions.push(eq(drivers.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(drivers.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalDrivers: sql<number>`count(*)::int`,
                activeDrivers: sql<number>`count(*) filter (where ${drivers.isActive} = true)::int`,
                onlineDrivers: sql<number>`count(*) filter (where ${drivers.isOnline} = true)::int`,
                avgRating: sql<number>`avg(${drivers.rating}::numeric)::numeric(2,1)`,
            })
            .from(drivers)
            .where(whereClause);

        return result[0] || {
            totalDrivers: 0,
            activeDrivers: 0,
            onlineDrivers: 0,
            avgRating: 0,
        };
    }

    /**
     * Payment Statistics
     */
    private static async getPaymentStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(payments.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(payments.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(payments.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalPayments: sql<number>`count(*)::int`,
                completedPayments: sql<number>`count(*) filter (where ${payments.status} = 'completed')::int`,
                failedPayments: sql<number>`count(*) filter (where ${payments.status} = 'failed')::int`,
                refundedPayments: sql<number>`count(*) filter (where ${payments.status} IN ('refunded', 'partially_refunded'))::int`,
                totalAmount: sql<number>`sum(${payments.amount})::numeric(10,2)`,
                totalRefunded: sql<number>`sum(${payments.refundedAmount})::numeric(10,2)`,
            })
            .from(payments)
            .where(whereClause);

        return result[0] || {
            totalPayments: 0,
            completedPayments: 0,
            failedPayments: 0,
            refundedPayments: 0,
            totalAmount: 0,
            totalRefunded: 0,
        };
    }

    /**
     * Review Statistics
     */
    private static async getReviewStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(reviews.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(reviews.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(reviews.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalReviews: sql<number>`count(*)::int`,
                storeReviews: sql<number>`count(*) filter (where ${reviews.type} = 'store')::int`,
                driverReviews: sql<number>`count(*) filter (where ${reviews.type} = 'driver')::int`,
                approvedReviews: sql<number>`count(*) filter (where ${reviews.status} = 'approved')::int`,
                avgRating: sql<number>`avg(${reviews.rating})::numeric(2,1)`,
                rating5: sql<number>`count(*) filter (where ${reviews.rating} = 5)::int`,
                rating4: sql<number>`count(*) filter (where ${reviews.rating} = 4)::int`,
                rating3: sql<number>`count(*) filter (where ${reviews.rating} = 3)::int`,
                rating2: sql<number>`count(*) filter (where ${reviews.rating} = 2)::int`,
                rating1: sql<number>`count(*) filter (where ${reviews.rating} = 1)::int`,
            })
            .from(reviews)
            .where(whereClause);

        return result[0] || {
            totalReviews: 0,
            storeReviews: 0,
            driverReviews: 0,
            approvedReviews: 0,
            avgRating: 0,
            rating5: 0,
            rating4: 0,
            rating3: 0,
            rating2: 0,
            rating1: 0,
        };
    }

    /**
     * Support Ticket Statistics
     */
    private static async getSupportStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(supportTickets.createdAt, start, end)];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalTickets: sql<number>`count(*)::int`,
                openTickets: sql<number>`count(*) filter (where ${supportTickets.status} = 'open')::int`,
                inProgressTickets: sql<number>`count(*) filter (where ${supportTickets.status} = 'in_progress')::int`,
                resolvedTickets: sql<number>`count(*) filter (where ${supportTickets.status} = 'resolved')::int`,
                closedTickets: sql<number>`count(*) filter (where ${supportTickets.status} = 'closed')::int`,
            })
            .from(supportTickets)
            .where(whereClause);

        return result[0] || {
            totalTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            resolvedTickets: 0,
            closedTickets: 0,
        };
    }

    /**
     * Promo Code Statistics
     */
    private static async getPromoCodeStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(promoCodeUsage.createdAt, start, end)];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalUsed: sql<number>`count(*)::int`,
                totalDiscount: sql<number>`sum(${promoCodeUsage.discountApplied})::numeric(10,2)`,
            })
            .from(promoCodeUsage)
            .where(whereClause);

        return result[0] || {
            totalUsed: 0,
            totalDiscount: 0,
        };
    }

    /**
     * Transaction Statistics
     */
    private static async getTransactionStats(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(transactions.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(transactions.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(transactions.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                totalTransactions: sql<number>`count(*)::int`,
                completedTransactions: sql<number>`count(*) filter (where ${transactions.status} = 'completed')::int`,
                totalAmount: sql<number>`sum(${transactions.amount})::numeric(10,2)`,
            })
            .from(transactions)
            .where(whereClause);

        return result[0] || {
            totalTransactions: 0,
            completedTransactions: 0,
            totalAmount: 0,
        };
    }

    /**
     * Category Performance
     */
    private static async getCategoryPerformance(start: Date, end: Date, geoFilters: GeoFilters) {
        const result = await db
            .select({
                id: categories.id,
                name: categories.name,
                totalOrders: sql<number>`0::int`,
            })
            .from(categories)
            .limit(10);

        return result || [];
    }

    /**
     * Section Performance
     */
    private static async getSectionPerformance(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(orders.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                id: sections.id,
                name: sections.name,
                totalOrders: sql<number>`count(${orders.id})::int`,
                totalRevenue: sql<number>`sum(${orders.total})::numeric(10,2)`,
            })
            .from(sections)
            .leftJoin(stores, eq(stores.sectionId, sections.id))
            .leftJoin(orders, eq(orders.storeId, stores.id))
            .where(whereClause)
            .groupBy(sections.id, sections.name)
            .orderBy(sql`count(${orders.id}) desc`)
            .limit(10);

        return result || [];
    }

    /**
     * Top Performing Stores
     */
    private static async getTopStores(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [
            between(orders.createdAt, start, end),
            eq(orders.status, 'delivered'),
        ];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = and(...conditions);

        const result = await db
            .select({
                id: stores.id,
                name: stores.name,
                avatar: stores.avatar,
                totalOrders: sql<number>`count(${orders.id})::int`,
                totalRevenue: sql<number>`sum(${orders.total})::numeric(10,2)`,
                avgOrderValue: sql<number>`avg(${orders.total})::numeric(10,2)`,
            })
            .from(stores)
            .leftJoin(orders, eq(orders.storeId, stores.id))
            .where(whereClause)
            .groupBy(stores.id, stores.name, stores.avatar)
            .orderBy(sql`sum(${orders.total}) desc`)
            .limit(10);

        return result || [];
    }

    /**
     * Top Performing Drivers
     */
    private static async getTopDrivers(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [];

        if (geoFilters.cityId) conditions.push(eq(drivers.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(drivers.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                id: drivers.id,
                username: drivers.username,
                avatar: drivers.avatar,
                vehicleType: drivers.vehicleType,
                totalDeliveries: drivers.totalDeliveries,
                rating: drivers.rating,
            })
            .from(drivers)
            .where(whereClause)
            .orderBy(sql`${drivers.totalDeliveries} desc`)
            .limit(10);

        return result || [];
    }

    /**
     * Order Status Breakdown
     */
    private static async getOrderStatusBreakdown(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(orders.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                status: orders.status,
                count: sql<number>`count(*)::int`,
                totalValue: sql<number>`sum(${orders.total})::numeric(10,2)`,
            })
            .from(orders)
            .where(whereClause)
            .groupBy(orders.status)
            .orderBy(sql`count(*) desc`);

        return result || [];
    }

    /**
     * Payment Method Breakdown
     */
    private static async getPaymentMethodBreakdown(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [
            between(orders.createdAt, start, end),
            eq(orders.status, 'delivered'),
        ];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = and(...conditions);

        const result = await db
            .select({
                paymentMethod: orders.paymentMethod,
                count: sql<number>`count(*)::int`,
                totalValue: sql<number>`sum(${orders.total})::numeric(10,2)`,
            })
            .from(orders)
            .where(whereClause)
            .groupBy(orders.paymentMethod)
            .orderBy(sql`count(*) desc`);

        return result || [];
    }

    /**
     * Daily Metrics (Trend Analysis)
     */
    private static async getDailyMetrics(start: Date, end: Date, geoFilters: GeoFilters) {
        const conditions: SQL[] = [between(orders.createdAt, start, end)];

        if (geoFilters.cityId) conditions.push(eq(orders.cityId, geoFilters.cityId));
        else if (geoFilters.countryId) conditions.push(eq(orders.countryId, geoFilters.countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
            .select({
                date: sql<string>`DATE(${orders.createdAt})`,
                totalOrders: sql<number>`count(*)::int`,
                completedOrders: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
                totalRevenue: sql<number>`sum(${orders.total}) filter (where ${orders.status} = 'delivered')::numeric(10,2)`,
                avgOrderValue: sql<number>`avg(${orders.total}) filter (where ${orders.status} = 'delivered')::numeric(10,2)`,
            })
            .from(orders)
            .where(whereClause)
            .groupBy(sql`DATE(${orders.createdAt})`)
            .orderBy(sql`DATE(${orders.createdAt}) asc`);

        return result || [];
    }
}
