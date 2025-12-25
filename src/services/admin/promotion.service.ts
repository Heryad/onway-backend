import { eq, and, desc, SQL, sql } from 'drizzle-orm';
import { db, promotions, promotionStores } from '../../db';
import type { Promotion, NewPromotion, PromotionDiscountType } from '../../db/schema/promotions';
import type { PromotionStore } from '../../db/schema/promotion-stores';

export interface CreatePromotionInput {
    title: string;
    description?: string;
    thumbnail?: string;
    discountType: PromotionDiscountType;
    discountAmount: string;
    maxDiscountAmount?: string;
    hasMainView?: boolean;
    sorting?: number;
    startsAt?: string;
    expiresAt?: string;
    cityId?: string;
    countryId?: string;
}

export interface UpdatePromotionInput extends Partial<CreatePromotionInput> {
    isActive?: boolean;
}

export interface ListPromotionsFilters {
    cityId?: string;
    countryId?: string;
    isActive?: boolean;
    hasMainView?: boolean;
    page?: number;
    limit?: number;
}

export class PromotionService {
    static async create(input: CreatePromotionInput): Promise<Promotion> {
        const [promotion] = await db.insert(promotions).values({
            title: input.title,
            description: input.description,
            thumbnail: input.thumbnail,
            discountType: input.discountType,
            discountAmount: input.discountAmount,
            maxDiscountAmount: input.maxDiscountAmount,
            hasMainView: input.hasMainView ?? false,
            sorting: input.sorting ?? 0,
            startsAt: input.startsAt ? new Date(input.startsAt) : null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            cityId: input.cityId,
            countryId: input.countryId,
        }).returning();

        return promotion;
    }

    static async getById(id: string): Promise<Promotion | null> {
        const promotion = await db.query.promotions.findFirst({
            where: eq(promotions.id, id),
            with: {
                city: true,
                country: true,
            },
        });
        return promotion ?? null;
    }

    static async update(id: string, input: UpdatePromotionInput): Promise<Promotion | null> {
        const updateData: Partial<NewPromotion> = { updatedAt: new Date() };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail;
        if (input.discountType !== undefined) updateData.discountType = input.discountType;
        if (input.discountAmount !== undefined) updateData.discountAmount = input.discountAmount;
        if (input.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = input.maxDiscountAmount;
        if (input.hasMainView !== undefined) updateData.hasMainView = input.hasMainView;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.startsAt !== undefined) updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
        if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
        if (input.cityId !== undefined) updateData.cityId = input.cityId;
        if (input.countryId !== undefined) updateData.countryId = input.countryId;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [promotion] = await db.update(promotions)
            .set(updateData)
            .where(eq(promotions.id, id))
            .returning();

        return promotion ?? null;
    }

    static async delete(id: string): Promise<boolean> {
        await db.delete(promotions).where(eq(promotions.id, id));
        return true;
    }

    static async list(filters: ListPromotionsFilters): Promise<{ data: Promotion[]; total: number }> {
        const { cityId, countryId, isActive, hasMainView, page = 1, limit = 50 } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(promotions.cityId, cityId));
        if (countryId) conditions.push(eq(promotions.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(promotions.isActive, isActive));
        if (hasMainView !== undefined) conditions.push(eq(promotions.hasMainView, hasMainView));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.promotions.findMany({
                where: whereClause,
                with: {
                    city: { columns: { id: true, name: true } },
                    country: { columns: { id: true, name: true } },
                },
                orderBy: [desc(promotions.sorting), desc(promotions.createdAt)],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: promotions.id }).from(promotions).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    // ========== Store Links ==========

    static async getStores(promotionId: string): Promise<PromotionStore[]> {
        const stores = await db.query.promotionStores.findMany({
            where: eq(promotionStores.promotionId, promotionId),
            with: {
                store: {
                    columns: { id: true, name: true, avatar: true },
                },
            },
            orderBy: desc(promotionStores.sorting),
        });
        return stores;
    }

    static async addStore(promotionId: string, storeId: string, sorting: number = 0): Promise<PromotionStore> {
        // Check if already linked
        const existing = await db.query.promotionStores.findFirst({
            where: and(
                eq(promotionStores.promotionId, promotionId),
                eq(promotionStores.storeId, storeId)
            ),
        });

        if (existing) {
            throw new Error('Store already linked to this promotion');
        }

        const [link] = await db.insert(promotionStores).values({
            promotionId,
            storeId,
            sorting,
        }).returning();

        return link;
    }

    static async removeStore(promotionId: string, storeId: string): Promise<boolean> {
        await db.delete(promotionStores)
            .where(and(
                eq(promotionStores.promotionId, promotionId),
                eq(promotionStores.storeId, storeId)
            ));
        return true;
    }
}
