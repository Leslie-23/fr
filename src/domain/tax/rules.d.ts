export interface TaxBracket {
    lowerBoundSle: number;
    upperBoundSle: number | null;
    baseTaxSle: number;
    excessOverSle: number;
    ratePercent: number;
    label: string;
}
export interface TaxRuleSet {
    id: string;
    countryCode: 'SL';
    taxYear: number;
    currencyCode: 'SLE';
    presumptiveMinTurnoverSle: number;
    presumptiveMaxTurnoverSle: number;
    gstWarningThresholdSle: number;
    gstRatePercent: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    sourceNote: string;
    brackets: TaxBracket[];
}
/**
 * Sierra Leone Small and Micro Taxpayer presumptive tax regime, 2026.
 * Source: nra.gov.sl small-and-micro-taxpayer-regime page (see docs/tech-architecture-draft.md).
 * Verify against the current Finance Act before each tax year — thresholds/rates change annually.
 */
export declare const SL_PRESUMPTIVE_2026: TaxRuleSet;
export declare function getActiveTaxRuleSet(countryCode: 'SL', taxYear: number): TaxRuleSet;
