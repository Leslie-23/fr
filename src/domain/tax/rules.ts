export interface TaxBracket {
  lowerBoundSle: number;
  upperBoundSle: number | null; // null = open-ended
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
  effectiveFrom: string; // ISO date
  effectiveTo: string | null;
  sourceNote: string;
  brackets: TaxBracket[];
}

/**
 * Sierra Leone Small and Micro Taxpayer presumptive tax regime, 2026.
 * Source: nra.gov.sl small-and-micro-taxpayer-regime page (see docs/tech-architecture-draft.md).
 * Verify against the current Finance Act before each tax year — thresholds/rates change annually.
 */
export const SL_PRESUMPTIVE_2026: TaxRuleSet = {
  id: 'SL_PRESUMPTIVE_2026',
  countryCode: 'SL',
  taxYear: 2026,
  currencyCode: 'SLE',
  presumptiveMinTurnoverSle: 10_000_000,
  presumptiveMaxTurnoverSle: 350_000_000,
  gstWarningThresholdSle: 200_000_000,
  gstRatePercent: 15,
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  sourceNote: 'NRA Small and Micro Taxpayer Regime, cross-checked against Finance Act 2026',
  brackets: [
    {
      lowerBoundSle: 0,
      upperBoundSle: 10_000_000,
      baseTaxSle: 0,
      excessOverSle: 0,
      ratePercent: 0,
      label: 'Under Le 10,000,000',
    },
    {
      lowerBoundSle: 10_000_000,
      upperBoundSle: 20_000_000,
      baseTaxSle: 100_000,
      excessOverSle: 10_000_000,
      ratePercent: 2,
      label: 'Le 10,000,000 to Le 20,000,000',
    },
    {
      lowerBoundSle: 20_000_000,
      upperBoundSle: 100_000_000,
      baseTaxSle: 300_000,
      excessOverSle: 20_000_000,
      ratePercent: 4,
      label: 'Le 20,000,000 to Le 100,000,000',
    },
    {
      lowerBoundSle: 100_000_000,
      upperBoundSle: 200_000_000,
      baseTaxSle: 3_500_000,
      excessOverSle: 100_000_000,
      ratePercent: 5,
      label: 'Le 100,000,000 to Le 200,000,000',
    },
    {
      lowerBoundSle: 200_000_000,
      upperBoundSle: 350_000_000,
      baseTaxSle: 8_500_000,
      excessOverSle: 200_000_000,
      ratePercent: 6,
      label: 'Le 200,000,000 to Le 350,000,000',
    },
  ],
};

export function getActiveTaxRuleSet(countryCode: 'SL', taxYear: number): TaxRuleSet {
  if (countryCode === 'SL' && taxYear === 2026) return SL_PRESUMPTIVE_2026;
  throw new Error(`No tax rule set registered for ${countryCode} ${taxYear}`);
}
