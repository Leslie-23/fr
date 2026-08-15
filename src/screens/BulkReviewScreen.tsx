import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addEntries } from '../db/entriesRepository';
import { ActivityType } from '../domain/entries';
import { DraftEntry } from '../domain/import/draftEntry';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  businessId: string;
  drafts: DraftEntry[];
  skippedCount?: number;
  onCancel: () => void;
  onSaved: (count: number) => void;
  onSaveError: (message: string) => void;
}

export function BulkReviewScreen({
  visible,
  businessId,
  drafts,
  skippedCount,
  onCancel,
  onSaved,
  onSaveError,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<DraftEntry[]>(drafts);
  const [saving, setSaving] = useState(false);

  // Reset local editable rows whenever a fresh batch is presented.
  useEffect(() => setRows(drafts), [drafts]);

  function updateRow(key: string, patch: Partial<DraftEntry>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function toggleType(key: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, type: row.type === 'sale' ? 'expense' : ('sale' as ActivityType) } : row
      )
    );
  }

  async function handleConfirm() {
    if (rows.length === 0) return;
    setSaving(true);
    try {
      await addEntries(
        rows.map((row) => ({
          businessId,
          entryDate: row.entryDate,
          type: row.type,
          amountSle: row.amountSle,
          category: row.category,
        }))
      );
      onSaved(rows.length);
    } catch {
      onSaveError('Could not save these entries');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 22 }]}>
          <Text style={styles.heading}>Review {rows.length} entries</Text>
          {!!skippedCount && (
            <Text style={styles.skippedNote}>
              {skippedCount} row{skippedCount === 1 ? '' : 's'} skipped — couldn't be read
            </Text>
          )}
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.sourceLabel} numberOfLines={1}>
                  {item.sourceLabel}
                </Text>
                <Pressable onPress={() => removeRow(item.key)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>

              <View style={styles.rowFields}>
                <Pressable
                  style={[styles.typeBadge, item.type === 'sale' ? styles.typeBadgeSale : styles.typeBadgeExpense]}
                  onPress={() => toggleType(item.key)}
                >
                  <Text style={styles.typeBadgeText}>{item.type === 'sale' ? 'Money in' : 'Money out'}</Text>
                </Pressable>
                <TextInput
                  style={styles.dateInput}
                  value={item.entryDate}
                  onChangeText={(text) => updateRow(item.key, { entryDate: text })}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={styles.amountField}>
                  <Text style={styles.currencyPrefix}>Le</Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={String(item.amountSle)}
                    onChangeText={(text) =>
                      updateRow(item.key, { amountSle: Number(text.replace(/[^0-9]/g, '')) || 0 })
                    }
                  />
                </View>
                <TextInput
                  style={styles.categoryInput}
                  placeholder="Category (optional)"
                  placeholderTextColor={colors.inkSoft}
                  value={item.category ?? ''}
                  onChangeText={(text) => updateRow(item.key, { category: text || undefined })}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No rows left to save.</Text>}
        />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <Pressable style={styles.cancelButton} onPress={onCancel} disabled={saving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, (saving || rows.length === 0) && styles.saveButtonDisabled]}
            onPress={handleConfirm}
            disabled={saving || rows.length === 0}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : `Save ${rows.length} entries`}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 12, gap: 4 },
    heading: { fontFamily: fontFamily.display, fontSize: 20, color: colors.ink },
    skippedNote: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.expense },
    list: { paddingHorizontal: 22, paddingBottom: 16, gap: 12 },
    row: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      backgroundColor: colors.paper,
      padding: 12,
      gap: 8,
    },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sourceLabel: { flex: 1, fontFamily: fontFamily.body, fontSize: 11.5, color: colors.inkSoft },
    removeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: colors.expense },
    rowFields: { flexDirection: 'row', gap: 8 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, justifyContent: 'center' },
    typeBadgeSale: { backgroundColor: colors.saleSoft },
    typeBadgeExpense: { backgroundColor: colors.expenseSoft },
    typeBadgeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: colors.ink },
    dateInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.lineStrong,
      borderRadius: 9,
      paddingHorizontal: 10,
      fontFamily: fontFamily.body,
      fontSize: 13,
      color: colors.ink,
      backgroundColor: colors.surface,
    },
    amountField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.lineStrong,
      borderRadius: 9,
      paddingHorizontal: 10,
      backgroundColor: colors.surface,
    },
    currencyPrefix: { fontFamily: fontFamily.mono, fontSize: 13, color: colors.inkSoft },
    amountInput: { flex: 1, paddingVertical: 8, fontFamily: fontFamily.monoSemiBold, fontSize: 13, color: colors.ink },
    categoryInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.lineStrong,
      borderRadius: 9,
      paddingHorizontal: 10,
      fontFamily: fontFamily.body,
      fontSize: 13,
      color: colors.ink,
      backgroundColor: colors.surface,
    },
    emptyText: { fontFamily: fontFamily.body, fontSize: 13.5, color: colors.inkSoft, paddingTop: 20, textAlign: 'center' },
    footer: {
      flexDirection: 'row',
      gap: 10,
      padding: 22,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.lineStrong },
    cancelButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.inkSoft },
    saveButton: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.indigo },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.onFill },
  });
