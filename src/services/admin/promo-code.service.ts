import { eq, and, desc, asc, SQL, sql, gte, lte } from 'drizzle-orm';
import { db, promoCodes } from '../../db';
import type { PromoCode, NewPromoCode, PromoDiscountType } from '../../db/schema/promo-codes';

export interface CreatePromoCodeInput {
    title: string;
    description?: string;
    code: string;
    discountType: PromoDiscountType;
    discountAmount: string;
    maxDiscountAmount?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    minOrderAmount?: string;
    firstOrderOnly?: boolean;
    newUsersOnly?: boolean;
    startsAt?: string;
    expiresAt?: string;
    cityId?: string;
    countryId?: string;
}

export interface UpdatePromoCodeInput extends Partial<CreatePromoCodeInput> {
    isActive?: boolean;
}

export interface ListPromoCodesFilters {
    cityId?: string;
    countryId?: string;
    isActive?: boolean;
    discountType?: PromoDiscountType;
    expired?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export class PromoCodeService {
    static async create(input: CreatePromoCodeInput): Promise<PromoCode> {
        const [promoCode] = await db.insert(promoCodes).values({
            title: input.title,
            description: input.description,
            code: input.code.toUpperCase(),
            discountType: input.discountType,
            discountAmount: input.discountAmount,
            maxDiscountAmount: input.maxDiscountAmount,
            maxUses: input.maxUses,
            maxUsesPerUser: input.maxUsesPerUser ?? 1,
            minOrderAmount: input.minOrderAmount,
            firstOrderOnly: input.firstOrderOnly ?? false,
            newUsersOnly: input.newUsersOnly ?? false,
            startsAt: input.startsAt ? new Date(input.startsAt) : null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            cityId: input.cityId,
            countryId: input.countryId,
        }).returning();

        return promoCode;
    }

    static async getById(id: string): Promise<PromoCode | null> {
        const promoCode = await db.query.promoCodes.findFirst({
            where: eq(promoCodes.id, id),
            with: {
                city: true,
                country: true,
            },
        });
        return promoCode ?? null;
    }

    static async getByCode(code: string): Promise<PromoCode | null> {
        const promoCode = await db.query.promoCodes.findFirst({
            where: eq(promoCodes.code, code.toUpperCase()),
            with: {
                city: true,
                country: true,
            },
        });
        return promoCode ?? null;
    }

    static async update(id: string, input: UpdatePromoCodeInput): Promise<PromoCode | null> {
        const updateData: Partial<NewPromoCode> = { updatedAt: new Date() };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.code !== undefined) updateData.code = input.code.toUpperCase();
        if (input.discountType !== undefined) updateData.discountType = input.discountType;
        if (input.discountAmount !== undefined) updateData.discountAmount = input.discountAmount;
        if (input.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = input.maxDiscountAmount;
        if (input.maxUses !== undefined) updateData.maxUses = input.maxUses;
        if (input.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = input.maxUsesPerUser;
        if (input.minOrderAmount !== undefined) updateData.minOrderAmount = input.minOrderAmount;
        if (input.firstOrderOnly !== undefined) updateData.firstOrderOnly = input.firstOrderOnly;
        if (input.newUsersOnly !== undefined) updateData.newUsersOnly = input.newUsersOnly;
        if (input.startsAt !== undefined) updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
        if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
        if (input.cityId !== undefined) updateData.cityId = input.cityId;
        if (input.countryId !== undefined) updateData.countryId = input.countryId;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [promoCode] = await db.update(promoCodes)
            .set(updateData)
            .where(eq(promoCodes.id, id))
            .returning();

        return promoCode ?? null;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(promoCodes).where(eq(promoCodes.id, id));
        return true;
    }

    static async list(filters: ListPromoCodesFilters): Promise<{ data: PromoCode[]; total: number }> {
        const {
            cityId,
            countryId,
            isActive,
            discountType,
            expired,
            search,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];
        const now = new Date();

        if (cityId) conditions.push(eq(promoCodes.cityId, cityId));
        if (countryId) conditions.push(eq(promoCodes.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(promoCodes.isActive, isActive));
        if (discountType) conditions.push(eq(promoCodes.discountType, discountType));

        if (expired === true) {
            conditions.push(sql`${promoCodes.expiresAt} < ${now}`);
        } else if (expired === false) {
            conditions.push(sql`(${promoCodes.expiresAt} IS NULL OR ${promoCodes.expiresAt} >= ${now})`);
        }

        if (search) {
            conditions.push(
                sql`(${promoCodes.code} ILIKE ${`%${search}%`} OR ${promoCodes.title} ILIKE ${`%${search}%`})`
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.promoCodes.findMany({
                where: whereClause,
                with: {
                    city: { columns: { id: true, name: true } },
                    country: { columns: { id: true, name: true } },
                },
                orderBy: desc(promoCodes.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: promoCodes.id }).from(promoCodes).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async codeExists(code: string, excludeId?: string): Promise<boolean> {
        const existing = await db.query.promoCodes.findFirst({
            where: excludeId
                ? and(eq(promoCodes.code, code.toUpperCase()), sql`${promoCodes.id} != ${excludeId}`)
                : eq(promoCodes.code, code.toUpperCase()),
            columns: { id: true },
        });
        return !!existing;
    }
}
