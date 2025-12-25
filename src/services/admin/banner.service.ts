import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { db, banners } from '../../db';
import type { Banner, NewBanner } from '../../db/schema/banners';
import type { BannerType } from '../../db/schema/banners';
import { logger } from '../../lib/logger';

export interface CreateBannerInput {
    thumbnail: string;
    sorting?: number;
    type?: BannerType;
    clickUrl?: string;
    storeId?: string;
    cityId?: string;
    countryId?: string;
    startsAt?: Date;
    expiresAt?: Date;
}

export interface UpdateBannerInput {
    thumbnail?: string;
    sorting?: number;
    type?: BannerType;
    clickUrl?: string | null;
    storeId?: string | null;
    startsAt?: Date | null;
    expiresAt?: Date | null;
    isActive?: boolean;
}

export interface ListBannersFilters {
    cityId?: string;
    countryId?: string;
    isActive?: boolean;
    type?: BannerType;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
}

export class BannerService {
    static async create(input: CreateBannerInput): Promise<Banner> {
        const [banner] = await db.insert(banners).values({
            thumbnail: input.thumbnail,
            sorting: input.sorting ?? 0,
            type: input.type ?? 'view',
            clickUrl: input.clickUrl,
            storeId: input.storeId,
            cityId: input.cityId,
            countryId: input.countryId,
            startsAt: input.startsAt,
            expiresAt: input.expiresAt,
        }).returning();

        logger.info({ bannerId: banner.id }, 'Banner created');
        return banner;
    }

    static async getById(id: string): Promise<Banner | null> {
        const banner = await db.query.banners.findFirst({
            where: eq(banners.id, id),
            with: { city: true, country: true, store: true },
        });
        return banner ?? null;
    }

    static async update(id: string, input: UpdateBannerInput): Promise<Banner | null> {
        const updateData: Partial<NewBanner> = { updatedAt: new Date() };

        if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.clickUrl !== undefined) updateData.clickUrl = input.clickUrl;
        if (input.storeId !== undefined) updateData.storeId = input.storeId;
        if (input.startsAt !== undefined) updateData.startsAt = input.startsAt;
        if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [banner] = await db.update(banners)
            .set(updateData)
            .where(eq(banners.id, id))
            .returning();

        if (!banner) return null;

        logger.info({ bannerId: id }, 'Banner updated');
        return banner;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(banners)
            .where(eq(banners.id, id))
            .returning({ id: banners.id });

        if (result.length > 0) {
            logger.info({ bannerId: id }, 'Banner deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListBannersFilters = {}): Promise<{ data: Banner[]; total: number }> {
        const {
            cityId,
            countryId,
            isActive,
            type,
            page = 1,
            limit = 50,
            sortOrder = 'asc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(banners.cityId, cityId));
        if (countryId) conditions.push(eq(banners.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(banners.isActive, isActive));
        if (type) conditions.push(eq(banners.type, type));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.banners.findMany({
                where: whereClause,
                with: { city: true, country: true, store: true },
                orderBy: [orderFn(banners.sorting), orderFn(banners.createdAt)],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: banners.id }).from(banners).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async incrementImpressions(id: string): Promise<void> {
        await db.update(banners)
            .set({ impressions: db.select({ val: banners.impressions }).from(banners).where(eq(banners.id, id)) as any })
            .where(eq(banners.id, id));
    }

    static async incrementClicks(id: string): Promise<void> {
        await db.update(banners)
            .set({ clicks: db.select({ val: banners.clicks }).from(banners).where(eq(banners.id, id)) as any })
            .where(eq(banners.id, id));
    }
}
