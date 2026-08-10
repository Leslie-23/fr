import type { ActivityEntry, ActivityType } from '@domain/entries';
export interface NewActivityEntry {
    businessId: string;
    entryDate: string;
    type: ActivityType;
    amountSle: number;
    category?: string;
    note?: string;
}
export declare function addEntry(entry: NewActivityEntry): ActivityEntry;
/** Returns all non-deleted entries for a business, most recent first. */
export declare function listEntries(businessId: string): ActivityEntry[];
export declare function softDeleteEntry(id: string): void;
