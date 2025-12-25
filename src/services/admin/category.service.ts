import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { db, categories } from '../../db';
import type { Category, NewCategory } from '../../db/schema/categories';
import { logger } from '../../lib/logger';

export interface CreateCategoryInput {
    name: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string;
    sorting?: number;
    cityId?: string;
    countryId?: string;
}

export interface UpdateCategoryInput {
    name?: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string;
    sorting?: number;
    isActive?: boolean;
}

export interface ListCategoriesFilters {
    cityId?: string;
    countryId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
}

export class CategoryService {
    static async create(input: CreateCategoryInput): Promise<Category> {
        const [category] = await db.insert(categories).values({
            name: input.name,
            description: input.description,
            avatar: input.avatar,
            sorting: input.sorting ?? 0,
            cityId: input.cityId,
            countryId: input.countryId,
        }).returning();

        logger.info({ categoryId: category.id }, 'Category created');
        return category;
    }

    static async getById(id: string): Promise<Category | null> {
        const category = await db.query.categories.findFirst({
            where: eq(categories.id, id),
            with: { city: true, country: true },
        });
        return category ?? null;
    }

    static async update(id: string, input: UpdateCategoryInput): Promise<Category | null> {
        const updateData: Partial<NewCategory> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [category] = await db.update(categories)
            .set(updateData)
            .where(eq(categories.id, id))
            .returning();

        if (!category) return null;

        logger.info({ categoryId: id }, 'Category updated');
        return category;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(categories)
            .where(eq(categories.id, id))
            .returning({ id: categories.id });

        if (result.length > 0) {
            logger.info({ categoryId: id }, 'Category deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListCategoriesFilters = {}): Promise<{ data: Category[]; total: number }> {
        const {
            cityId,
            countryId,
            isActive,
            search,
            page = 1,
            limit = 50,
            sortOrder = 'asc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(categories.cityId, cityId));
        if (countryId) conditions.push(eq(categories.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(categories.isActive, isActive));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.categories.findMany({
                where: whereClause,
                with: { city: true, country: true },
                orderBy: [orderFn(categories.sorting), orderFn(categories.createdAt)],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: categories.id }).from(categories).where(whereClause),
        ]);

        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(c =>
                Object.values(c.name).some(n => n.toLowerCase().includes(searchLower))
            );
        }

        return { data: filteredData, total: countResult.length };
    }
}
