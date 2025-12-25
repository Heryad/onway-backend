import { eq, and, desc, SQL } from 'drizzle-orm';
import { db, paymentOptions } from '../../db';
import type { PaymentOption, NewPaymentOption } from '../../db/schema/payment-options';

export interface CreatePaymentOptionInput {
    name: string;
    description?: string;
    avatar?: string;
    gateway?: string;
    fee?: string;
    feeType?: 'fixed' | 'percent';
    countryId: string;
    sorting?: string;
}

export interface UpdatePaymentOptionInput extends Partial<CreatePaymentOptionInput> {
    isActive?: boolean;
}

export interface ListPaymentOptionsFilters {
    countryId?: string;
    isActive?: boolean;
    gateway?: string;
}

export class PaymentOptionService {
    static async create(input: CreatePaymentOptionInput): Promise<PaymentOption> {
        const [option] = await db.insert(paymentOptions).values({
            name: input.name,
            description: input.description,
            avatar: input.avatar,
            gateway: input.gateway,
            fee: input.fee ?? '0',
            feeType: input.feeType ?? 'fixed',
            countryId: input.countryId,
            sorting: input.sorting ?? '0',
        }).returning();

        return option;
    }

    static async getById(id: string): Promise<PaymentOption | null> {
        const option = await db.query.paymentOptions.findFirst({
            where: eq(paymentOptions.id, id),
            with: { country: true },
        });
        return option ?? null;
    }

    static async update(id: string, input: UpdatePaymentOptionInput): Promise<PaymentOption | null> {
        const updateData: Partial<NewPaymentOption> = { updatedAt: new Date() };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.gateway !== undefined) updateData.gateway = input.gateway;
        if (input.fee !== undefined) updateData.fee = input.fee;
        if (input.feeType !== undefined) updateData.feeType = input.feeType;
        if (input.countryId !== undefined) updateData.countryId = input.countryId;
        if (input.sorting !== undefined) updateData.sorting = input.sorting;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [option] = await db.update(paymentOptions)
            .set(updateData)
            .where(eq(paymentOptions.id, id))
            .returning();

        return option ?? null;
    }

    static async delete(id: string): Promise<boolean> {
        await db.delete(paymentOptions).where(eq(paymentOptions.id, id));
        return true;
    }

    static async list(filters: ListPaymentOptionsFilters): Promise<PaymentOption[]> {
        const { countryId, isActive, gateway } = filters;

        const conditions: SQL[] = [];

        if (countryId) conditions.push(eq(paymentOptions.countryId, countryId));
        if (isActive !== undefined) conditions.push(eq(paymentOptions.isActive, isActive));
        if (gateway) conditions.push(eq(paymentOptions.gateway, gateway));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db.query.paymentOptions.findMany({
            where: whereClause,
            with: { country: { columns: { id: true, name: true } } },
            orderBy: desc(paymentOptions.sorting),
        });

        return data;
    }
}
