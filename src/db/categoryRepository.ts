import * as Crypto from 'expo-crypto';
import { ActivityType } from '../domain/entries';
import { getDb } from './client';

export interface CustomCategory {
  id: string;
  type: ActivityType;
  label: string;
}

/** User-created categories for one business, both sale and expense — filter by type at the call site. */
export async function listCustomCategories(businessId: string): Promise<CustomCategory[]> {
  const db = await getDb();
  return db.getAllAsync<CustomCategory>(
    'SELECT id, type, label FROM custom_category WHERE business_id = ? ORDER BY created_at ASC',
    [businessId]
  );
}

export async function addCustomCategory(businessId: string, type: ActivityType, label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO custom_category (id, business_id, type, label, created_at) VALUES (?, ?, ?, ?, ?)',
    [Crypto.randomUUID(), businessId, type, trimmed, new Date().toISOString()]
  );
}

export async function removeCustomCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM custom_category WHERE id = ?', [id]);
}
