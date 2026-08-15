import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { firstDayOfTaxYear, startOfMonth, startOfQuarter } from '../domain/dates';
import { ActivityEntry, sumByType } from '../domain/entries';
import { formatLe, todayIso } from '../domain/format';
import { softDeleteEntry } from '../db/entriesRepository';
import { DeletedEntriesScreen } from './DeletedEntriesScreen';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  businessId: string;
  entries: ActivityEntry[];
  onEntryChanged: () => void;
}

type DashboardStyles = ReturnType<typeof createStyles>;

function StatCard({
  label,
  entries,
  start,
  end,
  colors,
  styles,
}: {
  label: string;
  entries: ActivityEntry[];
  start: string;
  end: string;
  colors: LedgerColors;
  styles: DashboardStyles;
}) {
  const sales = sumByType(entries, 'sale', start, end);
  const expenses = sumByType(entries, 'expense', start, end);
  const net = sales - expenses;
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statNet, { color: net >= 0 ? colors.sale : colors.expense }]}>{formatLe(net)}</Text>
      <View style={styles.statBreakdown}>
        <Text style={styles.salesText}>+{formatLe(sales)}</Text>
        <Text style={styles.expenseText}>-{formatLe(expenses)}</Text>
      </View>
    </View>
  );
}

function relativeDate(entryDate: string, today: string): string {
  if (entryDate === today) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);
  if (entryDate === yesterdayIso) return 'Yesterday';
  return entryDate;
}

export function DashboardScreen({ businessId, entries, onEntryChanged }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const today = todayIso();
  const [deletedVisible, setDeletedVisible] = useState(false);

  function handleDelete(entry: ActivityEntry) {
    Alert.alert(
      'Delete entry?',
      `${entry.type === 'sale' ? 'Sale' : 'Expense'} of ${formatLe(entry.amountSle)} on ${entry.entryDate}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await softDeleteEntry(entry.id);
            onEntryChanged();
          },
        },
      ]
    );
  }

  return (
    <>
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={
        <>
          <Text style={styles.eyebrow}>Ledger summary</Text>
          <Text style={styles.heading}>How business is going</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statGrid}
          >
            <StatCard label="Today" entries={entries} start={today} end={today} colors={colors} styles={styles} />
            <StatCard
              label="This month"
              entries={entries}
              start={startOfMonth(today)}
              end={today}
              colors={colors}
              styles={styles}
            />
            <StatCard
              label="This quarter"
              entries={entries}
              start={startOfQuarter(today)}
              end={today}
              colors={colors}
              styles={styles}
            />
            <StatCard
              label="Year to date"
              entries={entries}
              start={firstDayOfTaxYear(today)}
              end={today}
              colors={colors}
              styles={styles}
            />
          </ScrollView>

          <View style={styles.listHeadingRow}>
            <Text style={styles.listHeading}>Recent entries</Text>
            <Pressable onPress={() => setDeletedVisible(true)}>
              <Text style={styles.deletedLink}>Deleted entries ›</Text>
            </Pressable>
          </View>
          {entries.length === 0 && (
            <Text style={styles.emptyText}>Nothing logged yet. Use the Add tab to record your first sale or expense.</Text>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.entryRow}>
          <View>
            <Text style={styles.entryDate}>{relativeDate(item.entryDate, today)}</Text>
            {item.category ? <Text style={styles.entryCategory}>{item.category}</Text> : null}
          </View>
          <View style={styles.entryActions}>
            <Text style={item.type === 'sale' ? styles.salesText : styles.expenseText}>
              {item.type === 'sale' ? '+' : '-'}
              {formatLe(item.amountSle)}
            </Text>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
              hitSlop={8}
              accessibilityLabel="Delete entry"
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>
      )}
    />

    <DeletedEntriesScreen
      visible={deletedVisible}
      businessId={businessId}
      onClose={() => setDeletedVisible(false)}
      onRestored={onEntryChanged}
    />
    </>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 22, paddingBottom: 32 },
  eyebrow: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: 4,
  },
  heading: {
    fontFamily: fontFamily.display,
    fontSize: 21,
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 12,
  },
  statCard: {
    width: 158,
    gap: 3,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
  },
  statLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statNet: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 17,
    color: colors.ink,
    flexShrink: 1,
  },
  statBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 1 },
  listHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
  listHeading: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  deletedLink: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12.5,
    color: colors.indigo,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.inkSoft,
    fontSize: 13.5,
    lineHeight: 19,
    paddingVertical: 8,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 10,
  },
  entryDate: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 13.5,
    color: colors.ink,
  },
  entryCategory: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 1,
  },
  entryActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 },
  salesText: { fontFamily: fontFamily.monoSemiBold, color: colors.sale, fontSize: 13.5, flexShrink: 1 },
  expenseText: { fontFamily: fontFamily.monoSemiBold, color: colors.expense, fontSize: 13.5, flexShrink: 1 },
  deleteButton: {
    padding: 5,
    borderRadius: 6,
  },
  deleteButtonText: { color: colors.inkSoft, fontSize: 12 },
});
