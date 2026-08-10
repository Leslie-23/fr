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
];

/** Opens (or returns the cached) app database and applies any pending migrations. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('sme_tax_log.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      for (const migration of MIGRATIONS) {
        await db.execAsync(migration);
      }
      return db;
    })();
  }
  return dbPromise;
}
