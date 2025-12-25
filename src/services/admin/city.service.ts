import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { db, cities } from '../../db';
import type { City, NewCity } from '../../db/schema/cities';
import { logger } from '../../lib/logger';

export interface CreateCityInput {
    name: Record<string, string>;
    countryId: string;
    baseDeliveryFee?: string;
    primeDeliveryFee?: string;
    freeDeliveryThreshold?: string;
    serviceFee?: string;
    taxRate?: string;
    geoBounds?: [number, number][];
    timezone?: string;
}

export interface UpdateCityInput {
    name?: Record<string, string>;
    baseDeliveryFee?: string;
    primeDeliveryFee?: string;
    freeDeliveryThreshold?: string | null;
    serviceFee?: string;
    taxRate?: string;
    geoBounds?: [number, number][] | null;
    timezone?: string;
    isActive?: boolean;
}

export interface ListCitiesFilters {
    countryId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
}

export class CityService {
    static async create(input: CreateCityInput): Promise<City> {
        const [city] = await db.insert(cities).values({
            name: input.name,
            countryId: input.countryId,
            baseDeliveryFee: input.baseDeliveryFee ?? '0',
            primeDeliveryFee: input.primeDeliveryFee ?? '0',
            freeDeliveryThreshold: input.freeDeliveryThreshold,
            serviceFee: input.serviceFee ?? '0',
            taxRate: input.taxRate ?? '0',
            geoBounds: input.geoBounds,
            timezone: input.timezone ?? 'UTC',
        }).returning();

        logger.info({ cityId: city.id, countryId: city.countryId }, 'City created');
        return city;
    }

    static async getById(id: string): Promise<City | null> {
        const city = await db.query.cities.findFirst({
            where: eq(cities.id, id),
            with: { country: true },
        });
        return city ?? null;
    }

    static async update(id: string, input: UpdateCityInput): Promise<City | null> {
        const updateData: Partial<NewCity> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.baseDeliveryFee !== undefined) updateData.baseDeliveryFee = input.baseDeliveryFee;
        if (input.primeDeliveryFee !== undefined) updateData.primeDeliveryFee = input.primeDeliveryFee;
        if (input.freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = input.freeDeliveryThreshold;
        if (input.serviceFee !== undefined) updateData.serviceFee = input.serviceFee;
        if (input.taxRate !== undefined) updateData.taxRate = input.taxRate;
        if (input.geoBounds !== undefined) updateData.geoBounds = input.geoBounds;
        if (input.timezone !== undefined) updateData.timezone = input.timezone;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [city] = await db.update(cities)
            .set(updateData)
            .where(eq(cities.id, id))
            .returning();

        if (!city) return null;

        logger.info({ cityId: id }, 'City updated');
        return city;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(cities)
            .where(eq(cities.id, id))
            .returning({ id: cities.id });

        if (result.length > 0) {
            logger.info({ cityId: id }, 'City deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListCitiesFilters = {}): Promise<{ data: City[]; total: number }> {
        const {
            countryId,
            isActive,
            search,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (countryId) {
            conditions.push(eq(cities.countryId, countryId));
        }

        if (isActive !== undefined) {
            conditions.push(eq(cities.isActive, isActive));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.cities.findMany({
                where: whereClause,
                with: { country: true },
                orderBy: orderFn(cities[sortBy === 'name' ? 'createdAt' : sortBy]),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: cities.id }).from(cities).where(whereClause),
        ]);

        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(c =>
                Object.values(c.name).some(n => n.toLowerCase().includes(searchLower))
            );
        }

        return {
            data: filteredData,
            total: countResult.length,
        };
    }
}
