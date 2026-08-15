import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityEntry } from '../domain/entries';
import { formatLe } from '../domain/format';
import { listDeletedEntries, restoreEntry } from '../db/entriesRepository';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  businessId: string;
  onClose: () => void;
  /** Fired after a restore so the caller can reload the main entries list. */
  onRestored: () => void;
}

function formatDeletedAt(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return `Deleted ${date.toLocaleDateString()}`;
}

export function DeletedEntriesScreen({ visible, businessId, onClose, onRestored }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setEntries(await listDeletedEntries(businessId));
  }, [businessId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      await restoreEntry(id);
      await load();
      onRestored();
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 22 }]}>
          <Text style={styles.heading}>Deleted entries</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 22 }]}
          ListEmptyComponent={<Text style={styles.emptyText}>Nothing deleted — anything you remove shows up here.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowDate}>{item.entryDate}</Text>
                {item.category ? <Text style={styles.rowCategory}>{item.category}</Text> : null}
                <Text style={styles.rowDeletedAt}>{formatDeletedAt(item.deletedAt ?? null)}</Text>
              </View>
              <View style={styles.rowActions}>
                <Text style={item.type === 'sale' ? styles.salesText : styles.expenseText}>
                  {item.type === 'sale' ? '+' : '-'}
                  {formatLe(item.amountSle)}
                </Text>
                <Pressable
                  style={styles.restoreButton}
                  onPress={() => handleRestore(item.id)}
                  disabled={restoringId === item.id}
                >
                  <Text style={styles.restoreButtonText}>
                    {restoringId === item.id ? '…' : 'Restore'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingBottom: 16,
    },
    heading: { fontFamily: fontFamily.display, fontSize: 21, color: colors.ink },
    closeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.indigo },
    list: { paddingHorizontal: 22, gap: 10 },
    emptyText: {
      fontFamily: fontFamily.body,
      fontSize: 13.5,
      color: colors.inkSoft,
      lineHeight: 19,
      paddingVertical: 8,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      backgroundColor: colors.paper,
      padding: 13,
    },
    rowText: { flex: 1, gap: 2 },
    rowDate: { fontFamily: fontFamily.bodyMedium, fontSize: 13.5, color: colors.ink },
    rowCategory: { fontFamily: fontFamily.body, fontSize: 11.5, color: colors.inkSoft },
    rowDeletedAt: { fontFamily: fontFamily.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
    rowActions: { alignItems: 'flex-end', gap: 6 },
    salesText: { fontFamily: fontFamily.monoSemiBold, color: colors.sale, fontSize: 13.5 },
    expenseText: { fontFamily: fontFamily.monoSemiBold, color: colors.expense, fontSize: 13.5 },
    restoreButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.indigo,
    },
    restoreButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: colors.onFill },
  });
