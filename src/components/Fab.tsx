import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  onPress: () => void;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}

/** Floating action button. Defaults to the upload glyph (bulk-entry flows); pass `icon` to override. */
export function Fab({ onPress, accessibilityLabel = 'Bulk upload', icon }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable style={styles.fab} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {icon ?? <UploadIcon />}
    </Pressable>
  );
}

export function UploadIcon() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.iconColumn}>
      <View style={styles.arrowHead} />
      <View style={styles.arrowStem} />
      <View style={styles.tray} />
    </View>
  );
}

export function InfoIcon() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.iconColumn}>
      <View style={styles.infoDot} />
      <View style={styles.infoBar} />
    </View>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.indigo,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 6,
    },
    iconColumn: { alignItems: 'center' },
    // A CSS-triangle: zero-size box whose visible "fill" comes from one colored border edge
    // with the adjacent edges transparent — reliable for a precise point, unlike rotating and
    // hand-aligning two separate bars.
    arrowHead: {
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderBottomWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: colors.onFill,
    },
    arrowStem: {
      width: 2,
      height: 9,
      marginTop: -1,
      backgroundColor: colors.onFill,
    },
    tray: {
      marginTop: 6,
      width: 20,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.onFill,
    },
    infoDot: {
      width: 3.6,
      height: 3.6,
      borderRadius: 1.8,
      backgroundColor: colors.onFill,
      marginBottom: 4,
    },
    infoBar: {
      width: 2.4,
      height: 12,
      borderRadius: 1.2,
      backgroundColor: colors.onFill,
    },
  });
