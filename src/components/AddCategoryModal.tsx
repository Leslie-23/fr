import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityType } from '../domain/entries';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  defaultType?: ActivityType;
  onClose: () => void;
  onAdd: (type: ActivityType, label: string) => void;
}

export function AddCategoryModal({ visible, defaultType = 'sale', onClose, onAdd }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [type, setType] = useState<ActivityType>(defaultType);
  const [label, setLabel] = useState('');

  // Reset to the caller's suggested type each time the modal is (re)opened.
  useEffect(() => {
    if (visible) setType(defaultType);
  }, [visible, defaultType]);

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(type, trimmed);
    setLabel('');
  }

  function handleClose() {
    setLabel('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>New category</Text>
          <Text style={styles.subtitle}>Pick a short, clear name, and whether it's for sales or expenses.</Text>

          <View style={styles.segmented}>
            <Pressable
              style={[styles.segmentOption, type === 'sale' && { backgroundColor: colors.sale }]}
              onPress={() => setType('sale')}
            >
              <Text style={[styles.segmentText, type === 'sale' && styles.segmentTextActive]}>Sale category</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentOption, type === 'expense' && { backgroundColor: colors.expense }]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>
                Expense category
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="e.g. Storage fees"
            placeholderTextColor={colors.inkSoft}
            value={label}
            onChangeText={setLabel}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.addButton, !label.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!label.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      gap: 6,
    },
    title: { fontFamily: fontFamily.display, fontSize: 18, color: colors.ink },
    subtitle: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.inkSoft, lineHeight: 17, marginBottom: 8 },
    segmented: {
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      marginBottom: 10,
    },
    segmentOption: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
    segmentText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12.5, color: colors.inkSoft },
    segmentTextActive: { color: colors.onFill },
    input: {
      borderWidth: 1.5,
      borderColor: colors.lineStrong,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontFamily: fontFamily.body,
      fontSize: 15,
      color: colors.ink,
      backgroundColor: colors.paper,
    },
    buttonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.lineStrong,
    },
    cancelButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.inkSoft },
    addButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.indigo },
    addButtonDisabled: { opacity: 0.5 },
    addButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.onFill },
  });
