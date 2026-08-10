/** All dates are local calendar dates in 'YYYY-MM-DD' form; the app does not deal in timezones. */

export function taxYearForDate(isoDate: string): number {
  return Number(isoDate.slice(0, 4));
}

export function firstDayOfTaxYear(isoDate: string): string {
  return `${taxYearForDate(isoDate)}-01-01`;
}

export type Quarter = 1 | 2 | 3 | 4;

export function quarterForDate(isoDate: string): Quarter {
  const month = Number(isoDate.slice(5, 7));
  return (Math.floor((month - 1) / 3) + 1) as Quarter;
}

const INSTALLMENT_DUE_MONTH_DAY: Record<Quarter, string> = {
  1: '03-15',
  2: '06-15',
  3: '09-15',
  4: '12-15',
};

export function installmentDueDate(isoDate: string): string {
  const year = taxYearForDate(isoDate);
  const quarter = quarterForDate(isoDate);
  return `${year}-${INSTALLMENT_DUE_MONTH_DAY[quarter]}`;
}

export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function startOfQuarter(isoDate: string): string {
  const year = taxYearForDate(isoDate);
  const quarter = quarterForDate(isoDate);
  const startMonth = (quarter - 1) * 3 + 1;
  return `${year}-${String(startMonth).padStart(2, '0')}-01`;
}
