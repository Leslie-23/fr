import type { ActivityEntry } from '../entries';
import type { TaxRuleSet } from './rules';
/**
 * Presumptive tax is levied on gross turnover, not profit — expenses never reduce it.
 * Returns null when turnover is above the presumptive-regime ceiling: the UI must
 * show an out-of-scope warning rather than a figure in that case.
 */
export declare function calculatePresumptiveTax(turnover: number, ruleSet: TaxRuleSet): number | null;
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
export declare function calculatePeriodTax(entries: ActivityEntry[], businessId: string, periodEndDate: string): PeriodTaxResult;
