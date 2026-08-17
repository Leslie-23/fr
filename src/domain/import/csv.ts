import Papa from 'papaparse';
import type { ActivityType } from '../entries';
import type { DraftEntry } from './draftEntry';

export interface RowError {
  rowNumber: number;
  message: string;
}

export interface CsvParseResult {
  valid: DraftEntry[];
  errors: RowError[];
}

function normalizeDate(raw: string | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function normalizeType(raw: string | undefined): ActivityType | null {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'sale' || value === 'income' || value === 'in') return 'sale';
  if (value === 'expense' || value === 'out') return 'expense';
  return null;
}

function normalizeAmount(raw: string | undefined): number | null {
  const digits = (raw ?? '').replace(/[^0-9.]/g, '');
  const amount = Math.round(Number(digits));
  return amount > 0 ? amount : null;
}

/**
 * Parses a CSV with columns `date,type,amount,category` (category optional).
 * `date` accepts ISO (YYYY-MM-DD) or anything `Date` can parse. `type` accepts
 * sale/income/in or expense/out (case-insensitive).
 */
export function parseCsv(fileContents: string, fileName: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(fileContents, {
    header: true,
    skipEmptyLines: true,
  });

  const valid: DraftEntry[] = [];
  const errors: RowError[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1

    const entryDate = normalizeDate(row.date);
    const type = normalizeType(row.type);
    const amountSle = normalizeAmount(row.amount);

    if (!entryDate || !type || !amountSle) {
      const issues = [
        !entryDate && 'invalid date',
        !type && 'type must be "sale" or "expense"',
        !amountSle && 'amount must be greater than 0',
      ].filter((issue): issue is string => Boolean(issue));
      errors.push({ rowNumber, message: issues.join(', ') });
      return;
    }

    valid.push({
      key: `${fileName}:${rowNumber}`,
      entryDate,
      type,
      amountSle,
      category: row.category?.trim() || undefined,
      sourceLabel: `${fileName} · row ${rowNumber}`,
    });
  });

  return { valid, errors };
}
