import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { CustomCategory, addCustomCategory, listCustomCategories, removeCustomCategory } from '../db/categoryRepository';
import { ActivityType } from '../domain/entries';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  businessId: string;
  onClose: () => void;
}

function CategoryGroup({
  title,
  accent,
  items,
  onRemove,
  styles,
}: {
  title: string;
  accent: string;
  items: CustomCategory[];
  onRemove: (item: CustomCategory) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: accent }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No custom categories yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Pressable onPress={() => onRemove(item)} hitSlop={8}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

export function ManageCategoriesScreen({ visible, businessId, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [addVisible, setAddVisible] = useState(false);

  const load = useCallback(async () => {
    setCategories(await listCustomCategories(businessId));
  }, [businessId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  function handleRemove(item: CustomCategory) {
    Alert.alert('Remove category?', `"${item.label}" will no longer appear in your category list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeCustomCategory(item.id);
          await load();
        },
      },
    ]);
  }

  async function handleAdd(type: ActivityType, label: string) {
    await addCustomCategory(businessId, type, label);
    setAddVisible(false);
    await load();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Manage categories</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <CategoryGroup
          title="Sale categories"
          accent={colors.sale}
          items={categories.filter((c) => c.type === 'sale')}
          onRemove={handleRemove}
          styles={styles}
        />
        <CategoryGroup
          title="Expense categories"
          accent={colors.expense}
          items={categories.filter((c) => c.type === 'expense')}
          onRemove={handleRemove}
          styles={styles}
        />

        <Pressable style={styles.addButton} onPress={() => setAddVisible(true)}>
          <Text style={styles.addButtonText}>Add category</Text>
        </Pressable>
      </ScrollView>

      <AddCategoryModal visible={addVisible} onClose={() => setAddVisible(false)} onAdd={handleAdd} />
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 22, gap: 22, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heading: { fontFamily: fontFamily.display, fontSize: 21, color: colors.ink },
    closeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.indigo },
    group: { gap: 8 },
    groupTitle: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    emptyText: { fontFamily: fontFamily.body, fontSize: 13, color: colors.inkSoft, paddingVertical: 4 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
      backgroundColor: colors.paper,
    },
    rowLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 14, color: colors.ink },
    removeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12.5, color: colors.expense },
    addButton: {
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.indigo,
    },
    addButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.onFill },
  });
