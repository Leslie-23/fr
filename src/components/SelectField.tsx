import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
}

interface WithOnSelect extends Props {
  onSelect: (value: string) => void;
}

/** A compact tap-to-open dropdown, styled like the app's text inputs — opens a bottom-sheet list. */
export function SelectField({ label, value, placeholder, options, onSelect }: WithOnSelect) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={value ? styles.value : styles.placeholder} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <View style={styles.chevron} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabber} />
            <Text style={styles.title}>{label}</Text>
            <ScrollView style={styles.optionList} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option === value;
                return (
                  <Pressable
                    key={option}
                    style={styles.option}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                    {active && <View style={styles.activeDot} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.lineStrong,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 12,
      backgroundColor: colors.paper,
    },
    value: { flex: 1, fontFamily: fontFamily.body, fontSize: 14, color: colors.ink },
    placeholder: { flex: 1, fontFamily: fontFamily.body, fontSize: 14, color: colors.inkSoft },
    chevron: {
      width: 0,
      height: 0,
      marginLeft: 8,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 5,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: colors.inkSoft,
    },
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 22,
      paddingTop: 12,
      maxHeight: '70%',
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.lineStrong,
      marginBottom: 14,
    },
    title: { fontFamily: fontFamily.display, fontSize: 18, color: colors.ink, marginBottom: 8 },
    optionList: { flexGrow: 0 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    optionText: { fontFamily: fontFamily.body, fontSize: 15, color: colors.ink },
    optionTextActive: { fontFamily: fontFamily.bodySemiBold, color: colors.indigo },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.indigo },
  });
