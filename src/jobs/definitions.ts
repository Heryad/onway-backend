export const QUEUE_NAMES = {
    PAYOUTS: 'payouts',
    DISPATCH: 'dispatch',
    SYSTEM: 'system',
} as const;

export const JOB_NAMES = {
    GENERATE_STORE_PAYOUTS: 'generate-store-payouts',
    GENERATE_DRIVER_PAYOUTS: 'generate-driver-payouts',
    FIND_DRIVER: 'find-driver',
    DRIVER_RESPONSE_TIMEOUT: 'driver-response-timeout',
    CLEANUP_EXPIRED_STORIES: 'cleanup-expired-stories',
} as const;

export interface PayoutJobData {
    periodStart?: string;
    periodEnd?: string;
    storeId?: string;
    driverId?: string;
    forced?: boolean;
}

export interface DispatchJobData {
    orderId: string;
    storeId: string;
    cityId: string;
    storeLocation?: { lat: number; lng: number };
    excludeDriverIds?: string[];
    attempt?: number;
}

export interface DriverTimeoutJobData {
    orderId: string;
    driverOrderId: string;
    driverId: string;
    attempt: number;
}
