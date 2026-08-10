import * as Crypto from 'expo-crypto';
import { ActivityEntry, ActivityType } from '../domain/entries';
import { getDb } from './client';

interface ActivityEntryRow {
  id: string;
  business_id: string;
  entry_date: string;
  type: ActivityType;
  amount_sle: number;
  category: string | null;
  note: string | null;
  deleted_at: string | null;
}

function fromRow(row: ActivityEntryRow): ActivityEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    entryDate: row.entry_date,
    type: row.type,
    amountSle: row.amount_sle,
    category: row.category ?? undefined,
    note: row.note ?? undefined,
    deletedAt: row.deleted_at,
  };
}

export interface NewActivityEntry {
  businessId: string;
  entryDate: string;
  type: ActivityType;
  amountSle: number;
  category?: string;
  note?: string;
}

export async function addEntry(entry: NewActivityEntry): Promise<ActivityEntry> {
  if (entry.amountSle <= 0) {
    throw new Error('amountSle must be greater than 0');
  }
  const db = await getDb();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO activity_entry
      (id, business_id, entry_date, type, amount_sle, category, note, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [id, entry.businessId, entry.entryDate, entry.type, entry.amountSle, entry.category ?? null, entry.note ?? null, now, now]
  );
  return { id, deletedAt: null, ...entry };
}

/** Returns all non-deleted entries for a business, most recent first. Fine for v1 data volumes. */
export async function listEntries(businessId: string): Promise<ActivityEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ActivityEntryRow>(
    `SELECT * FROM activity_entry
     WHERE business_id = ? AND deleted_at IS NULL
     ORDER BY entry_date DESC, created_at DESC`,
    [businessId]
  );
  return rows.map(fromRow);
}

export async function softDeleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE activity_entry SET deleted_at = ? WHERE id = ?', [new Date().toISOString(), id]);
}
