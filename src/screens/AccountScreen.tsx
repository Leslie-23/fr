import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackOverlay, FeedbackVariant } from '../components/FeedbackOverlay';
import { ProfileProgress } from '../components/ProfileProgress';
import { BusinessProfile, getOrCreateDefaultBusiness } from '../db/businessRepository';
import { getProfileCompleteness } from '../domain/profileCompleteness';
import { clearAccount, deactivateAccount } from '../services/authClient';
import type { AuthUser } from '../services/authClient';
import { getLastSyncedAt, runSync } from '../sync/syncEngine';
import { EditProfileScreen } from './EditProfileScreen';
import { ManageCategoriesScreen } from './ManageCategoriesScreen';
import { LedgerColors } from '../theme/colors';
import { ThemeMode, useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  businessId: string;
  authUser: AuthUser;
  onLogout: () => void;
}

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'Never synced';
  const date = new Date(iso);
  return `Last synced ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function AccountScreen({ businessId, authUser, onLogout }: Props) {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);

  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [feedback, setFeedback] = useState<{ variant: FeedbackVariant; message: string } | null>(null);

  const loadProfile = useCallback(async () => {
    setProfile(await getOrCreateDefaultBusiness());
  }, []);

  useEffect(() => {
    loadProfile();
    getLastSyncedAt().then(setLastSyncedAt);
  }, [loadProfile]);

  async function handleSyncNow() {
    setSyncing(true);
    setSyncError(null);
    const result = await runSync(businessId);
    if (result.ok) {
      setLastSyncedAt(result.syncedAt);
      setFeedback({ variant: 'success', message: 'Synced' });
    } else {
      setSyncError(result.error);
      setFeedback({ variant: 'error', message: 'Sync failed' });
    }
    setSyncing(false);
  }

  function handleLogoutPress() {
    Alert.alert('Log out?', `You'll need to log back in as ${authUser.email} to sync again.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onLogout },
    ]);
  }

  function handleDeleteAccountPress() {
    Alert.alert(
      'Delete account?',
      `This deactivates ${authUser.email} — you won't be able to log back in with it. Your sales, expenses, and business profile stay saved on this device and in your synced data; they are not erased.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: handleDeleteAccountConfirmed },
      ]
    );
  }

  async function handleDeleteAccountConfirmed() {
    setDeactivating(true);
    try {
      await deactivateAccount();
      onLogout();
    } catch {
      setFeedback({ variant: 'error', message: 'Could not delete account — try again' });
    } finally {
      setDeactivating(false);
    }
  }

  function handleClearAccountPress() {
    Alert.alert(
      'Clear account permanently?',
      `This permanently erases ${authUser.email} and everything tied to it — every sale, expense, and your business profile, both synced and on this device. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: handleClearAccountConfirmStep2 },
      ]
    );
  }

  function handleClearAccountConfirmStep2() {
    Alert.alert('Are you absolutely sure?', 'There is no way to recover this data once it is cleared.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear everything', style: 'destructive', onPress: handleClearAccountConfirmed },
    ]);
  }

  async function handleClearAccountConfirmed() {
    setClearing(true);
    try {
      await clearAccount();
      onLogout();
    } catch {
      setFeedback({ variant: 'error', message: 'Could not clear account — try again' });
    } finally {
      setClearing(false);
    }
  }

  const profileSummary = profile?.businessName || profile?.ownerName || 'Not set up yet';
  const completeness = useMemo(() => getProfileCompleteness(profile), [profile]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Account</Text>
      <Text style={styles.heading}>{authUser.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sync</Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncStatus}>
            {syncing ? 'Syncing…' : syncError ?? formatSyncedAt(lastSyncedAt)}
          </Text>
          <Pressable style={styles.syncButton} onPress={handleSyncNow} disabled={syncing}>
            <Text style={styles.syncButtonText}>{syncing ? '…' : 'Sync now'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.segmented}>
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              style={[styles.segmentOption, mode === option.key && styles.segmentOptionActive]}
              onPress={() => setMode(option.key)}
            >
              <Text style={[styles.segmentText, mode === option.key && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Business profile</Text>
        <ProfileProgress completeness={completeness} onPress={() => setEditProfileVisible(true)} />
        <Pressable style={styles.profileRow} onPress={() => setEditProfileVisible(true)}>
          <View style={styles.profileRowText}>
            <Text style={styles.profileSummary}>{profileSummary}</Text>
            {profile?.ownerName && profile.businessName && (
              <Text style={styles.profileSubtext}>{profile.ownerName}</Text>
            )}
          </View>
          <Text style={styles.editLink}>Edit profile ›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Categories</Text>
        <Pressable style={styles.profileRow} onPress={() => setManageCategoriesVisible(true)}>
          <Text style={styles.profileSummary}>Manage categories</Text>
          <Text style={styles.editLink}>Add or remove ›</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogoutPress}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>

      <Pressable
        style={[styles.deleteButton, deactivating && styles.deleteButtonDisabled]}
        onPress={handleDeleteAccountPress}
        disabled={deactivating}
      >
        <Text style={styles.deleteButtonText}>{deactivating ? 'Deleting…' : 'Delete account'}</Text>
      </Pressable>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneLabel}>Danger zone</Text>
        <Text style={styles.dangerZoneText}>
          Permanently erase your account and all its data, on this device and synced. Unlike "Delete account" above,
          this cannot be undone.
        </Text>
        <Pressable
          style={[styles.clearButton, clearing && styles.deleteButtonDisabled]}
          onPress={handleClearAccountPress}
          disabled={clearing}
        >
          <Text style={styles.clearButtonText}>{clearing ? 'Clearing…' : 'Clear account permanently'}</Text>
        </Pressable>
      </View>

      <EditProfileScreen
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
        onSaved={(updated) => setProfile(updated)}
      />

      <ManageCategoriesScreen
        visible={manageCategoriesVisible}
        businessId={businessId}
        onClose={() => setManageCategoriesVisible(false)}
      />

      <FeedbackOverlay
        visible={feedback !== null}
        variant={feedback?.variant ?? 'success'}
        message={feedback?.message ?? ''}
        onDone={() => setFeedback(null)}
      />
    </ScrollView>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 22, gap: 22, paddingBottom: 40 },
    eyebrow: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.inkSoft,
      marginBottom: -6,
    },
    heading: {
      fontFamily: fontFamily.display,
      fontSize: 21,
      color: colors.ink,
      letterSpacing: -0.2,
    },
    section: { gap: 10 },
    sectionLabel: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 12.5,
      color: colors.inkSoft,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    syncRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 13,
    },
    syncStatus: { flex: 1, fontFamily: fontFamily.body, fontSize: 13, color: colors.ink },
    syncButton: {
      backgroundColor: colors.indigo,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 9,
    },
    syncButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.onFill },
    segmented: {
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
    },
    segmentOption: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
    segmentOptionActive: { backgroundColor: colors.indigo },
    segmentText: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.inkSoft },
    segmentTextActive: { color: colors.onFill },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 13,
    },
    profileRowText: { flex: 1, gap: 2 },
    profileSummary: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.ink },
    profileSubtext: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.inkSoft },
    editLink: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.indigo },
    logoutButton: {
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.lineStrong,
    },
    logoutButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.inkSoft },
    deleteButton: {
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.expense,
    },
    deleteButtonDisabled: { opacity: 0.6 },
    deleteButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.expense },
    dangerZone: {
      gap: 8,
      borderWidth: 1,
      borderColor: colors.expense,
      borderRadius: 12,
      padding: 13,
      backgroundColor: colors.expenseSoft,
    },
    dangerZoneLabel: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 11.5,
      color: colors.expense,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    dangerZoneText: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.ink, lineHeight: 17 },
    clearButton: {
      marginTop: 4,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.expense,
    },
    clearButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 13.5, color: colors.onFill },
  });
