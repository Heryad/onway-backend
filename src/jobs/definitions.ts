export const QUEUE_NAMES = {
    PAYOUTS: 'payouts',
} as const;

export const JOB_NAMES = {
    GENERATE_STORE_PAYOUTS: 'generate-store-payouts',
    GENERATE_DRIVER_PAYOUTS: 'generate-driver-payouts',
} as const;

export interface PayoutJobData {
    periodStart?: string; // YYYY-MM-DD
    periodEnd?: string;   // YYYY-MM-DD
    storeId?: string;     // Optional: Single store run
    driverId?: string;    // Optional: Single driver run
    forced?: boolean;
}
