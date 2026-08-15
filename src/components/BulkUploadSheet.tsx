import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImportCsv: () => void;
  onScanReceipts?: () => void;
  onAddCategory: () => void;
}

export function BulkUploadSheet({ visible, onClose, onImportCsv, onScanReceipts, onAddCategory }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Quick actions</Text>

          <Pressable style={styles.option} onPress={onImportCsv}>
            <View style={styles.optionIcon}>
              <View style={styles.csvBar} />
              <View style={[styles.csvBar, styles.csvBarShort]} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Import CSV</Text>
              <Text style={styles.optionSubtitle}>Pick a spreadsheet of past sales and expenses</Text>
            </View>
          </Pressable>

          {onScanReceipts && (
            <Pressable style={styles.option} onPress={onScanReceipts}>
              <View style={styles.optionIcon}>
                <View style={styles.receiptOutline} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Scan receipts</Text>
                <Text style={styles.optionSubtitle}>Photograph receipts and read the totals automatically</Text>
              </View>
            </Pressable>
          )}

          <Pressable style={styles.option} onPress={onAddCategory}>
            <View style={styles.optionIcon}>
              <View style={styles.plusBarH} />
              <View style={styles.plusBarV} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Add category</Text>
              <Text style={styles.optionSubtitle}>Create your own label for sales and expenses</Text>
            </View>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 22,
      paddingTop: 12,
      gap: 4,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.lineStrong,
      marginBottom: 14,
    },
    title: {
      fontFamily: fontFamily.display,
      fontSize: 18,
      color: colors.ink,
      marginBottom: 10,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.paper,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    csvBar: { width: 18, height: 2.5, borderRadius: 1, backgroundColor: colors.indigo },
    csvBarShort: { width: 11 },
    receiptOutline: {
      width: 16,
      height: 20,
      borderRadius: 2,
      borderWidth: 1.6,
      borderColor: colors.indigo,
    },
    plusBarH: { position: 'absolute', width: 16, height: 2.5, borderRadius: 1, backgroundColor: colors.indigo },
    plusBarV: { position: 'absolute', width: 2.5, height: 16, borderRadius: 1, backgroundColor: colors.indigo },
    optionText: { flex: 1, gap: 2 },
    optionTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, color: colors.ink },
    optionSubtitle: { fontFamily: fontFamily.body, fontSize: 12, color: colors.inkSoft, lineHeight: 16 },
    cancel: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
    cancelText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.inkSoft },
  });
