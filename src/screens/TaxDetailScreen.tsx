import React, { useMemo } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PeriodTaxResult } from '../domain/tax/calculate';
import { formatLe } from '../domain/format';
import { SL_PRESUMPTIVE_2026 } from '../domain/tax/rules';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  result: PeriodTaxResult;
  onClose: () => void;
}

const SOURCES = [
  {
    label: 'NRA — Small and Micro Taxpayer Regime',
    url: 'https://mail.nra.gov.sl/individuals-and-partnerships/small-and-micro-taxpayer-regime',
  },
  {
    label: 'NRA — Domestic Tax / GST overview',
    url: 'https://nra.gov.sl/dtd/1',
  },
];

export function TaxDetailScreen({ visible, result, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const bracket = result.matchedBracket;
  const excessSle = bracket ? Math.max(result.cumulativeTurnoverSle - bracket.excessOverSle, 0) : 0;
  const rateAmountSle = bracket ? Math.round((excessSle * bracket.ratePercent) / 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>How this is calculated</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your calculation</Text>
          {bracket ? (
            <>
              <Text style={styles.bracketLabel}>{bracket.label} bracket</Text>
              <View style={styles.formulaBlock}>
                <Text style={styles.formulaLine}>
                  {formatLe(bracket.baseTaxSle)} base + {bracket.ratePercent}% × ({formatLe(result.cumulativeTurnoverSle)} − {formatLe(bracket.excessOverSle)})
                </Text>
                <Text style={styles.formulaLine}>
                  = {formatLe(bracket.baseTaxSle)} + {bracket.ratePercent}% × {formatLe(excessSle)}
                </Text>
                <Text style={styles.formulaLine}>
                  = {formatLe(bracket.baseTaxSle)} + {formatLe(rateAmountSle)}
                </Text>
                <Text style={styles.formulaTotal}>= {formatLe(bracket.baseTaxSle + rateAmountSle)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.formulaLine}>
              Your turnover of {formatLe(result.cumulativeTurnoverSle)} is above the{' '}
              {formatLe(SL_PRESUMPTIVE_2026.presumptiveMaxTurnoverSle)} presumptive ceiling — this regime no longer
              applies to your business.
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>All {result.taxYear} brackets</Text>
        <View style={styles.table}>
          {SL_PRESUMPTIVE_2026.brackets.map((b) => {
            const active = bracket?.label === b.label;
            return (
              <View key={b.label} style={[styles.tableRow, active && styles.tableRowActive]}>
                <View style={styles.tableRowText}>
                  <Text style={[styles.tableLabel, active && styles.tableLabelActive]}>{b.label}</Text>
                  <Text style={styles.tableDetail}>
                    {formatLe(b.baseTaxSle)} base + {b.ratePercent}% of excess
                  </Text>
                </View>
                {active && <View style={styles.activeDot} />}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Government sources</Text>
        <View style={styles.card}>
          <Text style={styles.formulaLine}>{SL_PRESUMPTIVE_2026.sourceNote}</Text>
          <Text style={styles.effectiveText}>
            Effective from {SL_PRESUMPTIVE_2026.effectiveFrom}
            {SL_PRESUMPTIVE_2026.effectiveTo ? ` to ${SL_PRESUMPTIVE_2026.effectiveTo}` : ' (current)'}. GST applies
            at {SL_PRESUMPTIVE_2026.gstRatePercent}% once turnover reaches{' '}
            {formatLe(SL_PRESUMPTIVE_2026.gstWarningThresholdSle)}.
          </Text>
          {SOURCES.map((source) => (
            <Pressable key={source.url} onPress={() => Linking.openURL(source.url)} style={styles.sourceLink}>
              <Text style={styles.sourceLinkText}>{source.label} ↗</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footnote}>
          Rates and thresholds change with each Finance Act. This is an estimate to help you plan — confirm with NRA
          or a qualified tax adviser before paying.
        </Text>
      </ScrollView>
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 22, gap: 16, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heading: { fontFamily: fontFamily.display, fontSize: 21, color: colors.ink },
    closeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.indigo },
    card: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      padding: 16,
      gap: 6,
    },
    cardLabel: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 11.5,
      color: colors.inkSoft,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    bracketLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.ink, marginTop: 2 },
    formulaBlock: { marginTop: 6, gap: 3 },
    formulaLine: { fontFamily: fontFamily.mono, fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
    formulaTotal: { fontFamily: fontFamily.monoSemiBold, fontSize: 16, color: colors.ink, marginTop: 2 },
    sectionLabel: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: colors.inkSoft,
      marginTop: 4,
    },
    table: { gap: 6 },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
      padding: 12,
      backgroundColor: colors.surface,
    },
    tableRowActive: { borderColor: colors.indigo, backgroundColor: colors.goldSoft },
    tableRowText: { gap: 2 },
    tableLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.ink },
    tableLabelActive: { color: colors.indigo },
    tableDetail: { fontFamily: fontFamily.body, fontSize: 12, color: colors.inkSoft },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.indigo },
    effectiveText: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.inkSoft, lineHeight: 18, marginTop: 4 },
    sourceLink: { marginTop: 8 },
    sourceLinkText: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.indigo },
    footnote: { fontFamily: fontFamily.body, fontSize: 11.5, color: colors.inkSoft, lineHeight: 16 },
  });
