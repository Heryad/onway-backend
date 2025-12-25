import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { db, sections } from '../../db';
import type { Section, NewSection } from '../../db/schema/sections';
import { logger } from '../../lib/logger';

export interface CreateSectionInput {
    name: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string;
    sorting?: number;
    comingSoon?: boolean;
    cityId?: string;
    countryId?: string;
}

export interface UpdateSectionInput {
    name?: Record<string, string>;
    description?: Record<string, string>;
    avatar?: string;
    sorting?: number;
    comingSoon?: boolean;
    isActive?: boolean;
}

export interface ListSectionsFilters {
    cityId?: string;
    countryId?: string;
    isActive?: boolean;
    comingSoon?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
}

export class SectionService {
    static async create(input: CreateSectionInput): Promise<Section> {
        const [section] = await db.insert(sections).values({
            name: input.name,
            description: input.description,
            avatar: input.avatar,
            sorting: input.sorting ?? 0,
            comingSoon: input.comingSoon ?? false,
            cityId: input.cityId,
            countryId: input.countryId,
        }).returning();

        logger.info({ sectionId: section.id }, 'Section created');
        return section;
    }

    static async getById(id: string): Promise<Section | null> {
        const section = await db.query.sections.findFirst({
            where: eq(sections.id, id),
            with: { city: true, country: true },
        });
        return section ?? null;
    }

    static async update(id: string, input: UpdateSectionInput): Promise<Section | null> {
        const updateData: Partial<NewSection> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.comingSoon !== undefined) updateData.comingSoon = input.comingSoon;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [section] = await db.update(sections)
            .set(updateData)
            .where(eq(sections.id, id))
            .returning();

        if (!section) return null;

        logger.info({ sectionId: id }, 'Section updated');
        return section;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(sections)
            .where(eq(sections.id, id))
            .returning({ id: sections.id });

        if (result.length > 0) {
            logger.info({ sectionId: id }, 'Section deleted');
            return true;
        }
        return false;
    }

    static async list(filters: ListSectionsFilters = {}): Promise<{ data: Section[]; total: number }> {
        const {
            cityId,
            countryId,
            isActive,
            comingSoon,
            search,
            page = 1,
            limit = 50,
            sortOrder = 'asc',
        } = filters;

        const conditions: SQL[] = [];

        if (cityId) conditions.push(eq(sections.cityId, cityId));
        if (countryId) conditions.push(eq(sections.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(sections.isActive, isActive));
        if (comingSoon !== undefined) conditions.push(eq(sections.comingSoon, comingSoon));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        const [data, countResult] = await Promise.all([
            db.query.sections.findMany({
                where: whereClause,
                with: { city: true, country: true },
                orderBy: [orderFn(sections.sorting), orderFn(sections.createdAt)],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: sections.id }).from(sections).where(whereClause),
        ]);

        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(s =>
                Object.values(s.name).some(n => n.toLowerCase().includes(searchLower))
            );
        }

        return { data: filteredData, total: countResult.length };
    }
}
