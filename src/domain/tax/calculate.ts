import { firstDayOfTaxYear, installmentDueDate, taxYearForDate } from '../dates';
import type { ActivityEntry } from '../entries';
import { sumByType } from '../entries';
import type { TaxRuleSet } from './rules';
import { getActiveTaxRuleSet } from './rules';

/**
 * Presumptive tax is levied on gross turnover, not profit — expenses never reduce it.
 * Returns null when turnover is above the presumptive-regime ceiling: the UI must
 * show an out-of-scope warning rather than a figure in that case.
 */
export function calculatePresumptiveTax(turnover: number, ruleSet: TaxRuleSet): number | null {
  if (turnover < ruleSet.presumptiveMinTurnoverSle) return 0;
  if (turnover > ruleSet.presumptiveMaxTurnoverSle) return null;

  const bracket = ruleSet.brackets.find(
    (b) => turnover >= b.lowerBoundSle && (b.upperBoundSle === null || turnover <= b.upperBoundSle)
  );
  if (!bracket) {
    throw new Error(`No tax bracket found for turnover ${turnover} in rule set ${ruleSet.id}`);
  }

  const tax = bracket.baseTaxSle + ((turnover - bracket.excessOverSle) * bracket.ratePercent) / 100;
  return Math.round(tax);
}

export interface PeriodTaxResult {
  cumulativeTurnoverSle: number;
  periodExpensesSle: number;
  estimatedPresumptiveTaxSle: number | null;
  gstWarning: boolean;
  abovePresumptiveThresholdWarning: boolean;
  installmentDueDate: string;
  taxRuleSetId: string;
}

/**
 * Cumulative turnover from the start of the tax year through periodEndDate, evaluated
 * against the presumptive tax brackets. periodExpenses covers the same window and is
 * informational only (it does not affect the tax figure).
 */
export function calculatePeriodTax(
  entries: ActivityEntry[],
  businessId: string,
  periodEndDate: string
): PeriodTaxResult {
  const taxYear = taxYearForDate(periodEndDate);
  const ruleSet = getActiveTaxRuleSet('SL', taxYear);
  const taxYearStart = firstDayOfTaxYear(periodEndDate);

  const businessEntries = entries.filter((e) => e.businessId === businessId);
  const cumulativeTurnoverSle = sumByType(businessEntries, 'sale', taxYearStart, periodEndDate);
  const periodExpensesSle = sumByType(businessEntries, 'expense', taxYearStart, periodEndDate);

  const estimatedPresumptiveTaxSle = calculatePresumptiveTax(cumulativeTurnoverSle, ruleSet);

  return {
    cumulativeTurnoverSle,
    periodExpensesSle,
    estimatedPresumptiveTaxSle,
    gstWarning: cumulativeTurnoverSle >= ruleSet.gstWarningThresholdSle,
    abovePresumptiveThresholdWarning: cumulativeTurnoverSle > ruleSet.presumptiveMaxTurnoverSle,
    installmentDueDate: installmentDueDate(periodEndDate),
    taxRuleSetId: ruleSet.id,
  };
}
