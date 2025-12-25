import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { db, cityZones } from '../../db';
import type { CityZone, NewCityZone } from '../../db/schema/city-zones';
import { logger } from '../../lib/logger';

export interface CreateCityZoneInput {
    name: string;
    cityId: string;
    extraDeliveryFee?: string;
    geoPolygon: [number, number][];
}

export interface UpdateCityZoneInput {
    name?: string;
    extraDeliveryFee?: string;
    geoPolygon?: [number, number][];
    isActive?: boolean;
}

export interface ListCityZonesFilters {
    cityId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
}

export class CityZoneService {
    static async create(input: CreateCityZoneInput): Promise<CityZone> {
        const [zone] = await db.insert(cityZones).values({
            name: input.name,
            cityId: input.cityId,
            extraDeliveryFee: input.extraDeliveryFee ?? '0',
            geoPolygon: input.geoPolygon,
        }).returning();

        logger.info({ zoneId: zone.id, cityId: zone.cityId }, 'City zone created');
        return zone;
    }

    static async getById(id: string): Promise<CityZone | null> {
        const zone = await db.query.cityZones.findFirst({
            where: eq(cityZones.id, id),
            with: { city: true },
        });
        return zone ?? null;
    }

    static async update(id: string, input: UpdateCityZoneInput): Promise<CityZone | null> {
        const updateData: Partial<NewCityZone> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.extraDeliveryFee !== undefined) updateData.extraDeliveryFee = input.extraDeliveryFee;
        if (input.geoPolygon !== undefined) updateData.geoPolygon = input.geoPolygon;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [zone] = await db.update(cityZones)
            .set(updateData)
            .where(eq(cityZones.id, id))
            .returning();

        if (!zone) return null;

        logger.info({ zoneId: id }, 'City zone updated');
        return zone;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(cityZones)
            .where(eq(cityZones.id, id))
            .returning({ id: cityZones.id });

        if (result.length > 0) {
            logger.info({ zoneId: id }, 'City zone deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListCityZonesFilters = {}): Promise<{ data: CityZone[]; total: number }> {
        const {
            cityId,
            isActive,
            page = 1,
            limit = 50,
            sortOrder = 'asc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) {
            conditions.push(eq(cityZones.cityId, cityId));
        }

        if (isActive !== undefined) {
            conditions.push(eq(cityZones.isActive, isActive));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.cityZones.findMany({
                where: whereClause,
                with: { city: true },
                orderBy: orderFn(cityZones.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: cityZones.id }).from(cityZones).where(whereClause),
        ]);

        return {
            data,
            total: countResult.length,
        };
    }
}
