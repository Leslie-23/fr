import type { ActivityEntry, ActivityType } from '@domain/entries';
import { readJson, writeJson } from './localStore';

const KEY = 'sme_tax_log.entries';

export interface NewActivityEntry {
  businessId: string;
  entryDate: string;
  type: ActivityType;
  amountSle: number;
  category?: string;
  note?: string;
}

function readAll(): ActivityEntry[] {
  return readJson<ActivityEntry[]>(KEY, []);
}

export function addEntry(entry: NewActivityEntry): ActivityEntry {
  if (entry.amountSle <= 0) {
    throw new Error('amountSle must be greater than 0');
  }
  const newEntry: ActivityEntry = { id: crypto.randomUUID(), deletedAt: null, ...entry };
  const all = readAll();
  all.push(newEntry);
  writeJson(KEY, all);
  return newEntry;
}

/** Returns all non-deleted entries for a business, most recent first. */
export function listEntries(businessId: string): ActivityEntry[] {
  return readAll()
    .filter((e) => e.businessId === businessId && !e.deletedAt)
    .sort((a, b) => (a.entryDate < b.entryDate ? 1 : a.entryDate > b.entryDate ? -1 : 0));
}

export function softDeleteEntry(id: string): void {
  const all = readAll();
  const updated = all.map((e) => (e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e));
  writeJson(KEY, updated);
}
