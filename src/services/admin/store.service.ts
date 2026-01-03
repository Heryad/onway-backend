import { eq, and, desc, asc, like, SQL } from 'drizzle-orm';
import argon2 from 'argon2';
import { db, stores, storeAuth } from '../../db';
import type { Store, NewStore, WorkingHours, DiscountType, ThumbnailType, CategoryDisplaySetting } from '../../db/schema/stores';
import type { StoreAuth, NewStoreAuth } from '../../db/schema/store-auth';
import { logger } from '../../lib/logger';

// Store auth roles
export const storeAuthRoles = ['owner', 'manager', 'staff'] as const;
export type StoreAuthRole = (typeof storeAuthRoles)[number];

// Create store input
export interface CreateStoreInput {
    // Basic info
    name: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string;
    thumbnail?: string;
    thumbnailType?: ThumbnailType;

    // Delivery settings
    hasSpecialDeliveryFee?: boolean;
    specialDeliveryFee?: string;
    minOrderAmount?: string;

    // Discount
    discountType?: DiscountType;
    discountAmount?: string;
    maxDiscountAmount?: string;

    // Visibility
    sorting?: number;
    isPrime?: boolean;
    isSponsored?: boolean;
    isFeatured?: boolean;

    // Working hours
    workingHours?: WorkingHours;
    preparationTime?: number;

    // Location
    geoLocation?: { lat: number; lng: number };
    address?: string;

    // Settings
    categoryDisplaySetting?: CategoryDisplaySetting;
    canPlaceOrder?: boolean;
    acceptsScheduledOrders?: boolean;
    commissionRate?: string;

    // Required
    cityId: string;
    countryId: string;
    sectionId?: string;

    // Auth credentials for store owner
    auth: {
        username: string;
        email: string;
        phone?: string;
        password: string;
    };
}

// Update store input
export interface UpdateStoreInput {
    name?: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string | null;
    thumbnail?: string | null;
    thumbnailType?: ThumbnailType;
    hasSpecialDeliveryFee?: boolean;
    specialDeliveryFee?: string | null;
    minOrderAmount?: string;
    discountType?: DiscountType | null;
    discountAmount?: string | null;
    maxDiscountAmount?: string | null;
    sorting?: number;
    isPrime?: boolean;
    isSponsored?: boolean;
    isFeatured?: boolean;
    workingHours?: WorkingHours;
    preparationTime?: number;
    geoLocation?: { lat: number; lng: number } | null;
    address?: string;
    categoryDisplaySetting?: CategoryDisplaySetting;
    canPlaceOrder?: boolean;
    acceptsScheduledOrders?: boolean;
    commissionRate?: string;
    sectionId?: string | null;
    isActive?: boolean;
}

// List stores filters
export interface ListStoresFilters {
    cityId?: string;
    countryId?: string;
    isActive?: boolean;
    isPrime?: boolean;
    isSponsored?: boolean;
    isFeatured?: boolean;
    sectionId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'name' | 'rating' | 'sorting';
    sortOrder?: 'asc' | 'desc';
}

// Safe store with auth (without password)
export type StoreWithAuth = Store & {
    auth?: Omit<StoreAuth, 'passwordHash'>[];
};

export class StoreService {
    // Create store with auth
    static async create(input: CreateStoreInput): Promise<StoreWithAuth> {
        const passwordHash = await argon2.hash(input.auth.password);

        // Use transaction
        const result = await db.transaction(async (tx) => {
            // Create store
            const [store] = await tx.insert(stores).values({
                name: input.name,
                description: input.description,
                avatar: input.avatar,
                thumbnail: input.thumbnail,
                thumbnailType: input.thumbnailType,
                hasSpecialDeliveryFee: input.hasSpecialDeliveryFee ?? false,
                specialDeliveryFee: input.specialDeliveryFee,
                minOrderAmount: input.minOrderAmount ?? '0',
                discountType: input.discountType,
                discountAmount: input.discountAmount,
                maxDiscountAmount: input.maxDiscountAmount,
                sorting: input.sorting ?? 0,
                isPrime: input.isPrime ?? false,
                isSponsored: input.isSponsored ?? false,
                isFeatured: input.isFeatured ?? false,
                workingHours: input.workingHours,
                preparationTime: input.preparationTime ?? 30,
                geoLocation: input.geoLocation,
                address: input.address,
                categoryDisplaySetting: input.categoryDisplaySetting ?? 'expanded',
                canPlaceOrder: input.canPlaceOrder ?? true,
                acceptsScheduledOrders: input.acceptsScheduledOrders ?? false,
                commissionRate: input.commissionRate ?? '15.00',
                cityId: input.cityId,
                countryId: input.countryId,
                sectionId: input.sectionId,
            }).returning();

            // Create store auth
            const [auth] = await tx.insert(storeAuth).values({
                username: input.auth.username,
                email: input.auth.email.toLowerCase(),
                phone: input.auth.phone,
                passwordHash,
                role: 'owner',
                storeId: store.id,
            }).returning();

            const { passwordHash: _, ...safeAuth } = auth;

            return { ...store, auth: [safeAuth] };
        });

        logger.info({ storeId: result.id }, 'Store created');
        return result;
    }

    // Get store by ID
    static async getById(id: string): Promise<StoreWithAuth | null> {
        const store = await db.query.stores.findFirst({
            where: eq(stores.id, id),
            with: {
                city: true,
                country: true,
                section: true,
            },
        });

        if (!store) return null;

        // Get auth users
        const authList = await db.query.storeAuth.findMany({
            where: eq(storeAuth.storeId, id),
        });

        const safeAuthList = authList.map(({ passwordHash, ...safe }) => safe);

        return { ...store, auth: safeAuthList };
    }

    // Update store
    static async update(id: string, input: UpdateStoreInput): Promise<Store | null> {
        const updateData: Partial<NewStore> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail;
        if (input.thumbnailType !== undefined) updateData.thumbnailType = input.thumbnailType;
        if (input.hasSpecialDeliveryFee !== undefined) updateData.hasSpecialDeliveryFee = input.hasSpecialDeliveryFee;
        if (input.specialDeliveryFee !== undefined) updateData.specialDeliveryFee = input.specialDeliveryFee;
        if (input.minOrderAmount !== undefined) updateData.minOrderAmount = input.minOrderAmount;
        if (input.discountType !== undefined) updateData.discountType = input.discountType;
        if (input.discountAmount !== undefined) updateData.discountAmount = input.discountAmount;
        if (input.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = input.maxDiscountAmount;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isPrime !== undefined) updateData.isPrime = input.isPrime;
        if (input.isSponsored !== undefined) updateData.isSponsored = input.isSponsored;
        if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
        if (input.workingHours !== undefined) updateData.workingHours = input.workingHours;
        if (input.preparationTime !== undefined) updateData.preparationTime = input.preparationTime;
        if (input.geoLocation !== undefined) updateData.geoLocation = input.geoLocation;
        if (input.address !== undefined) updateData.address = input.address;
        if (input.categoryDisplaySetting !== undefined) updateData.categoryDisplaySetting = input.categoryDisplaySetting;
        if (input.canPlaceOrder !== undefined) updateData.canPlaceOrder = input.canPlaceOrder;
        if (input.acceptsScheduledOrders !== undefined) updateData.acceptsScheduledOrders = input.acceptsScheduledOrders;
        if (input.commissionRate !== undefined) updateData.commissionRate = input.commissionRate;
        if (input.sectionId !== undefined) updateData.sectionId = input.sectionId;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [store] = await db.update(stores)
            .set(updateData)
            .where(eq(stores.id, id))
            .returning();

        if (!store) return null;

        logger.info({ storeId: id }, 'Store updated');
        return store;
    }

    // Delete store
    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(stores)
            .where(eq(stores.id, id))
            .returning({ id: stores.id });

        if (result.length > 0) {
            logger.info({ storeId: id }, 'Store deleted');
            return true;
        }
        return false;
    }

    // List stores
    static async list(filters: ListStoresFilters = {}): Promise<{ data: Store[]; total: number }> {
        const {
            cityId,
            countryId,
            isActive,
            isPrime,
            isSponsored,
            isFeatured,
            sectionId,
            search,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(stores.cityId, cityId));
        if (countryId) conditions.push(eq(stores.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(stores.isActive, isActive));
        if (isPrime !== undefined) conditions.push(eq(stores.isPrime, isPrime));
        if (isSponsored !== undefined) conditions.push(eq(stores.isSponsored, isSponsored));
        if (isFeatured !== undefined) conditions.push(eq(stores.isFeatured, isFeatured));
        if (sectionId) conditions.push(eq(stores.sectionId, sectionId));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const sortColumn = sortBy === 'name' ? stores.createdAt : stores[sortBy];

        const [data, countResult] = await Promise.all([
            db.query.stores.findMany({
                where: whereClause,
                with: { city: true, country: true, section: true },
                orderBy: orderFn(sortColumn),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: stores.id }).from(stores).where(whereClause),
        ]);

        // Filter by search in application layer (JSONB)
        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(s =>
                Object.values(s.name).some(n => n.toLowerCase().includes(searchLower))
            );
        }

        return { data: filteredData, total: countResult.length };
    }

    // Reset store password
    static async resetPassword(storeId: string, authId: string, newPassword: string): Promise<boolean> {
        const passwordHash = await argon2.hash(newPassword);

        const result = await db.update(storeAuth)
            .set({ passwordHash, updatedAt: new Date() })
            .where(and(eq(storeAuth.id, authId), eq(storeAuth.storeId, storeId)))
            .returning({ id: storeAuth.id });

        if (result.length > 0) {
            logger.info({ storeId, authId }, 'Store password reset');
            return true;
        }
        return false;
    }

    // Add store auth user
    static async addAuthUser(storeId: string, input: { username: string; email: string; phone?: string; password: string; role: StoreAuthRole }): Promise<Omit<StoreAuth, 'passwordHash'>> {
        const passwordHash = await argon2.hash(input.password);

        const [auth] = await db.insert(storeAuth).values({
            username: input.username,
            email: input.email.toLowerCase(),
            phone: input.phone,
            passwordHash,
            role: input.role,
            storeId,
        }).returning();

        const { passwordHash: _, ...safeAuth } = auth;
        logger.info({ storeId, authId: auth.id }, 'Store auth user added');
        return safeAuth;
    }

    // Remove store auth user
    static async removeAuthUser(storeId: string, authId: string): Promise<boolean> {
        const result = await db.delete(storeAuth)
            .where(and(eq(storeAuth.id, authId), eq(storeAuth.storeId, storeId)))
            .returning({ id: storeAuth.id });

        if (result.length > 0) {
            logger.info({ storeId, authId }, 'Store auth user removed');
            return true;
        }
        return false;
    }

    // Check if email exists
    static async emailExists(email: string, excludeId?: string): Promise<boolean> {
        const auth = await db.query.storeAuth.findFirst({
            where: excludeId
                ? and(eq(storeAuth.email, email.toLowerCase()), eq(storeAuth.id, excludeId))
                : eq(storeAuth.email, email.toLowerCase()),
        });
        return !!auth;
    }
}
