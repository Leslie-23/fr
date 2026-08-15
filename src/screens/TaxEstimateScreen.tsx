import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Fab, InfoIcon } from '../components/Fab';
import { calculatePeriodTax } from '../domain/tax/calculate';
import { ActivityEntry } from '../domain/entries';
import { formatLe, todayIso } from '../domain/format';
import { SL_PRESUMPTIVE_2026 } from '../domain/tax/rules';
import { TaxDetailScreen } from './TaxDetailScreen';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  businessId: string;
  entries: ActivityEntry[];
}

export function TaxEstimateScreen({ businessId, entries }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [detailVisible, setDetailVisible] = useState(false);
  const result = calculatePeriodTax(entries, businessId, todayIso());

  return (
    <View style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Presumptive tax · {result.taxYear} tax year</Text>
      <Text style={styles.heading}>What you'd owe NRA</Text>
      <Text style={styles.disclaimer}>
        An estimate to help you plan — not a filed return. Confirm with NRA or a qualified tax adviser before
        paying.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.stamp}>
          <Text style={styles.stampText}>Estimate</Text>
        </View>
        <Text style={styles.heroLabel}>Estimated presumptive tax</Text>
        <Text style={styles.heroValue}>
          {result.estimatedPresumptiveTaxSle === null ? 'Out of range' : formatLe(result.estimatedPresumptiveTaxSle)}
        </Text>
      </View>

      <View style={styles.statGrid}>
        <View style={[styles.statCard, styles.statCardPlain]}>
          <Text style={styles.statLabel}>Turnover this tax year</Text>
          <Text style={[styles.statNet, { color: colors.sale }]}>{formatLe(result.cumulativeTurnoverSle)}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPlain]}>
          <Text style={styles.statLabel}>Next installment due</Text>
          <Text style={styles.statNet}>{result.installmentDueDate}</Text>
        </View>
      </View>

      {result.abovePresumptiveThresholdWarning && (
        <View style={[styles.notice, styles.noticeStrong]}>
          <Text style={styles.noticeTitle}>Above the presumptive tax ceiling.</Text>
          <Text style={styles.noticeText}>
            Your turnover this year is over Le {SL_PRESUMPTIVE_2026.presumptiveMaxTurnoverSle.toLocaleString()}.
            Presumptive tax no longer applies — contact NRA or a tax adviser about the standard corporate tax
            regime.
          </Text>
        </View>
      )}

      {result.gstWarning && !result.abovePresumptiveThresholdWarning && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Approaching GST registration.</Text>
          <Text style={styles.noticeText}>
            Your turnover has reached the Le {SL_PRESUMPTIVE_2026.gstWarningThresholdSle.toLocaleString()}{' '}
            threshold. You may need to register for GST — check with NRA.
          </Text>
        </View>
      )}

      <Text style={styles.footnote}>
        Rates and thresholds change with each Finance Act — this app should be reviewed at the start of every tax
        year.
      </Text>
    </ScrollView>

      <Fab
        onPress={() => setDetailVisible(true)}
        accessibilityLabel="See calculation details"
        icon={<InfoIcon />}
      />

      <TaxDetailScreen visible={detailVisible} result={result} onClose={() => setDetailVisible(false)} />
    </View>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 22, gap: 14, paddingBottom: 90 },
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
  disclaimer: {
    fontFamily: fontFamily.body,
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
  },
  heroCard: {
    position: 'relative',
    gap: 6,
    backgroundColor: colors.indigo,
    borderRadius: 16,
    padding: 20,
    paddingTop: 22,
    overflow: 'hidden',
  },
  stamp: {
    position: 'absolute',
    top: 16,
    right: -28,
    transform: [{ rotate: '18deg' }],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 5,
    paddingHorizontal: 34,
    opacity: 0.85,
  },
  stampText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  heroLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(253, 252, 249, 0.78)',
  },
  heroValue: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 32,
    color: colors.onFill,
    flexShrink: 1,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: 130,
    flexShrink: 1,
    gap: 3,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
  },
  statCardPlain: { backgroundColor: colors.surface },
  statLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statNet: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 17,
    color: colors.ink,
    flexShrink: 1,
  },
  notice: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    backgroundColor: colors.goldSoft,
    borderRadius: 10,
    padding: 14,
    gap: 2,
  },
  noticeStrong: { borderLeftColor: colors.expense, backgroundColor: colors.expenseSoft },
  noticeTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  noticeText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
  footnote: {
    fontFamily: fontFamily.body,
    color: colors.inkSoft,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 6,
  },
});
