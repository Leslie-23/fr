import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileCompleteness } from '../domain/profileCompleteness';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  completeness: ProfileCompleteness;
  onPress?: () => void;
}

function nudgeText(c: ProfileCompleteness): string {
  if (c.isComplete) return 'Profile complete — nicely done.';
  if (c.filledCount === 0) return `Add your ${c.missingLabels[0]} to get started.`;
  return `${c.filledCount} of ${c.totalCount} done — add your ${c.missingLabels[0]} next.`;
}

/** A small progress nudge for the business profile — tap to jump straight to editing it. */
export function ProfileProgress({ completeness, onPress }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const fillColor = completeness.isComplete ? colors.sale : colors.gold;

  return (
    <Pressable style={styles.container} onPress={onPress} disabled={!onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Profile strength</Text>
        <Text style={[styles.percent, { color: fillColor }]}>{completeness.percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${completeness.percent}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={styles.nudge}>{nudgeText(completeness)}</Text>
    </Pressable>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: {
      gap: 6,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 13,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 11.5,
      color: colors.inkSoft,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    percent: { fontFamily: fontFamily.monoSemiBold, fontSize: 13 },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3 },
    nudge: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.ink, lineHeight: 17 },
  });
