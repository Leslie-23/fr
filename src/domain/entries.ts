export type ActivityType = 'sale' | 'expense';

export interface ActivityEntry {
  id: string;
  businessId: string;
  entryDate: string; // 'YYYY-MM-DD', local date
  type: ActivityType;
  amountSle: number; // integer, > 0, New Leone
  category?: string;
  note?: string;
  deletedAt?: string | null;
}

function isWithin(entry: ActivityEntry, startDate: string, endDate: string): boolean {
  return !entry.deletedAt && entry.entryDate >= startDate && entry.entryDate <= endDate;
}

export function sumByType(
  entries: ActivityEntry[],
  type: ActivityType,
  startDate: string,
  endDate: string
): number {
  return entries
    .filter((e) => e.type === type && isWithin(e, startDate, endDate))
    .reduce((total, e) => total + e.amountSle, 0);
}
