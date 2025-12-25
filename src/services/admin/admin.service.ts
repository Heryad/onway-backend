import { eq, like, and, desc, asc, SQL } from 'drizzle-orm';
import argon2 from 'argon2';
import { db, admins } from '../../db';
import type { Admin, NewAdmin, AdminRole } from '../../db/schema/admins';
import { logger } from '../../lib/logger';

// Create admin input
export interface CreateAdminInput {
    username: string;
    email: string;
    password: string;
    role: AdminRole;
    avatar?: string;
    countryId?: string;
    cityId?: string;
}

// Update admin input
export interface UpdateAdminInput {
    username?: string;
    email?: string;
    password?: string;
    role?: AdminRole;
    avatar?: string;
    countryId?: string | null;
    cityId?: string | null;
    isActive?: boolean;
}

// List admins filters
export interface ListAdminsFilters {
    search?: string;
    role?: AdminRole;
    isActive?: boolean;
    countryId?: string;
    cityId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'username' | 'email';
    sortOrder?: 'asc' | 'desc';
}

// Safe admin data (without password)
export type AdminSafe = Omit<Admin, 'passwordHash'>;

const toSafeAdmin = (admin: Admin): AdminSafe => {
    const { passwordHash, ...safe } = admin;
    return safe;
};

export class AdminService {
    // Create new admin
    static async create(input: CreateAdminInput): Promise<AdminSafe> {
        const passwordHash = await argon2.hash(input.password);

        const [admin] = await db.insert(admins).values({
            username: input.username,
            email: input.email.toLowerCase(),
            passwordHash,
            role: input.role,
            avatar: input.avatar,
            countryId: input.countryId,
            cityId: input.cityId,
        }).returning();

        logger.info({ adminId: admin.id, role: admin.role }, 'Admin created');

        return toSafeAdmin(admin);
    }

    // Get admin by ID
    static async getById(id: string): Promise<AdminSafe | null> {
        const admin = await db.query.admins.findFirst({
            where: eq(admins.id, id),
            with: {
                country: true,
                city: true,
            },
        });

        if (!admin) return null;
        return toSafeAdmin(admin);
    }

    // Get admin by email
    static async getByEmail(email: string): Promise<Admin | null> {
        const admin = await db.query.admins.findFirst({
            where: eq(admins.email, email.toLowerCase()),
        });
        return admin ?? null;
    }

    // Get admin by username
    static async getByUsername(username: string): Promise<Admin | null> {
        const admin = await db.query.admins.findFirst({
            where: eq(admins.username, username),
        });
        return admin ?? null;
    }

    // Update admin
    static async update(id: string, input: UpdateAdminInput): Promise<AdminSafe | null> {
        const updateData: Partial<NewAdmin> = {
            updatedAt: new Date(),
        };

        if (input.username !== undefined) updateData.username = input.username;
        if (input.email !== undefined) updateData.email = input.email.toLowerCase();
        if (input.role !== undefined) updateData.role = input.role;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.countryId !== undefined) updateData.countryId = input.countryId;
        if (input.cityId !== undefined) updateData.cityId = input.cityId;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        if (input.password) {
            updateData.passwordHash = await argon2.hash(input.password);
        }

        const [admin] = await db.update(admins)
            .set(updateData)
            .where(eq(admins.id, id))
            .returning();

        if (!admin) return null;

        logger.info({ adminId: id }, 'Admin updated');

        return toSafeAdmin(admin);
    }

    // Delete admin
    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(admins)
            .where(eq(admins.id, id))
            .returning({ id: admins.id });

        if (result.length > 0) {
            logger.info({ adminId: id }, 'Admin deleted');
            return true;
        }

        return false;
    }

    // List admins with filters and pagination
    static async list(filters: ListAdminsFilters = {}): Promise<{ data: AdminSafe[]; total: number }> {
        const {
            search,
            role,
            isActive,
            countryId,
            cityId,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (search) {
            conditions.push(
                like(admins.username, `%${search}%`)
            );
        }

        if (role) {
            conditions.push(eq(admins.role, role));
        }

        if (isActive !== undefined) {
            conditions.push(eq(admins.isActive, isActive));
        }

        if (countryId) {
            conditions.push(eq(admins.countryId, countryId));
        }

        if (cityId) {
            conditions.push(eq(admins.cityId, cityId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const orderColumn = admins[sortBy];
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.admins.findMany({
                where: whereClause,
                with: {
                    country: true,
                    city: true,
                },
                orderBy: orderFn(orderColumn),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: admins.id }).from(admins).where(whereClause),
        ]);

        return {
            data: data.map(toSafeAdmin),
            total: countResult.length,
        };
    }

    // Check if email exists
    static async emailExists(email: string, excludeId?: string): Promise<boolean> {
        const admin = await db.query.admins.findFirst({
            where: excludeId
                ? and(eq(admins.email, email.toLowerCase()), eq(admins.id, excludeId))
                : eq(admins.email, email.toLowerCase()),
        });
        return !!admin;
    }

    // Check if username exists
    static async usernameExists(username: string, excludeId?: string): Promise<boolean> {
        const admin = await db.query.admins.findFirst({
            where: excludeId
                ? and(eq(admins.username, username), eq(admins.id, excludeId))
                : eq(admins.username, username),
        });
        return !!admin;
    }
}
