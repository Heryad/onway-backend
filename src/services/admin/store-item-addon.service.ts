import { eq, and, asc, SQL } from 'drizzle-orm';
import { db, storeItemAddons, storeItems } from '../../db';
import type { StoreItemAddon, NewStoreItemAddon, AddonOption } from '../../db/schema/store-item-addons';
import { logger } from '../../lib/logger';
import { randomUUID } from 'crypto';

export interface CreateAddonInput {
    storeId: string;
    storeItemId: string;
    name: Record<string, string>;
    options: Omit<AddonOption, 'id'>[];
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sorting?: number;
}

export interface UpdateAddonInput {
    name?: Record<string, string>;
    options?: Omit<AddonOption, 'id'>[];
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sorting?: number;
    isActive?: boolean;
}

export interface ListAddonsFilters {
    storeItemId?: string;
    storeId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export type AddonWithItem = StoreItemAddon & {
    storeItem?: { id: string; name: Record<string, string> };
};

export class StoreItemAddonService {
    // Add UUIDs to options
    private static processOptions(options: Omit<AddonOption, 'id'>[]): AddonOption[] {
        return options.map(opt => ({
            ...opt,
            id: randomUUID(),
        }));
    }

    static async create(input: CreateAddonInput): Promise<StoreItemAddon> {
        const options = this.processOptions(input.options);

        const [addon] = await db.insert(storeItemAddons).values({
            storeId: input.storeId,
            storeItemId: input.storeItemId,
            name: input.name,
            options,
            isRequired: input.isRequired ?? false,
            minSelections: input.minSelections ?? 0,
            maxSelections: input.maxSelections ?? 1,
            sorting: input.sorting ?? 0,
        }).returning();

        logger.info({ storeItemId: input.storeItemId, addonId: addon.id }, 'Store item addon created');
        return addon;
    }

    static async getById(id: string): Promise<AddonWithItem | null> {
        const addon = await db.query.storeItemAddons.findFirst({
            where: eq(storeItemAddons.id, id),
            with: { storeItem: true, store: true },
        });
        return addon ?? null;
    }

    static async update(id: string, input: UpdateAddonInput): Promise<StoreItemAddon | null> {
        const updateData: Partial<NewStoreItemAddon> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.options !== undefined) updateData.options = this.processOptions(input.options);
        if (input.isRequired !== undefined) updateData.isRequired = input.isRequired;
        if (input.minSelections !== undefined) updateData.minSelections = input.minSelections;
        if (input.maxSelections !== undefined) updateData.maxSelections = input.maxSelections;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [addon] = await db.update(storeItemAddons)
            .set(updateData)
            .where(eq(storeItemAddons.id, id))
            .returning();

        if (!addon) return null;

        logger.info({ addonId: id }, 'Store item addon updated');
        return addon;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(storeItemAddons)
            .where(eq(storeItemAddons.id, id))
            .returning({ id: storeItemAddons.id });

        if (result.length > 0) {
            logger.info({ addonId: id }, 'Store item addon deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListAddonsFilters): Promise<{ data: AddonWithItem[]; total: number }> {
        const { storeItemId, storeId, isActive, page = 1, limit = 50 } = filters;

        const conditions: SQL[] = [];

        if (storeItemId) conditions.push(eq(storeItemAddons.storeItemId, storeItemId));
        if (storeId) conditions.push(eq(storeItemAddons.storeId, storeId));
        if (isActive !== undefined) conditions.push(eq(storeItemAddons.isActive, isActive));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.storeItemAddons.findMany({
                where: whereClause,
                with: { storeItem: true },
                orderBy: asc(storeItemAddons.sorting),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: storeItemAddons.id }).from(storeItemAddons).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async getAddonsForItem(storeItemId: string): Promise<StoreItemAddon[]> {
        const addons = await db.query.storeItemAddons.findMany({
            where: and(
                eq(storeItemAddons.storeItemId, storeItemId),
                eq(storeItemAddons.isActive, true)
            ),
            orderBy: asc(storeItemAddons.sorting),
        });
        return addons;
    }

    static async reorder(storeItemId: string, addonIds: string[]): Promise<void> {
        await db.transaction(async (tx) => {
            for (let i = 0; i < addonIds.length; i++) {
                await tx.update(storeItemAddons)
                    .set({ sorting: i, updatedAt: new Date() })
                    .where(and(eq(storeItemAddons.id, addonIds[i]), eq(storeItemAddons.storeItemId, storeItemId)));
            }
        });
        logger.info({ storeItemId, count: addonIds.length }, 'Store item addons reordered');
    }

    static async duplicateAddonsToItem(sourceItemId: string, targetItemId: string, targetStoreId: string): Promise<StoreItemAddon[]> {
        const sourceAddons = await this.getAddonsForItem(sourceItemId);

        if (sourceAddons.length === 0) return [];

        const newAddons = await db.insert(storeItemAddons)
            .values(sourceAddons.map(addon => ({
                storeId: targetStoreId,
                storeItemId: targetItemId,
                name: addon.name,
                options: addon.options,
                isRequired: addon.isRequired,
                minSelections: addon.minSelections,
                maxSelections: addon.maxSelections,
                sorting: addon.sorting,
            })))
            .returning();

        logger.info({ sourceItemId, targetItemId, count: newAddons.length }, 'Addons duplicated');
        return newAddons;
    }
}
