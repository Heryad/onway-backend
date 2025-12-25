import { eq, and, asc, desc, SQL } from 'drizzle-orm';
import { db, storeCategories } from '../../db';
import type { StoreCategory, NewStoreCategory } from '../../db/schema/store-categories';
import { logger } from '../../lib/logger';

export interface CreateMenuCategoryInput {
    storeId: string;
    name: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string;
    sorting?: number;
}

export interface UpdateMenuCategoryInput {
    name?: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string | null;
    sorting?: number;
    isActive?: boolean;
}

export interface ListMenuCategoriesFilters {
    storeId: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export class StoreMenuCategoryService {
    static async create(input: CreateMenuCategoryInput): Promise<StoreCategory> {
        const [category] = await db.insert(storeCategories).values({
            storeId: input.storeId,
            name: input.name,
            description: input.description,
            avatar: input.avatar,
            sorting: input.sorting ?? 0,
        }).returning();

        logger.info({ storeId: input.storeId, categoryId: category.id }, 'Store menu category created');
        return category;
    }

    static async getById(id: string): Promise<StoreCategory | null> {
        const category = await db.query.storeCategories.findFirst({
            where: eq(storeCategories.id, id),
            with: { store: true },
        });
        return category ?? null;
    }

    static async update(id: string, input: UpdateMenuCategoryInput): Promise<StoreCategory | null> {
        const updateData: Partial<NewStoreCategory> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [category] = await db.update(storeCategories)
            .set(updateData)
            .where(eq(storeCategories.id, id))
            .returning();

        if (!category) return null;

        logger.info({ categoryId: id }, 'Store menu category updated');
        return category;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(storeCategories)
            .where(eq(storeCategories.id, id))
            .returning({ id: storeCategories.id });

        if (result.length > 0) {
            logger.info({ categoryId: id }, 'Store menu category deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListMenuCategoriesFilters): Promise<{ data: StoreCategory[]; total: number }> {
        const { storeId, isActive, page = 1, limit = 50 } = filters;

        const conditions: SQL[] = [eq(storeCategories.storeId, storeId)];
        if (isActive !== undefined) conditions.push(eq(storeCategories.isActive, isActive));

        const whereClause = and(...conditions);

        const [data, countResult] = await Promise.all([
            db.query.storeCategories.findMany({
                where: whereClause,
                orderBy: asc(storeCategories.sorting),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: storeCategories.id }).from(storeCategories).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async reorder(storeId: string, categoryIds: string[]): Promise<void> {
        await db.transaction(async (tx) => {
            for (let i = 0; i < categoryIds.length; i++) {
                await tx.update(storeCategories)
                    .set({ sorting: i, updatedAt: new Date() })
                    .where(and(eq(storeCategories.id, categoryIds[i]), eq(storeCategories.storeId, storeId)));
            }
        });
        logger.info({ storeId, count: categoryIds.length }, 'Store menu categories reordered');
    }
}
