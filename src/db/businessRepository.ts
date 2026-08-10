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
