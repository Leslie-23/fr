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

/** Entry shape used by the sync engine — includes updated_at, which UI screens don't need. */
export interface SyncableEntry {
  id: string;
  businessId: string;
  entryDate: string;
  type: ActivityType;
  amountSle: number;
  category: string | null;
  note: string | null;
  deletedAt: string | null;
  updatedAt: string;
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
  await db.runAsync('UPDATE activity_entry SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    new Date().toISOString(),
    id,
  ]);
}

/** Deleted entries for a business, most recently deleted first — for the restore screen. */
export async function listDeletedEntries(businessId: string): Promise<ActivityEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ActivityEntryRow>(
    `SELECT * FROM activity_entry
     WHERE business_id = ? AND deleted_at IS NOT NULL
     ORDER BY deleted_at DESC`,
    [businessId]
  );
  return rows.map(fromRow);
}

export async function restoreEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE activity_entry SET deleted_at = NULL, updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    id,
  ]);
}

/** Inserts many entries in one transaction — used by CSV/receipt bulk import. */
export async function addEntries(entries: NewActivityEntry[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      if (entry.amountSle <= 0) continue;
      await db.runAsync(
        `INSERT INTO activity_entry
          (id, business_id, entry_date, type, amount_sle, category, note, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          Crypto.randomUUID(),
          entry.businessId,
          entry.entryDate,
          entry.type,
          entry.amountSle,
          entry.category ?? null,
          entry.note ?? null,
          now,
          now,
        ]
      );
    }
  });
}

/** Entries changed since the given timestamp (or all entries, if null) — for pushing to the sync server. */
export async function listEntriesUpdatedSince(businessId: string, since: string | null): Promise<SyncableEntry[]> {
  const db = await getDb();
  const rows = since
    ? await db.getAllAsync<ActivityEntryRow & { updated_at: string }>(
        'SELECT * FROM activity_entry WHERE business_id = ? AND updated_at > ?',
        [businessId, since]
      )
    : await db.getAllAsync<ActivityEntryRow & { updated_at: string }>(
        'SELECT * FROM activity_entry WHERE business_id = ?',
        [businessId]
      );
  return rows.map((row) => ({
    id: row.id,
    businessId: row.business_id,
    entryDate: row.entry_date,
    type: row.type,
    amountSle: row.amount_sle,
    category: row.category,
    note: row.note,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
  }));
}

/** Upserts an entry pulled from the sync server, but only if it's newer than the local copy (last-write-wins). */
export async function upsertEntryFromServer(entry: SyncableEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO activity_entry
      (id, business_id, entry_date, type, amount_sle, category, note, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       entry_date = excluded.entry_date,
       type = excluded.type,
       amount_sle = excluded.amount_sle,
       category = excluded.category,
       note = excluded.note,
       updated_at = excluded.updated_at,
       deleted_at = excluded.deleted_at
     WHERE excluded.updated_at > activity_entry.updated_at`,
    [
      entry.id,
      entry.businessId,
      entry.entryDate,
      entry.type,
      entry.amountSle,
      entry.category,
      entry.note,
      entry.updatedAt,
      entry.updatedAt,
      entry.deletedAt,
    ]
  );
}
