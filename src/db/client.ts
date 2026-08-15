import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const MIGRATIONS = [
  `
  CREATE TABLE IF NOT EXISTS business_profile (
    id TEXT PRIMARY KEY,
    business_name TEXT,
    owner_name TEXT,
    business_type TEXT,
    district TEXT,
    nra_tin TEXT,
    currency_code TEXT NOT NULL DEFAULT 'SLE',
    uses_new_leone INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_entry (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    entry_date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'expense')),
    amount_sle INTEGER NOT NULL CHECK (amount_sle > 0),
    category TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_activity_entry_business_date
    ON activity_entry (business_id, entry_date);
  `,
  `
  CREATE TABLE IF NOT EXISTS custom_category (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
];

/**
 * custom_category originally shipped without `type` (categories were shared across sale/
 * expense). CREATE TABLE IF NOT EXISTS above is a no-op on devices that already created the
 * table, so the column has to be added separately for those installs to catch up — and since
 * SQLite's ALTER TABLE has no "ADD COLUMN IF NOT EXISTS" form, existence has to be checked in
 * code via PRAGMA table_info first. ALTER TABLE also can't add a UNIQUE constraint
 * retroactively, so a separate unique index (safe to CREATE IF NOT EXISTS either way) does
 * that job instead.
 */
async function ensureCustomCategoryTypeColumn(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(custom_category);');
  const hasType = columns.some((c) => c.name === 'type');
  if (!hasType) {
    await db.execAsync("ALTER TABLE custom_category ADD COLUMN type TEXT NOT NULL DEFAULT 'sale';");
  }
  await db.execAsync(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_category_unique ON custom_category (business_id, type, label);'
  );
}

/** Opens (or returns the cached) app database and applies any pending migrations. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('sme_tax_log.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      for (const migration of MIGRATIONS) {
        await db.execAsync(migration);
      }
      await ensureCustomCategoryTypeColumn(db);
      return db;
    })();
  }
  return dbPromise;
}

/**
 * Wipes every local row — used when clearing an account (hard delete), so leftover local
 * data can't later re-sync onto a different account signed into the same device.
 */
export async function resetLocalDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM activity_entry; DELETE FROM business_profile; DELETE FROM custom_category;');
}
