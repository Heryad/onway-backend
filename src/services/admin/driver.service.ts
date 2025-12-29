import { eq, and, desc, asc, SQL, like, sql } from 'drizzle-orm';
import argon2 from 'argon2';
import { db, drivers } from '../../db';
import type { Driver, NewDriver, VehicleType } from '../../db/schema/drivers';
import { logger } from '../../lib/logger';

export interface CreateDriverInput {
    username: string;
    email: string;
    phone: string;
    password: string;
    avatar?: string;
    vehicleType: VehicleType;
    vehiclePlate?: string;
    cityId: string;
    countryId: string;
    zoneId?: string;
}

export interface UpdateDriverInput {
    username?: string;
    email?: string; // Usually sensitive to change
    phone?: string;
    avatar?: string | null;
    vehicleType?: VehicleType;
    vehiclePlate?: string;
    zoneId?: string | null;
    isOnline?: boolean;
    isAvailable?: boolean;
    isActive?: boolean;
}

export interface ListDriversFilters {
    cityId?: string;
    countryId?: string;
    zoneId?: string;
    vehicleType?: VehicleType;
    isOnline?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'rating' | 'totalDeliveries';
    sortOrder?: 'asc' | 'desc';
}

export class DriverService {
    static async create(input: CreateDriverInput): Promise<Driver> {
        const passwordHash = await argon2.hash(input.password);

        const [driver] = await db.insert(drivers).values({
            username: input.username,
            email: input.email.toLowerCase(),
            phone: input.phone,
            passwordHash,
            avatar: input.avatar,
            vehicleType: input.vehicleType,
            vehiclePlate: input.vehiclePlate,
            cityId: input.cityId,
            countryId: input.countryId,
            zoneId: input.zoneId,
            isOnline: false,
            isAvailable: true,
            isActive: true, // Auto-active for manual creation?
        }).returning();

        const { passwordHash: _, ...safeDriver } = driver;
        logger.info({ driverId: driver.id }, 'Driver created');
        return driver;
    }

    static async getById(id: string): Promise<Driver | null> {
        const driver = await db.query.drivers.findFirst({
            where: eq(drivers.id, id),
            with: {
                city: true,
                country: true,
                zone: true,
            },
        });
        return driver ?? null;
    }

    static async update(id: string, input: UpdateDriverInput): Promise<Driver | null> {
        const updateData: Partial<NewDriver> = { updatedAt: new Date() };

        if (input.username !== undefined) updateData.username = input.username;
        if (input.email !== undefined) updateData.email = input.email.toLowerCase();
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.vehicleType !== undefined) updateData.vehicleType = input.vehicleType;
        if (input.vehiclePlate !== undefined) updateData.vehiclePlate = input.vehiclePlate;
        if (input.zoneId !== undefined) updateData.zoneId = input.zoneId;
        if (input.isOnline !== undefined) updateData.isOnline = input.isOnline;
        if (input.isAvailable !== undefined) updateData.isAvailable = input.isAvailable;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [driver] = await db.update(drivers)
            .set(updateData)
            .where(eq(drivers.id, id))
            .returning();

        if (!driver) return null;

        logger.info({ driverId: id }, 'Driver updated');
        return driver;
    }

    static async delete(id: string): Promise<boolean> {
        // Hard delete
        const result = await db.delete(drivers)
            .where(eq(drivers.id, id))
            .returning({ id: drivers.id });

        if (result.length > 0) {
            logger.info({ driverId: id }, 'Driver deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListDriversFilters): Promise<{ data: Omit<Driver, 'passwordHash'>[]; total: number }> {
        const {
            cityId,
            countryId,
            zoneId,
            vehicleType,
            isOnline,
            isActive,
            search,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(drivers.cityId, cityId));
        if (countryId) conditions.push(eq(drivers.countryId, countryId));
        if (zoneId) conditions.push(eq(drivers.zoneId, zoneId));
        if (vehicleType) conditions.push(eq(drivers.vehicleType, vehicleType));
        if (isOnline !== undefined) conditions.push(eq(drivers.isOnline, isOnline));
        if (isActive !== undefined) conditions.push(eq(drivers.isActive, isActive));

        if (search) {
            conditions.push(
                // Simple search by username, email, phone
                // Not using full text search here to keep it simple with drizzle
                // In production, we might want a proper WHERE (username ILIKE %... OR email ...)
                // Drizzle doesn't have an 'OR' grouping easily inside an AND array without proper construction
                // So we'll handle search separately or construct a complex query
                sql`(
                    ${drivers.username} ILIKE ${`%${search}%`} OR
                    ${drivers.email} ILIKE ${`%${search}%`} OR
                    ${drivers.phone} ILIKE ${`%${search}%`}
                 )`
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.drivers.findMany({
                where: whereClause,
                with: {
                    city: true,
                    country: true,
                    zone: true,
                },
                orderBy: orderFn(drivers[sortBy] || drivers.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: drivers.id }).from(drivers).where(whereClause),
        ]);

        // Strip password hash
        const safeData = data.map(({ passwordHash, ...rest }) => rest);

        return { data: safeData, total: countResult.length };
    }

    static async emailExists(email: string, excludeId?: string): Promise<boolean> {
        const existing = await db.query.drivers.findFirst({
            where: excludeId
                ? and(eq(drivers.email, email.toLowerCase()), sql`${drivers.id} != ${excludeId}`)
                : eq(drivers.email, email.toLowerCase()),
        });
        return !!existing;
    }

    static async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
        const existing = await db.query.drivers.findFirst({
            where: excludeId
                ? and(eq(drivers.phone, phone), sql`${drivers.id} != ${excludeId}`)
                : eq(drivers.phone, phone),
        });
        return !!existing;
    }

    static async resetPassword(id: string, newPassword: string): Promise<boolean> {
        const passwordHash = await argon2.hash(newPassword);
        const result = await db.update(drivers)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(drivers.id, id))
            .returning({ id: drivers.id });

        return result.length > 0;
    }
}
