import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { BulkUploadSheet } from '../components/BulkUploadSheet';
import { Fab } from '../components/Fab';
import { FeedbackOverlay, FeedbackVariant } from '../components/FeedbackOverlay';
import { ActivityType } from '../domain/entries';
import { todayIso } from '../domain/format';
import { parseCsv } from '../domain/import/csv';
import { DraftEntry } from '../domain/import/draftEntry';
import { parseReceiptText } from '../domain/import/receiptParser';
import { addEntry } from '../db/entriesRepository';
import { addCustomCategory, CustomCategory, listCustomCategories, removeCustomCategory } from '../db/categoryRepository';
import { BulkReviewScreen } from './BulkReviewScreen';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

/** ML Kit is a native module — there is no web implementation, so the "Scan receipts"
 *  option is hidden there (see BulkUploadSheet's onScanReceipts prop, below). */
const OCR_AVAILABLE = Platform.OS !== 'web';

const SALE_CATEGORIES = ['General sale', 'Service fee', 'Other income'];
const EXPENSE_CATEGORIES = ['Stock', 'Transport', 'Rent', 'Utilities', 'Wages', 'Other expense'];

interface Props {
  businessId: string;
  onSaved: () => void;
}

export function AddEntryScreen({ businessId, onSaved }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [type, setType] = useState<ActivityType>('sale');
  const [amountDigits, setAmountDigits] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountFocused, setAmountFocused] = useState(false);
  const [bulkSheetVisible, setBulkSheetVisible] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<DraftEntry[] | null>(null);
  const [reviewSkippedCount, setReviewSkippedCount] = useState(0);
  const [feedback, setFeedback] = useState<{ variant: FeedbackVariant; message: string } | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);

  const baseCategories = type === 'sale' ? SALE_CATEGORIES : EXPENSE_CATEGORIES;
  const categories = [
    ...baseCategories,
    ...customCategories.filter((c) => c.type === type).map((c) => c.label),
  ];
  const accent = type === 'sale' ? colors.sale : colors.expense;
  const amountDisplay = amountDigits ? Number(amountDigits).toLocaleString('en-US') : '';

  const loadCustomCategories = useCallback(async () => {
    setCustomCategories(await listCustomCategories(businessId));
  }, [businessId]);

  useEffect(() => {
    loadCustomCategories();
  }, [loadCustomCategories]);

  async function handleAddCategory(categoryType: ActivityType, label: string) {
    await addCustomCategory(businessId, categoryType, label);
    setAddCategoryVisible(false);
    await loadCustomCategories();
    if (categoryType === type) setCategory(label);
  }

  function handleLongPressTag(label: string) {
    const custom = customCategories.find((c) => c.type === type && c.label === label);
    if (!custom) return;
    Alert.alert('Remove category?', `"${label}" will no longer appear in your category list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeCustomCategory(custom.id);
          if (category === label) setCategory(undefined);
          await loadCustomCategories();
        },
      },
    ]);
  }

  function selectType(next: ActivityType) {
    setType(next);
    setCategory(undefined);
  }

  function handleAmountChange(text: string) {
    setAmountDigits(text.replace(/[^0-9]/g, ''));
  }

  async function handleImportCsv() {
    setBulkSheetVisible(false);
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
    });
    if (picked.canceled || picked.assets.length === 0) return;

    const file = picked.assets[0];
    try {
      const contents = await (await fetch(file.uri)).text();
      const { valid, errors } = parseCsv(contents, file.name);
      if (valid.length === 0) {
        Alert.alert('No entries found', "That file didn't have any rows I could read.");
        return;
      }
      setReviewSkippedCount(errors.length);
      setReviewDrafts(valid);
    } catch (err) {
      Alert.alert('Could not read file', String(err));
    }
  }

  async function handleScanReceipts() {
    setBulkSheetVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to scan receipts.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (picked.canceled || picked.assets.length === 0) return;

    try {
      const drafts: DraftEntry[] = [];
      let skipped = 0;
      for (let i = 0; i < picked.assets.length; i++) {
        const asset = picked.assets[i];
        const sourceLabel = asset.fileName ?? `Receipt ${i + 1}`;
        const { text } = await TextRecognition.recognize(asset.uri);
        const draft = parseReceiptText(text, sourceLabel, `receipt:${asset.assetId ?? i}`);
        if (draft) {
          drafts.push(draft);
        } else {
          skipped += 1;
        }
      }

      if (drafts.length === 0) {
        Alert.alert('No totals found', "I couldn't find an amount on any of those receipts. Try clearer photos.");
        return;
      }
      setReviewSkippedCount(skipped);
      setReviewDrafts(drafts);
    } catch (err) {
      Alert.alert('Could not scan receipts', String(err));
    }
  }

  async function handleSave() {
    const amountSle = Number(amountDigits);
    if (!amountSle || amountSle <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await addEntry({ businessId, entryDate: todayIso(), type, amountSle, category });
      setAmountDigits('');
      setCategory(undefined);
      setFeedback({ variant: 'success', message: type === 'sale' ? 'Sale saved' : 'Expense saved' });
      onSaved();
    } catch (err) {
      setFeedback({ variant: 'error', message: 'Could not save entry' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
            value={amountDisplay}
            onChangeText={handleAmountChange}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.fieldLabel}>Category (optional)</Text>
        <View style={styles.tagRow}>
          {categories.map((c) => (
            <Pressable
              key={c}
              style={[styles.tag, category === c && styles.tagActive]}
              onPress={() => setCategory(category === c ? undefined : c)}
              onLongPress={() => handleLongPressTag(c)}
            >
              <Text style={[styles.tagText, category === c && styles.tagTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.categoryInput}
          placeholder="Or type your own category"
          placeholderTextColor={colors.inkSoft}
          value={category ?? ''}
          onChangeText={(text) => setCategory(text || undefined)}
        />

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
    </KeyboardAvoidingView>

      <Fab onPress={() => setBulkSheetVisible(true)} />

      <BulkUploadSheet
        visible={bulkSheetVisible}
        onClose={() => setBulkSheetVisible(false)}
        onImportCsv={handleImportCsv}
        onScanReceipts={OCR_AVAILABLE ? handleScanReceipts : undefined}
        onAddCategory={() => {
          setBulkSheetVisible(false);
          setAddCategoryVisible(true);
        }}
      />

      <AddCategoryModal
        visible={addCategoryVisible}
        defaultType={type}
        onClose={() => setAddCategoryVisible(false)}
        onAdd={handleAddCategory}
      />

      {reviewDrafts && (
        <BulkReviewScreen
          visible
          businessId={businessId}
          drafts={reviewDrafts}
          skippedCount={reviewSkippedCount}
          onCancel={() => setReviewDrafts(null)}
          onSaved={(count) => {
            setReviewDrafts(null);
            setFeedback({ variant: 'success', message: `${count} ${count === 1 ? 'entry' : 'entries'} saved` });
            onSaved();
          }}
          onSaveError={(message) => setFeedback({ variant: 'error', message })}
        />
      )}

      <FeedbackOverlay
        visible={feedback !== null}
        variant={feedback?.variant ?? 'success'}
        message={feedback?.message ?? ''}
        onDone={() => setFeedback(null)}
      />
    </View>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
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
  categoryInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
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
