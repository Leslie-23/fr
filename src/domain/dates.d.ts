/** All dates are local calendar dates in 'YYYY-MM-DD' form; the app does not deal in timezones. */
export declare function taxYearForDate(isoDate: string): number;
export declare function firstDayOfTaxYear(isoDate: string): string;
export type Quarter = 1 | 2 | 3 | 4;
export declare function quarterForDate(isoDate: string): Quarter;
export declare function installmentDueDate(isoDate: string): string;
export declare function startOfMonth(isoDate: string): string;
export declare function startOfQuarter(isoDate: string): string;
