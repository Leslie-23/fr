import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBusinessForSync,
  SyncableBusiness,
  upsertBusinessFromServer,
} from '../db/businessRepository';
import { listEntriesUpdatedSince, SyncableEntry, upsertEntryFromServer } from '../db/entriesRepository';
import { apiRequest } from '../services/apiClient';

const LAST_SYNCED_KEY = 'ledger.lastSyncedAt';

interface RemoteEntry {
  _id: string;
  businessId: string;
  entryDate: string;
  type: 'sale' | 'expense';
  amountSle: number;
  category: string | null;
  note: string | null;
  deletedAt: string | null;
  updatedAt: string;
}

interface RemoteBusiness {
  _id: string;
  businessName: string | null;
  ownerName: string | null;
  businessType: string | null;
  district: string | null;
  nraTin: string | null;
  currencyCode: string;
  usesNewLeone: boolean;
  updatedAt: string;
}

export async function getLastSyncedAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNCED_KEY);
}

export type SyncResult = { ok: true; syncedAt: string } | { ok: false; error: string };

/** Two-way, last-write-wins sync of one business + its entries against the server. */
export async function runSync(businessId: string): Promise<SyncResult> {
  try {
    const since = await getLastSyncedAt();

    const business = await getBusinessForSync(businessId);
    if (business) {
      await apiRequest('/business', {
        method: 'PUT',
        body: {
          id: business.id,
          businessName: business.businessName,
          ownerName: business.ownerName,
          businessType: business.businessType,
          district: business.district,
          nraTin: business.nraTin,
          currencyCode: business.currencyCode,
          usesNewLeone: business.usesNewLeone,
        },
      });
    }

    const localChanges = await listEntriesUpdatedSince(businessId, since);
    if (localChanges.length > 0) {
      await apiRequest('/entries', {
        method: 'POST',
        body: { entries: localChanges.map(toRemoteEntry) },
      });
    }

    const remoteEntries = await apiRequest<RemoteEntry[]>(
      `/entries${since ? `?since=${encodeURIComponent(since)}` : ''}`
    );
    for (const remote of remoteEntries) {
      await upsertEntryFromServer(fromRemoteEntry(remote));
    }

    const remoteBusinesses = await apiRequest<RemoteBusiness[]>('/business');
    const remoteBusiness = remoteBusinesses.find((b) => b._id === businessId);
    if (remoteBusiness) {
      await upsertBusinessFromServer(fromRemoteBusiness(remoteBusiness));
    }

    const syncedAt = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNCED_KEY, syncedAt);
    return { ok: true, syncedAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sync failed' };
  }
}

function toRemoteEntry(entry: SyncableEntry) {
  return {
    id: entry.id,
    businessId: entry.businessId,
    entryDate: entry.entryDate,
    type: entry.type,
    amountSle: entry.amountSle,
    category: entry.category,
    note: entry.note,
    deletedAt: entry.deletedAt,
  };
}

function fromRemoteEntry(remote: RemoteEntry): SyncableEntry {
  return {
    id: remote._id,
    businessId: remote.businessId,
    entryDate: remote.entryDate,
    type: remote.type,
    amountSle: remote.amountSle,
    category: remote.category,
    note: remote.note,
    deletedAt: remote.deletedAt,
    updatedAt: remote.updatedAt,
  };
}

function fromRemoteBusiness(remote: RemoteBusiness): SyncableBusiness {
  return {
    id: remote._id,
    businessName: remote.businessName,
    ownerName: remote.ownerName,
    businessType: remote.businessType,
    district: remote.district,
    nraTin: remote.nraTin,
    currencyCode: remote.currencyCode,
    usesNewLeone: remote.usesNewLeone,
    updatedAt: remote.updatedAt,
  };
}

/** Best-effort background sync — used after local writes and on app foreground. Errors are swallowed. */
export function syncInBackground(businessId: string): void {
  runSync(businessId).catch(() => {});
}
