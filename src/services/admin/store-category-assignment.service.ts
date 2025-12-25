import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { db, storeCategoryAssignments, stores, categories } from '../../db';
import type { StoreCategoryAssignment, NewStoreCategoryAssignment } from '../../db/schema/store-category-assignments';
import { logger } from '../../lib/logger';

export interface AssignCategoryInput {
    storeId: string;
    categoryId: string;
    sorting?: number;
    isSponsored?: boolean;
}

export interface UpdateAssignmentInput {
    sorting?: number;
    isSponsored?: boolean;
}

export interface ListAssignmentsFilters {
    storeId?: string;
    categoryId?: string;
    isSponsored?: boolean;
    page?: number;
    limit?: number;
}

export type AssignmentWithRelations = StoreCategoryAssignment & {
    store?: { id: string; name: Record<string, string> };
    category?: { id: string; name: Record<string, string> };
};

export class StoreCategoryAssignmentService {
    // Assign store to category
    static async assign(input: AssignCategoryInput): Promise<AssignmentWithRelations> {
        const [assignment] = await db.insert(storeCategoryAssignments).values({
            storeId: input.storeId,
            categoryId: input.categoryId,
            sorting: input.sorting ?? 0,
            isSponsored: input.isSponsored ?? false,
        }).returning();

        logger.info({ storeId: input.storeId, categoryId: input.categoryId }, 'Store assigned to category');

        return this.getById(assignment.id) as Promise<AssignmentWithRelations>;
    }

    // Get assignment by ID
    static async getById(id: string): Promise<AssignmentWithRelations | null> {
        const assignment = await db.query.storeCategoryAssignments.findFirst({
            where: eq(storeCategoryAssignments.id, id),
            with: {
                store: true,
                category: true,
            },
        });
        return assignment ?? null;
    }

    // Check if assignment exists
    static async exists(storeId: string, categoryId: string): Promise<boolean> {
        const assignment = await db.query.storeCategoryAssignments.findFirst({
            where: and(
                eq(storeCategoryAssignments.storeId, storeId),
                eq(storeCategoryAssignments.categoryId, categoryId)
            ),
        });
        return !!assignment;
    }

    // Update assignment
    static async update(id: string, input: UpdateAssignmentInput): Promise<StoreCategoryAssignment | null> {
        const updateData: Partial<NewStoreCategoryAssignment> = { updatedAt: new Date() };

        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isSponsored !== undefined) updateData.isSponsored = input.isSponsored;

        const [assignment] = await db.update(storeCategoryAssignments)
            .set(updateData)
            .where(eq(storeCategoryAssignments.id, id))
            .returning();

        if (!assignment) return null;

        logger.info({ assignmentId: id }, 'Store category assignment updated');
        return assignment;
    }

    // Remove assignment
    static async remove(id: string): Promise<boolean> {
        const result = await db.delete(storeCategoryAssignments)
            .where(eq(storeCategoryAssignments.id, id))
            .returning({ id: storeCategoryAssignments.id });

        if (result.length > 0) {
            logger.info({ assignmentId: id }, 'Store category assignment removed');
            return true;
        }
        return false;
    }

    // Remove by store and category
    static async removeByStoreAndCategory(storeId: string, categoryId: string): Promise<boolean> {
        const result = await db.delete(storeCategoryAssignments)
            .where(and(
                eq(storeCategoryAssignments.storeId, storeId),
                eq(storeCategoryAssignments.categoryId, categoryId)
            ))
            .returning({ id: storeCategoryAssignments.id });

        if (result.length > 0) {
            logger.info({ storeId, categoryId }, 'Store category assignment removed');
            return true;
        }
        return false;
    }

    // List assignments
    static async list(filters: ListAssignmentsFilters = {}): Promise<{ data: AssignmentWithRelations[]; total: number }> {
        const {
            storeId,
            categoryId,
            isSponsored,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];

        if (storeId) conditions.push(eq(storeCategoryAssignments.storeId, storeId));
        if (categoryId) conditions.push(eq(storeCategoryAssignments.categoryId, categoryId));
        if (isSponsored !== undefined) conditions.push(eq(storeCategoryAssignments.isSponsored, isSponsored));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.storeCategoryAssignments.findMany({
                where: whereClause,
                with: {
                    store: true,
                    category: true,
                },
                orderBy: [asc(storeCategoryAssignments.sorting), desc(storeCategoryAssignments.createdAt)],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: storeCategoryAssignments.id }).from(storeCategoryAssignments).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    // Get categories for a store
    static async getCategoriesForStore(storeId: string): Promise<AssignmentWithRelations[]> {
        const assignments = await db.query.storeCategoryAssignments.findMany({
            where: eq(storeCategoryAssignments.storeId, storeId),
            with: { category: true },
            orderBy: asc(storeCategoryAssignments.sorting),
        });
        return assignments;
    }

    // Get stores in a category
    static async getStoresInCategory(categoryId: string, sponsoredFirst = true): Promise<AssignmentWithRelations[]> {
        const assignments = await db.query.storeCategoryAssignments.findMany({
            where: eq(storeCategoryAssignments.categoryId, categoryId),
            with: { store: true },
            orderBy: sponsoredFirst
                ? [desc(storeCategoryAssignments.isSponsored), asc(storeCategoryAssignments.sorting)]
                : asc(storeCategoryAssignments.sorting),
        });
        return assignments;
    }

    // Bulk assign categories to store
    static async bulkAssign(storeId: string, categoryIds: string[]): Promise<AssignmentWithRelations[]> {
        const assignments = await db.insert(storeCategoryAssignments)
            .values(categoryIds.map((categoryId, index) => ({
                storeId,
                categoryId,
                sorting: index,
            })))
            .returning();

        logger.info({ storeId, categoryCount: categoryIds.length }, 'Bulk categories assigned to store');

        return this.getCategoriesForStore(storeId);
    }

    // Replace all categories for a store
    static async replaceCategories(storeId: string, categoryIds: string[]): Promise<AssignmentWithRelations[]> {
        await db.transaction(async (tx) => {
            // Remove existing
            await tx.delete(storeCategoryAssignments)
                .where(eq(storeCategoryAssignments.storeId, storeId));

            // Add new
            if (categoryIds.length > 0) {
                await tx.insert(storeCategoryAssignments)
                    .values(categoryIds.map((categoryId, index) => ({
                        storeId,
                        categoryId,
                        sorting: index,
                    })));
            }
        });

        logger.info({ storeId, categoryCount: categoryIds.length }, 'Store categories replaced');

        return this.getCategoriesForStore(storeId);
    }
}
