import { eq, and, desc, asc, SQL, sql } from 'drizzle-orm';
import { db, users, userAddresses } from '../../db';
import type { User, NewUser } from '../../db/schema/users';
import type { UserAddress } from '../../db/schema/user-addresses';
import { logger } from '../../lib/logger';

export interface UpdateUserInput {
    username?: string;
    email?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    birthDate?: string;
    isPrime?: boolean;
    primeExpiresAt?: string; // ISO date
    coinsBalance?: number;
    isActive?: boolean;
    cityId?: string;
    countryId?: string;
}

export interface ListUsersFilters {
    cityId?: string;
    countryId?: string;
    isPrime?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'username' | 'email';
    sortOrder?: 'asc' | 'desc';
}

export class UserService {
    static async getById(id: string): Promise<User | null> {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
                city: true,
                country: true,
            },
        });
        return user ?? null;
    }

    static async update(id: string, input: UpdateUserInput): Promise<User | null> {
        const updateData: Partial<NewUser> = { updatedAt: new Date() };

        if (input.username !== undefined) updateData.username = input.username;
        if (input.email !== undefined) updateData.email = input.email;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.gender !== undefined) updateData.gender = input.gender;
        if (input.birthDate !== undefined) updateData.birthDate = input.birthDate;
        if (input.isPrime !== undefined) updateData.isPrime = input.isPrime;
        if (input.primeExpiresAt !== undefined) updateData.primeExpiresAt = input.primeExpiresAt ? new Date(input.primeExpiresAt) : null;
        if (input.coinsBalance !== undefined) updateData.coinsBalance = input.coinsBalance;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.cityId !== undefined) updateData.cityId = input.cityId;
        if (input.countryId !== undefined) updateData.countryId = input.countryId;

        const [user] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();

        if (!user) return null;

        logger.info({ userId: id, updates: Object.keys(input) }, 'User updated by admin');
        return user;
    }

    static async list(filters: ListUsersFilters): Promise<{ data: User[]; total: number }> {
        const {
            cityId,
            countryId,
            isPrime,
            isActive,
            search,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(users.cityId, cityId));
        if (countryId) conditions.push(eq(users.countryId, countryId));
        if (isPrime !== undefined) conditions.push(eq(users.isPrime, isPrime));
        if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));

        if (search) {
            conditions.push(
                sql`(
                    ${users.username} ILIKE ${`%${search}%`} OR
                    ${users.email} ILIKE ${`%${search}%`} OR
                    ${users.phone} ILIKE ${`%${search}%`}
                 )`
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.users.findMany({
                where: whereClause,
                with: {
                    city: true,
                    country: true,
                },
                orderBy: orderFn(users[sortBy] || users.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: users.id }).from(users).where(whereClause),
        ]);

        return { data: data as User[], total: countResult.length };
    }

    static async getAddresses(userId: string): Promise<UserAddress[]> {
        const addresses = await db.query.userAddresses.findMany({
            where: eq(userAddresses.userId, userId),
            with: {
                city: true,
                country: true,
            },
            orderBy: desc(userAddresses.isDefault),
        });
        return addresses;
    }
}
