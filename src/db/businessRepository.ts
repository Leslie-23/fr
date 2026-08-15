import * as Crypto from 'expo-crypto';
import { getDb } from './client';

export interface BusinessProfile {
  id: string;
  businessName: string | null;
  ownerName: string | null;
  businessType: string | null;
  district: string | null;
  nraTin: string | null;
  currencyCode: string;
  usesNewLeone: boolean;
}

interface BusinessProfileRow {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  business_type: string | null;
  district: string | null;
  nra_tin: string | null;
  currency_code: string;
  uses_new_leone: number;
}

function fromRow(row: BusinessProfileRow): BusinessProfile {
  return {
    id: row.id,
    businessName: row.business_name,
    ownerName: row.owner_name,
    businessType: row.business_type,
    district: row.district,
    nraTin: row.nra_tin,
    currencyCode: row.currency_code,
    usesNewLeone: row.uses_new_leone === 1,
  };
}

/**
 * V1 supports exactly one business profile per install. This returns the existing
 * one or creates a blank default so the app never needs a blocking onboarding gate.
 */
export async function getOrCreateDefaultBusiness(): Promise<BusinessProfile> {
  const db = await getDb();
  const existing = await db.getFirstAsync<BusinessProfileRow>(
    'SELECT * FROM business_profile ORDER BY created_at LIMIT 1'
  );
  if (existing) return fromRow(existing);

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO business_profile
      (id, business_name, owner_name, business_type, district, nra_tin, currency_code, uses_new_leone, created_at, updated_at)
     VALUES (?, NULL, NULL, NULL, NULL, NULL, 'SLE', 1, ?, ?)`,
    [id, now, now]
  );
  return {
    id,
    businessName: null,
    ownerName: null,
    businessType: null,
    district: null,
    nraTin: null,
    currencyCode: 'SLE',
    usesNewLeone: true,
  };
}

export interface SyncableBusiness extends BusinessProfile {
  updatedAt: string;
}

/** Business profile including updated_at — for pushing to the sync server. */
export async function getBusinessForSync(id: string): Promise<SyncableBusiness | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BusinessProfileRow & { updated_at: string }>(
    'SELECT * FROM business_profile WHERE id = ?',
    [id]
  );
  return row ? { ...fromRow(row), updatedAt: row.updated_at } : null;
}

/** Upserts a business profile pulled from the sync server, but only if newer than the local copy. */
export async function upsertBusinessFromServer(business: SyncableBusiness): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO business_profile
      (id, business_name, owner_name, business_type, district, nra_tin, currency_code, uses_new_leone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       business_name = excluded.business_name,
       owner_name = excluded.owner_name,
       business_type = excluded.business_type,
       district = excluded.district,
       nra_tin = excluded.nra_tin,
       currency_code = excluded.currency_code,
       uses_new_leone = excluded.uses_new_leone,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at > business_profile.updated_at`,
    [
      business.id,
      business.businessName,
      business.ownerName,
      business.businessType,
      business.district,
      business.nraTin,
      business.currencyCode,
      business.usesNewLeone ? 1 : 0,
      business.updatedAt,
      business.updatedAt,
    ]
  );
}

export async function updateBusinessProfile(
  id: string,
  updates: Partial<Pick<BusinessProfile, 'businessName' | 'ownerName' | 'businessType' | 'district' | 'nraTin'>>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE business_profile SET
      business_name = COALESCE(?, business_name),
      owner_name = COALESCE(?, owner_name),
      business_type = COALESCE(?, business_type),
      district = COALESCE(?, district),
      nra_tin = COALESCE(?, nra_tin),
      updated_at = ?
     WHERE id = ?`,
    [
      updates.businessName ?? null,
      updates.ownerName ?? null,
      updates.businessType ?? null,
      updates.district ?? null,
      updates.nraTin ?? null,
      now,
      id,
    ]
  );
}
