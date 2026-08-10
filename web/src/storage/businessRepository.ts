import { readJson, writeJson } from './localStore';

export interface BusinessProfile {
  id: string;
  businessName: string | null;
  ownerName: string | null;
  nraTin: string | null;
  currencyCode: string;
}

const KEY = 'sme_tax_log.business_profile';

/** V1 supports exactly one business profile per browser, same as the mobile app. */
export function getOrCreateDefaultBusiness(): BusinessProfile {
  const existing = readJson<BusinessProfile | null>(KEY, null);
  if (existing) return existing;

  const profile: BusinessProfile = {
    id: crypto.randomUUID(),
    businessName: null,
    ownerName: null,
    nraTin: null,
    currencyCode: 'SLE',
  };
  writeJson(KEY, profile);
  return profile;
}

export function updateBusinessProfile(updates: Partial<Omit<BusinessProfile, 'id' | 'currencyCode'>>): BusinessProfile {
  const current = getOrCreateDefaultBusiness();
  const updated = { ...current, ...updates };
  writeJson(KEY, updated);
  return updated;
}
