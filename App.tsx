import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AddEntryScreen } from './src/screens/AddEntryScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TaxEstimateScreen } from './src/screens/TaxEstimateScreen';
import { getOrCreateDefaultBusiness } from './src/db/businessRepository';
import { listEntries } from './src/db/entriesRepository';
import { ActivityEntry } from './src/domain/entries';
import { colors } from './src/theme/colors';
import { fontFamily, useLedgerFonts } from './src/theme/typography';

type Tab = 'add' | 'dashboard' | 'tax';

const TABS: { key: Tab; label: string }[] = [
  { key: 'add', label: 'Add' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tax', label: 'Tax estimate' },
];

function AddIcon({ tint }: { tint: string }) {
  return (
    <View style={[iconStyles.circle, { borderColor: tint }]}>
      <View style={[iconStyles.plusH, { backgroundColor: tint }]} />
      <View style={[iconStyles.plusV, { backgroundColor: tint }]} />
    </View>
  );
}

function DashboardIcon({ tint }: { tint: string }) {
  return (
    <View style={iconStyles.barsRow}>
      <View style={[iconStyles.bar, { height: 7, backgroundColor: tint }]} />
      <View style={[iconStyles.bar, { height: 11, backgroundColor: tint }]} />
      <View style={[iconStyles.bar, { height: 14, backgroundColor: tint }]} />
    </View>
  );
}

function TaxIcon({ tint }: { tint: string }) {
  return (
    <View style={[iconStyles.circle, { borderColor: tint }]}>
      <View style={[iconStyles.diagonal, { backgroundColor: tint }]} />
      <View style={[iconStyles.dot, { top: 5, left: 5, backgroundColor: tint }]} />
      <View style={[iconStyles.dot, { bottom: 5, right: 5, backgroundColor: tint }]} />
    </View>
  );
}

const ICONS: Record<Tab, (tint: string) => React.ReactElement> = {
  add: (tint) => <AddIcon tint={tint} />,
  dashboard: (tint) => <DashboardIcon tint={tint} />,
  tax: (tint) => <TaxIcon tint={tint} />,
};

export default function App() {
  const [fontsLoaded, fontError] = useLedgerFonts();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [tab, setTab] = useState<Tab>('add');

  const reloadEntries = useCallback(async (bizId: string) => {
    const rows = await listEntries(bizId);
    setEntries(rows);
  }, []);

  useEffect(() => {
    (async () => {
      const business = await getOrCreateDefaultBusiness();
      setBusinessId(business.id);
      await reloadEntries(business.id);
    })();
  }, [reloadEntries]);

  if (!businessId || (!fontsLoaded && !fontError)) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Sierra Leone · Small &amp; Micro Traders</Text>
        <View style={styles.wordmarkRow}>
          <View style={styles.mark}>
            <View style={[styles.markLine, styles.markLineWide]} />
            <View style={[styles.markLine, styles.markLineNarrow]} />
            <View style={[styles.markLine, styles.markLineWide]} />
          </View>
          <Text style={styles.wordmark}>Ledger</Text>
        </View>
      </View>

      <View style={styles.screen}>
        {tab === 'add' && (
          <AddEntryScreen businessId={businessId} onSaved={() => reloadEntries(businessId)} />
        )}
        {tab === 'dashboard' && (
          <DashboardScreen entries={entries} onEntryChanged={() => reloadEntries(businessId)} />
        )}
        {tab === 'tax' && <TaxEstimateScreen businessId={businessId} entries={entries} />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const tint = active ? colors.indigo : colors.inkSoft;
          return (
            <Pressable key={t.key} style={styles.tabButton} onPress={() => setTab(t.key)}>
              {ICONS[t.key](tint)}
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  loadingText: { fontSize: 15, color: colors.inkSoft },
  header: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  eyebrow: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.4,
    borderColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  markLine: { height: 1.4, borderRadius: 1, backgroundColor: colors.indigo },
  markLineWide: { width: 14 },
  markLineNarrow: { width: 10 },
  wordmark: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabButton: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 10, paddingBottom: 8 },
  tabLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 10.5, color: colors.inkSoft },
  tabLabelActive: { color: colors.indigo },
});

const iconStyles = StyleSheet.create({
  circle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  plusH: { position: 'absolute', width: 9, height: 1.6, borderRadius: 1 },
  plusV: { position: 'absolute', width: 1.6, height: 9, borderRadius: 1 },
  diagonal: { position: 'absolute', width: 12, height: 1.4, borderRadius: 1, transform: [{ rotate: '-45deg' }] },
  dot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: 16 },
  bar: { width: 4, borderRadius: 1 },
});
