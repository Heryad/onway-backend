import { Worker, type Job } from 'bullmq';
import { eq, and, desc, sql, isNull, notInArray } from 'drizzle-orm';
import { redisConnection } from '../connection';
import { dispatchQueue } from '../queues';
import { QUEUE_NAMES, JOB_NAMES, type DispatchJobData, type DriverTimeoutJobData } from '../definitions';
import { logger } from '../../lib/logger';
import { db, drivers, driverOrders, orders, stores } from '../../db';

const MAX_DISPATCH_ATTEMPTS = 5;
const DRIVER_RESPONSE_TIMEOUT_MS = 60_000; // 60 seconds

// Haversine distance in km
function calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function findBestDriver(
    zoneId: string,
    cityId: string,
    storeLocation?: { lat: number; lng: number },
    excludeDriverIds: string[] = []
) {
    // Query available drivers in the zone
    let conditions = and(
        eq(drivers.zoneId, zoneId),
        eq(drivers.isOnline, true),
        eq(drivers.isAvailable, true),
        eq(drivers.isActive, true)
    );

    // Exclude specified drivers
    if (excludeDriverIds.length > 0) {
        conditions = and(conditions, notInArray(drivers.id, excludeDriverIds));
    }

    const availableDrivers = await db.query.drivers.findMany({
        where: conditions,
        columns: {
            id: true,
            username: true,
            currentLocation: true,
            rating: true,
            totalDeliveries: true,
        },
        limit: 20, // Get top 20 candidates
    });

    if (availableDrivers.length === 0) {
        // Fallback: Try citywide if no drivers in zone
        logger.warn({ zoneId, cityId }, 'No drivers in zone, trying citywide');
        const cityDrivers = await db.query.drivers.findMany({
            where: and(
                eq(drivers.cityId, cityId),
                eq(drivers.isOnline, true),
                eq(drivers.isAvailable, true),
                eq(drivers.isActive, true),
                excludeDriverIds.length > 0 ? notInArray(drivers.id, excludeDriverIds) : undefined
            ),
            columns: {
                id: true,
                username: true,
                currentLocation: true,
                rating: true,
                totalDeliveries: true,
            },
            limit: 20,
        });

        if (cityDrivers.length === 0) {
            return null;
        }

        return selectBestFromCandidates(cityDrivers, storeLocation);
    }

    return selectBestFromCandidates(availableDrivers, storeLocation);
}

function selectBestFromCandidates(
    candidates: Array<{
        id: string;
        username: string | null;
        currentLocation: { lat: number; lng: number } | null;
        rating: string | null;
        totalDeliveries: number | null;
    }>,
    storeLocation?: { lat: number; lng: number }
) {
    // Score drivers: Lower distance + higher rating = better
    const scored = candidates.map(driver => {
        let distanceScore = 0;

        if (storeLocation && driver.currentLocation) {
            const dist = calculateDistance(
                storeLocation.lat, storeLocation.lng,
                driver.currentLocation.lat, driver.currentLocation.lng
            );
            distanceScore = dist; // Lower is better
        }

        const ratingScore = parseFloat(driver.rating || '5.0');
        const experienceScore = Math.min((driver.totalDeliveries || 0) / 100, 1); // Max 1

        // Combined score (lower is better)
        // Weighted: Distance most important, then rating, then experience
        const score = distanceScore - (ratingScore * 0.5) - (experienceScore * 0.2);

        return { driver, score, distance: distanceScore };
    });

    // Sort by score (ascending - lower is better)
    scored.sort((a, b) => a.score - b.score);

    return scored[0]?.driver || null;
}

export const dispatchWorker = new Worker<DispatchJobData | DriverTimeoutJobData>(
    QUEUE_NAMES.DISPATCH,
    async (job: Job<DispatchJobData | DriverTimeoutJobData>) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing dispatch job');

        try {
            if (job.name === JOB_NAMES.FIND_DRIVER) {
                return await handleFindDriver(job as Job<DispatchJobData>);
            } else if (job.name === JOB_NAMES.DRIVER_RESPONSE_TIMEOUT) {
                return await handleDriverTimeout(job as Job<DriverTimeoutJobData>);
            }

            throw new Error(`Unknown job: ${job.name}`);
        } catch (error: any) {
            logger.error({ jobId: job.id, error: error.message }, 'Dispatch job failed');
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 10, // Process multiple dispatches in parallel
    }
);

async function handleFindDriver(job: Job<DispatchJobData>) {
    const { orderId, storeId, cityId, storeLocation, excludeDriverIds = [], attempt = 1 } = job.data;

    logger.info({ orderId, storeId, attempt }, 'Finding driver for order');

    // Get store with zone info
    const store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId),
        columns: { id: true, zoneId: true, geoLocation: true },
    });

    if (!store) {
        throw new Error(`Store not found: ${storeId}`);
    }

    if (!store.zoneId) {
        logger.warn({ storeId }, 'Store has no zone assigned, using citywide dispatch');
    }

    const location = storeLocation || store.geoLocation;
    const bestDriver = await findBestDriver(
        store.zoneId || '',
        cityId,
        location ?? undefined,
        excludeDriverIds
    );

    if (!bestDriver) {
        if (attempt >= MAX_DISPATCH_ATTEMPTS) {
            logger.error({ orderId }, 'No drivers available after max attempts');
            // Update order status to indicate dispatch failed
            await db.update(orders)
                .set({ status: 'cancelled', cancelReason: 'no_driver_available', cancelledAt: new Date() })
                .where(eq(orders.id, orderId));
            return { success: false, reason: 'no_drivers_available' };
        }

        // Re-queue with delay
        await dispatchQueue.add(
            JOB_NAMES.FIND_DRIVER,
            { ...job.data, attempt: attempt + 1 },
            { delay: 30_000 } // Retry in 30 seconds
        );
        return { success: false, reason: 'retrying', attempt };
    }

    // Create driver assignment
    const [assignment] = await db.insert(driverOrders).values({
        orderId,
        driverId: bestDriver.id,
        status: 'assigned',
    }).returning();

    // Update order status
    await db.update(orders)
        .set({ status: 'driver_assigned', updatedAt: new Date() })
        .where(eq(orders.id, orderId));

    // Mark driver as unavailable (busy)
    await db.update(drivers)
        .set({ isAvailable: false, updatedAt: new Date() })
        .where(eq(drivers.id, bestDriver.id));

    logger.info({ orderId, driverId: bestDriver.id }, 'Driver assigned');

    // Schedule timeout job
    await dispatchQueue.add(
        JOB_NAMES.DRIVER_RESPONSE_TIMEOUT,
        {
            orderId,
            driverOrderId: assignment.id,
            driverId: bestDriver.id,
            attempt,
        } as DriverTimeoutJobData,
        { delay: DRIVER_RESPONSE_TIMEOUT_MS }
    );

    // TODO: Emit socket event to notify driver app
    // socketService.emitToDriver(bestDriver.id, 'new-order', { orderId, ... });

    return { success: true, driverId: bestDriver.id, assignmentId: assignment.id };
}

async function handleDriverTimeout(job: Job<DriverTimeoutJobData>) {
    const { orderId, driverOrderId, driverId, attempt } = job.data;

    // Check if driver already accepted
    const assignment = await db.query.driverOrders.findFirst({
        where: eq(driverOrders.id, driverOrderId),
    });

    if (!assignment) {
        return { success: true, reason: 'assignment_not_found' };
    }

    if (assignment.status === 'accepted') {
        logger.info({ orderId, driverId }, 'Driver already accepted, skipping timeout');
        return { success: true, reason: 'already_accepted' };
    }

    // Driver didn't respond - mark as rejected and reassign
    await db.update(driverOrders)
        .set({ status: 'rejected', rejectionReason: 'timeout' as any, respondedAt: new Date() })
        .where(eq(driverOrders.id, driverOrderId));

    // Mark driver as available again
    await db.update(drivers)
        .set({ isAvailable: true, updatedAt: new Date() })
        .where(eq(drivers.id, driverId));

    logger.info({ orderId, driverId }, 'Driver timeout, reassigning');

    // Get order for store info
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { id: true, storeId: true, cityId: true },
    });

    if (!order) {
        return { success: false, reason: 'order_not_found' };
    }

    // Re-dispatch excluding this driver
    const store = await db.query.stores.findFirst({
        where: eq(stores.id, order.storeId),
        columns: { geoLocation: true },
    });

    await dispatchQueue.add(
        JOB_NAMES.FIND_DRIVER,
        {
            orderId,
            storeId: order.storeId,
            cityId: order.cityId,
            storeLocation: store?.geoLocation ?? undefined,
            excludeDriverIds: [driverId],
            attempt: attempt + 1,
        } as DispatchJobData
    );

    return { success: true, reason: 'reassigning' };
}

dispatchWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Dispatch job completed');
});

dispatchWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, error: err.message }, 'Dispatch job failed');
});
