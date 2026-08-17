import type { DraftEntry } from './draftEntry';
export interface RowError {
    rowNumber: number;
    message: string;
}
export interface CsvParseResult {
    valid: DraftEntry[];
    errors: RowError[];
}
/**
 * Parses a CSV with columns `date,type,amount,category` (category optional).
 * `date` accepts ISO (YYYY-MM-DD) or anything `Date` can parse. `type` accepts
 * sale/income/in or expense/out (case-insensitive).
 */
export declare function parseCsv(fileContents: string, fileName: string): CsvParseResult;
