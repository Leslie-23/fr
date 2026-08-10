export type ActivityType = 'sale' | 'expense';
export interface ActivityEntry {
    id: string;
    businessId: string;
    entryDate: string;
    type: ActivityType;
    amountSle: number;
    category?: string;
    note?: string;
    deletedAt?: string | null;
}
export declare function sumByType(entries: ActivityEntry[], type: ActivityType, startDate: string, endDate: string): number;
