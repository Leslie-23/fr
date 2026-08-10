import { calculatePeriodTax, calculatePresumptiveTax } from './calculate';
import { ActivityEntry } from '../entries';
import { SL_PRESUMPTIVE_2026 } from './rules';

describe('calculatePresumptiveTax', () => {
  it('is nil below the minimum turnover', () => {
    expect(calculatePresumptiveTax(0, SL_PRESUMPTIVE_2026)).toBe(0);
    expect(calculatePresumptiveTax(9_999_999, SL_PRESUMPTIVE_2026)).toBe(0);
  });

  it('applies the 10M-20M bracket: base 100,000 + 2% of excess over 10M', () => {
    // turnover 15,000,000 -> 100,000 + 2% * 5,000,000 = 200,000
    expect(calculatePresumptiveTax(15_000_000, SL_PRESUMPTIVE_2026)).toBe(200_000);
  });

  it('applies the 20M-100M bracket: base 300,000 + 4% of excess over 20M', () => {
    // turnover 50,000,000 -> 300,000 + 4% * 30,000,000 = 1,500,000
    expect(calculatePresumptiveTax(50_000_000, SL_PRESUMPTIVE_2026)).toBe(1_500_000);
  });

  it('applies the 100M-200M bracket: base 3,500,000 + 5% of excess over 100M', () => {
    // turnover 150,000,000 -> 3,500,000 + 5% * 50,000,000 = 6,000,000
    expect(calculatePresumptiveTax(150_000_000, SL_PRESUMPTIVE_2026)).toBe(6_000_000);
  });

  it('applies the 200M-350M bracket: base 8,500,000 + 6% of excess over 200M', () => {
    // turnover 300,000,000 -> 8,500,000 + 6% * 100,000,000 = 14,500,000
    expect(calculatePresumptiveTax(300_000_000, SL_PRESUMPTIVE_2026)).toBe(14_500_000);
  });

  it('is exactly the base tax at a bracket lower bound', () => {
    expect(calculatePresumptiveTax(20_000_000, SL_PRESUMPTIVE_2026)).toBe(300_000);
    expect(calculatePresumptiveTax(100_000_000, SL_PRESUMPTIVE_2026)).toBe(3_500_000);
    expect(calculatePresumptiveTax(200_000_000, SL_PRESUMPTIVE_2026)).toBe(8_500_000);
  });

  it('is exactly the top-of-bracket tax at the presumptive ceiling', () => {
    expect(calculatePresumptiveTax(350_000_000, SL_PRESUMPTIVE_2026)).toBe(17_500_000);
  });

  it('returns null above the presumptive regime ceiling (out of scope)', () => {
    expect(calculatePresumptiveTax(350_000_001, SL_PRESUMPTIVE_2026)).toBeNull();
    expect(calculatePresumptiveTax(500_000_000, SL_PRESUMPTIVE_2026)).toBeNull();
  });
});

describe('calculatePeriodTax', () => {
  const businessId = 'biz-1';

  function entry(partial: Partial<ActivityEntry>): ActivityEntry {
    return {
      id: Math.random().toString(36),
      businessId,
      entryDate: '2026-02-01',
      type: 'sale',
      amountSle: 0,
      ...partial,
    };
  }

  it('sums sale entries within the tax year and ignores expenses for the tax figure', () => {
    const entries: ActivityEntry[] = [
      entry({ entryDate: '2026-01-15', type: 'sale', amountSle: 8_000_000 }),
      entry({ entryDate: '2026-02-15', type: 'sale', amountSle: 7_000_000 }),
      entry({ entryDate: '2026-03-01', type: 'expense', amountSle: 2_000_000 }),
      // outside the tax year and outside the business — must be excluded
      entry({ entryDate: '2025-12-31', type: 'sale', amountSle: 100_000_000 }),
      entry({ businessId: 'other-biz', entryDate: '2026-02-01', type: 'sale', amountSle: 100_000_000 }),
    ];

    const result = calculatePeriodTax(entries, businessId, '2026-03-15');

    expect(result.cumulativeTurnoverSle).toBe(15_000_000);
    expect(result.periodExpensesSle).toBe(2_000_000);
    expect(result.estimatedPresumptiveTaxSle).toBe(200_000);
    expect(result.gstWarning).toBe(false);
    expect(result.abovePresumptiveThresholdWarning).toBe(false);
    expect(result.installmentDueDate).toBe('2026-03-15');
    expect(result.taxRuleSetId).toBe('SL_PRESUMPTIVE_2026');
  });

  it('flags the GST warning at the Le 200,000,000 threshold', () => {
    const entries: ActivityEntry[] = [
      entry({ entryDate: '2026-01-01', type: 'sale', amountSle: 200_000_000 }),
    ];
    const result = calculatePeriodTax(entries, businessId, '2026-06-15');
    expect(result.gstWarning).toBe(true);
  });

  it('flags above-threshold when turnover exceeds the presumptive ceiling', () => {
    const entries: ActivityEntry[] = [
      entry({ entryDate: '2026-01-01', type: 'sale', amountSle: 360_000_000 }),
    ];
    const result = calculatePeriodTax(entries, businessId, '2026-09-15');
    expect(result.abovePresumptiveThresholdWarning).toBe(true);
    expect(result.estimatedPresumptiveTaxSle).toBeNull();
  });

  it('excludes soft-deleted entries', () => {
    const entries: ActivityEntry[] = [
      entry({ entryDate: '2026-01-01', type: 'sale', amountSle: 15_000_000, deletedAt: '2026-01-02' }),
    ];
    const result = calculatePeriodTax(entries, businessId, '2026-01-31');
    expect(result.cumulativeTurnoverSle).toBe(0);
  });
});
