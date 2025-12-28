import { eq, like, and, desc, asc, SQL } from 'drizzle-orm';
import { db, countries } from '../../db';
import type { Country, NewCountry } from '../../db/schema/countries';
import { logger } from '../../lib/logger';

export interface CreateCountryInput {
    name: Record<string, string>;
    phoneCode: string;
    currency: string;
    currencyCode: string;
    currencySymbol: string;
    avatar?: string;
}

export interface UpdateCountryInput {
    name?: Record<string, string>;
    phoneCode?: string;
    currency?: string;
    currencyCode?: string;
    currencySymbol?: string;
    avatar?: string;
    isActive?: boolean;
}

export interface ListCountriesFilters {
    search?: string;
    isActive?: boolean;
    countryId?: string; // For filtering by specific country (used by country admins)
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
}

export class CountryService {
    static async create(input: CreateCountryInput): Promise<Country> {
        const [country] = await db.insert(countries).values({
            name: input.name,
            phoneCode: input.phoneCode,
            currency: input.currency,
            currencyCode: input.currencyCode,
            currencySymbol: input.currencySymbol,
            avatar: input.avatar,
        }).returning();

        logger.info({ countryId: country.id }, 'Country created');
        return country;
    }

    static async getById(id: string): Promise<Country | null> {
        const country = await db.query.countries.findFirst({
            where: eq(countries.id, id),
        });
        return country ?? null;
    }

    static async update(id: string, input: UpdateCountryInput): Promise<Country | null> {
        const updateData: Partial<NewCountry> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.phoneCode !== undefined) updateData.phoneCode = input.phoneCode;
        if (input.currency !== undefined) updateData.currency = input.currency;
        if (input.currencyCode !== undefined) updateData.currencyCode = input.currencyCode;
        if (input.currencySymbol !== undefined) updateData.currencySymbol = input.currencySymbol;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [country] = await db.update(countries)
            .set(updateData)
            .where(eq(countries.id, id))
            .returning();

        if (!country) return null;

        logger.info({ countryId: id }, 'Country updated');
        return country;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(countries)
            .where(eq(countries.id, id))
            .returning({ id: countries.id });

        if (result.length > 0) {
            logger.info({ countryId: id }, 'Country deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListCountriesFilters = {}): Promise<{ data: Country[]; total: number }> {
        const {
            search,
            isActive,
            countryId,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const conditions: SQL[] = [];

        if (isActive !== undefined) {
            conditions.push(eq(countries.isActive, isActive));
        }

        // Filter by specific country (for country admins)
        if (countryId) {
            conditions.push(eq(countries.id, countryId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.countries.findMany({
                where: whereClause,
                orderBy: orderFn(countries[sortBy === 'name' ? 'createdAt' : sortBy]),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: countries.id }).from(countries).where(whereClause),
        ]);

        // Filter by search in application layer (JSONB search)
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
