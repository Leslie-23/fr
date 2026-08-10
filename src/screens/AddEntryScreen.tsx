import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityType } from '../domain/entries';
import { todayIso } from '../domain/format';
import { addEntry } from '../db/entriesRepository';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

const SALE_CATEGORIES = ['General sale', 'Service fee', 'Other income'];
const EXPENSE_CATEGORIES = ['Stock', 'Transport', 'Rent', 'Utilities', 'Wages', 'Other expense'];

interface Props {
  businessId: string;
  onSaved: () => void;
}

export function AddEntryScreen({ businessId, onSaved }: Props) {
  const [type, setType] = useState<ActivityType>('sale');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountFocused, setAmountFocused] = useState(false);

  const categories = type === 'sale' ? SALE_CATEGORIES : EXPENSE_CATEGORIES;
  const accent = type === 'sale' ? colors.sale : colors.expense;

  function selectType(next: ActivityType) {
    setType(next);
    setCategory(undefined);
  }

  async function handleSave() {
    const amountSle = Math.round(Number(amountText.replace(/[^0-9.]/g, '')));
    if (!amountSle || amountSle <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await addEntry({ businessId, entryDate: todayIso(), type, amountSle, category });
      setAmountText('');
      setCategory(undefined);
      onSaved();
    } catch (err) {
      Alert.alert('Could not save entry', String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>Today, {todayIso()}</Text>
      <Text style={styles.heading}>What happened?</Text>

      <View style={styles.segmented}>
        <Pressable
          style={[styles.segmentOption, type === 'sale' && { backgroundColor: colors.sale }]}
          onPress={() => selectType('sale')}
        >
          <Text style={[styles.segmentText, type === 'sale' && styles.segmentTextActive]}>Money in</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentOption, type === 'expense' && { backgroundColor: colors.expense }]}
          onPress={() => selectType('expense')}
        >
          <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>Money out</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Amount</Text>
      <View
        style={[
          styles.amountField,
          amountFocused && { borderColor: accent },
        ]}
      >
        <Text style={styles.currencyPrefix}>Le</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.inkSoft}
          value={amountText}
          onChangeText={setAmountText}
          onFocus={() => setAmountFocused(true)}
          onBlur={() => setAmountFocused(false)}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.fieldLabel}>Category, optional</Text>
      <View style={styles.tagRow}>
        {categories.map((c) => (
          <Pressable
            key={c}
            style={[styles.tag, category === c && styles.tagActive]}
            onPress={() => setCategory(category === c ? undefined : c)}
          >
            <Text style={[styles.tagText, category === c && styles.tagTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: accent }, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving…' : `Save ${type === 'sale' ? 'sale' : 'expense'}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 22, gap: 14, paddingBottom: 32 },
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
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14.5,
    color: colors.inkSoft,
  },
  segmentTextActive: { color: colors.onFill },
  fieldLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: 4,
    marginBottom: -6,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.paper,
  },
  currencyPrefix: {
    fontFamily: fontFamily.mono,
    fontSize: 20,
    color: colors.inkSoft,
  },
  amountInput: {
    flex: 1,
    padding: 0,
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 26,
    color: colors.ink,
  },
  errorText: {
    fontFamily: fontFamily.body,
    color: colors.expense,
    fontSize: 12.5,
    marginTop: -6,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  tagActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  tagText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  tagTextActive: { color: colors.onFill },
  saveButton: {
    marginTop: 6,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 15,
    color: colors.onFill,
  },
});
