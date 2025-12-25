import { eq, and, desc, SQL, sql } from 'drizzle-orm';
import { db, reviews } from '../../db';
import type { Review, ReviewType, ReviewStatus } from '../../db/schema/reviews';

export interface ListReviewsFilters {
    type?: ReviewType;
    status?: ReviewStatus;
    rating?: number;
    userId?: string;
    storeId?: string;
    driverId?: string;
    orderId?: string;
    cityId?: string;
    countryId?: string;
    page?: number;
    limit?: number;
}

export class ReviewService {
    static async getById(id: string): Promise<Review | null> {
        const review = await db.query.reviews.findFirst({
            where: eq(reviews.id, id),
            with: {
                user: {
                    columns: { id: true, username: true, email: true, avatar: true },
                },
                store: {
                    columns: { id: true, name: true, avatar: true },
                },
                driver: {
                    columns: { id: true, username: true, avatar: true },
                },
                order: {
                    columns: { id: true, orderNumber: true },
                },
                city: true,
                country: true,
            },
        });
        return review ?? null;
    }

    static async list(filters: ListReviewsFilters): Promise<{ data: Review[]; total: number }> {
        const {
            type,
            status,
            rating,
            userId,
            storeId,
            driverId,
            orderId,
            cityId,
            countryId,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];

        if (type) conditions.push(eq(reviews.type, type));
        if (status) conditions.push(eq(reviews.status, status));
        if (rating) conditions.push(eq(reviews.rating, rating));
        if (userId) conditions.push(eq(reviews.userId, userId));
        if (storeId) conditions.push(eq(reviews.storeId, storeId));
        if (driverId) conditions.push(eq(reviews.driverId, driverId));
        if (orderId) conditions.push(eq(reviews.orderId, orderId));
        if (cityId) conditions.push(eq(reviews.cityId, cityId));
        if (countryId) conditions.push(eq(reviews.countryId, countryId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.reviews.findMany({
                where: whereClause,
                with: {
                    user: {
                        columns: { id: true, username: true, avatar: true },
                    },
                    store: {
                        columns: { id: true, name: true },
                    },
                    driver: {
                        columns: { id: true, username: true },
                    },
                },
                orderBy: desc(reviews.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: reviews.id }).from(reviews).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async approve(id: string): Promise<Review | null> {
        const [review] = await db.update(reviews)
            .set({
                status: 'approved',
                rejectionReason: null,
                updatedAt: new Date(),
            })
            .where(eq(reviews.id, id))
            .returning();

        // Update store/driver rating if approved
        if (review) {
            await this.recalculateRating(review);
        }

        return review ?? null;
    }

    static async reject(id: string, reason: string): Promise<Review | null> {
        const [review] = await db.update(reviews)
            .set({
                status: 'rejected',
                rejectionReason: reason,
                updatedAt: new Date(),
            })
            .where(eq(reviews.id, id))
            .returning();

        return review ?? null;
    }

    static async delete(id: string): Promise<boolean> {
        const review = await this.getById(id);
        await db.delete(reviews).where(eq(reviews.id, id));

        // Recalculate rating after deletion
        if (review) {
            await this.recalculateRating(review);
        }

        return true;
    }

    private static async recalculateRating(review: Review): Promise<void> {
        if (review.type === 'store' && review.storeId) {
            // Calculate average rating for store
            const result = await db.execute(sql`
                UPDATE stores 
                SET rating = (
                    SELECT ROUND(AVG(rating)::numeric, 1)
                    FROM reviews 
                    WHERE store_id = ${review.storeId} 
                    AND status = 'approved'
                ),
                total_reviews = (
                    SELECT COUNT(*)
                    FROM reviews 
                    WHERE store_id = ${review.storeId} 
                    AND status = 'approved'
                )
                WHERE id = ${review.storeId}
            `);
        } else if (review.type === 'driver' && review.driverId) {
            // Calculate average rating for driver
            await db.execute(sql`
                UPDATE drivers 
                SET rating = (
                    SELECT ROUND(AVG(rating)::numeric, 1)::varchar
                    FROM reviews 
                    WHERE driver_id = ${review.driverId} 
                    AND status = 'approved'
                )
                WHERE id = ${review.driverId}
            `);
        }
    }

    static async getPendingCount(filters?: { cityId?: string; countryId?: string }): Promise<number> {
        const conditions: SQL[] = [eq(reviews.status, 'pending')];

        if (filters?.cityId) conditions.push(eq(reviews.cityId, filters.cityId));
        if (filters?.countryId) conditions.push(eq(reviews.countryId, filters.countryId));

        const result = await db.select({ count: reviews.id })
            .from(reviews)
            .where(and(...conditions));

        return result.length;
    }
}
