import { eq, and, desc, SQL, sql, gte, lte } from 'drizzle-orm';
import { db, stories } from '../../db';
import type { Story, NewStory, StoryMediaType } from '../../db/schema/stories';

export interface CreateStoryInput {
    type: StoryMediaType;
    mediaUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
    productId?: string | null;
    storeId?: string | null;
    cityId?: string | null;
    countryId?: string | null;
    expiresAt?: string;
}

export interface UpdateStoryInput {
    caption?: string;
    productId?: string | null;
    expiresAt?: string;
}

export interface ListStoriesFilters {
    storeId?: string;
    adminId?: string;
    cityId?: string;
    countryId?: string;
    expired?: boolean;
    type?: StoryMediaType;
    page?: number;
    limit?: number;
}

export class StoryService {
    static async create(input: CreateStoryInput, adminId: string): Promise<Story> {
        const expiresAt = input.expiresAt
            ? new Date(input.expiresAt)
            : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h

        const [story] = await db.insert(stories).values({
            type: input.type,
            mediaUrl: input.mediaUrl,
            thumbnailUrl: input.thumbnailUrl,
            caption: input.caption,
            productId: input.productId,
            storeId: input.storeId,
            adminId: adminId,
            cityId: input.cityId,
            countryId: input.countryId,
            expiresAt,
        }).returning();

        return story;
    }

    static async getById(id: string): Promise<Story | null> {
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, id),
            with: {
                store: {
                    columns: { id: true, name: true, avatar: true },
                },
                admin: {
                    columns: { id: true, username: true },
                },
                product: {
                    columns: { id: true, name: true },
                },
                city: true,
                country: true,
            },
        });
        return story ?? null;
    }

    static async update(id: string, input: UpdateStoryInput): Promise<Story | null> {
        const updateData: Partial<NewStory> = {};

        if (input.caption !== undefined) updateData.caption = input.caption;
        if (input.productId !== undefined) updateData.productId = input.productId;
        if (input.expiresAt !== undefined) updateData.expiresAt = new Date(input.expiresAt);

        const [story] = await db.update(stories)
            .set(updateData)
            .where(eq(stories.id, id))
            .returning();

        return story ?? null;
    }

    static async delete(id: string): Promise<boolean> {
        await db.delete(stories).where(eq(stories.id, id));
        return true;
    }

    static async list(filters: ListStoriesFilters): Promise<{ data: Story[]; total: number }> {
        const {
            storeId,
            adminId,
            cityId,
            countryId,
            expired,
            type,
            page = 1,
            limit = 50,
        } = filters;

        const conditions: SQL[] = [];
        const now = new Date();

        if (storeId) conditions.push(eq(stories.storeId, storeId));
        if (adminId) conditions.push(eq(stories.adminId, adminId));
        if (cityId) conditions.push(eq(stories.cityId, cityId));
        if (countryId) conditions.push(eq(stories.countryId, countryId));
        if (type) conditions.push(eq(stories.type, type));

        if (expired === true) {
            conditions.push(lte(stories.expiresAt, now));
        } else if (expired === false) {
            conditions.push(gte(stories.expiresAt, now));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [data, countResult] = await Promise.all([
            db.query.stories.findMany({
                where: whereClause,
                with: {
                    store: {
                        columns: { id: true, name: true, avatar: true },
                    },
                    admin: {
                        columns: { id: true, username: true },
                    },
                },
                orderBy: desc(stories.createdAt),
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: stories.id }).from(stories).where(whereClause),
        ]);

        return { data, total: countResult.length };
    }

    static async cleanupExpired(): Promise<number> {
        const result = await db.delete(stories)
            .where(lte(stories.expiresAt, new Date()))
            .returning({ id: stories.id });
        return result.length;
    }
}
