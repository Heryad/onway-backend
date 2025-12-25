import { eq, and, asc, desc, SQL } from 'drizzle-orm';
import { db, storeItems, storeCategories } from '../../db';
import type { StoreItem, NewStoreItem, ItemDiscountType } from '../../db/schema/store-items';
import { logger } from '../../lib/logger';

export interface NutritionInfo {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface CreateStoreItemInput {
    storeId: string;
    categoryId: string;
    name: Record<string, string>;
    description?: Record<string, string>;
    price: string;
    compareAtPrice?: string;
    discountType?: ItemDiscountType;
    discountAmount?: string;
    photos?: string[];
    maxQuantity?: number;
    stockQuantity?: number;
    outOfStock?: boolean;
    tags?: string[];
    nutritionInfo?: NutritionInfo;
    preparationTime?: number;
    sorting?: number;
}

export interface UpdateStoreItemInput {
    categoryId?: string;
    name?: Record<string, string>;
    description?: Record<string, string>;
    price?: string;
    compareAtPrice?: string | null;
    discountType?: ItemDiscountType | null;
    discountAmount?: string | null;
    photos?: string[];
    maxQuantity?: number;
    stockQuantity?: number | null;
    outOfStock?: boolean;
    tags?: string[];
    nutritionInfo?: NutritionInfo | null;
    preparationTime?: number | null;
    sorting?: number;
    isActive?: boolean;
}

export interface ListStoreItemsFilters {
    storeId?: string;
    categoryId?: string;
    isActive?: boolean;
    outOfStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export type StoreItemWithCategory = StoreItem & {
    category?: { id: string; name: Record<string, string> };
};

export class StoreItemService {
    static async create(input: CreateStoreItemInput): Promise<StoreItem> {
        const [item] = await db.insert(storeItems).values({
            storeId: input.storeId,
            categoryId: input.categoryId,
            name: input.name,
            description: input.description,
            price: input.price,
            compareAtPrice: input.compareAtPrice,
            discountType: input.discountType,
            discountAmount: input.discountAmount,
            photos: input.photos ?? [],
            maxQuantity: input.maxQuantity ?? 10,
            stockQuantity: input.stockQuantity,
            outOfStock: input.outOfStock ?? false,
            tags: input.tags ?? [],
            nutritionInfo: input.nutritionInfo,
            preparationTime: input.preparationTime,
            sorting: input.sorting ?? 0,
        }).returning();

        logger.info({ storeId: input.storeId, itemId: item.id }, 'Store item created');
        return item;
    }

    static async getById(id: string): Promise<StoreItemWithCategory | null> {
        const item = await db.query.storeItems.findFirst({
            where: eq(storeItems.id, id),
            with: { category: true, store: true },
        });
        return item ?? null;
    }

    static async update(id: string, input: UpdateStoreItemInput): Promise<StoreItem | null> {
        const updateData: Partial<NewStoreItem> = { updatedAt: new Date() };

        if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.price !== undefined) updateData.price = input.price;
        if (input.compareAtPrice !== undefined) updateData.compareAtPrice = input.compareAtPrice;
        if (input.discountType !== undefined) updateData.discountType = input.discountType;
        if (input.discountAmount !== undefined) updateData.discountAmount = input.discountAmount;
        if (input.photos !== undefined) updateData.photos = input.photos;
        if (input.maxQuantity !== undefined) updateData.maxQuantity = input.maxQuantity;
        if (input.stockQuantity !== undefined) updateData.stockQuantity = input.stockQuantity;
        if (input.outOfStock !== undefined) updateData.outOfStock = input.outOfStock;
        if (input.tags !== undefined) updateData.tags = input.tags;
        if (input.nutritionInfo !== undefined) updateData.nutritionInfo = input.nutritionInfo;
        if (input.preparationTime !== undefined) updateData.preparationTime = input.preparationTime;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [item] = await db.update(storeItems)
            .set(updateData)
            .where(eq(storeItems.id, id))
            .returning();

        if (!item) return null;

        logger.info({ itemId: id }, 'Store item updated');
        return item;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(storeItems)
            .where(eq(storeItems.id, id))
            .returning({ id: storeItems.id });

        if (result.length > 0) {
            logger.info({ itemId: id }, 'Store item deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListStoreItemsFilters): Promise<{ data: StoreItemWithCategory[]; total: number }> {
        const { storeId, categoryId, isActive, outOfStock, search, page = 1, limit = 50 } = filters;

        const conditions: SQL[] = [];

        if (storeId) conditions.push(eq(storeItems.storeId, storeId));
        if (categoryId) conditions.push(eq(storeItems.categoryId, categoryId));
        if (isActive !== undefined) conditions.push(eq(storeItems.isActive, isActive));
        if (outOfStock !== undefined) conditions.push(eq(storeItems.outOfStock, outOfStock));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.storeItems.findMany({
                where: whereClause,
                with: { category: true },
                orderBy: asc(storeItems.sorting),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: storeItems.id }).from(storeItems).where(whereClause),
        ]);

        // Filter by search in application layer (JSONB)
        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(item =>
                Object.values(item.name).some(n => n.toLowerCase().includes(searchLower))
            );
        }

        return { data: filteredData, total: countResult.length };
    }

    static async reorder(categoryId: string, itemIds: string[]): Promise<void> {
        await db.transaction(async (tx) => {
            for (let i = 0; i < itemIds.length; i++) {
                await tx.update(storeItems)
                    .set({ sorting: i, updatedAt: new Date() })
                    .where(and(eq(storeItems.id, itemIds[i]), eq(storeItems.categoryId, categoryId)));
            }
        });
        logger.info({ categoryId, count: itemIds.length }, 'Store items reordered');
    }

    static async toggleStock(id: string): Promise<StoreItem | null> {
        const item = await this.getById(id);
        if (!item) return null;

        return this.update(id, { outOfStock: !item.outOfStock });
    }

    static async bulkToggleStock(itemIds: string[], outOfStock: boolean): Promise<number> {
        const result = await db.update(storeItems)
            .set({ outOfStock, updatedAt: new Date() })
            .where(and(...itemIds.map(id => eq(storeItems.id, id))))
            .returning({ id: storeItems.id });

        logger.info({ count: result.length, outOfStock }, 'Bulk stock status updated');
        return result.length;
    }
}
