import { todayIso } from '../format';
import { DraftEntry } from './draftEntry';

const AMOUNT_REGEX = /\d{1,3}(?:[,.\s]\d{3})+(?:\.\d{2})?|\d+(?:\.\d{2})?/g;

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '');
  const value = Math.round(Number(cleaned));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Prefers a number on a "total" line (but not "subtotal"); falls back to the largest number on the receipt. */
function extractAmount(text: string): number | null {
  const lines = text.split('\n');
  const totalLine = lines.find((line) => /\btotal\b/i.test(line) && !/sub[\s-]?total/i.test(line));
  if (totalLine) {
    const amounts = (totalLine.match(AMOUNT_REGEX) ?? []).map(parseAmount).filter((a): a is number => a !== null);
    if (amounts.length > 0) return Math.max(...amounts);
  }

  const amounts = (text.match(AMOUNT_REGEX) ?? []).map(parseAmount).filter((a): a is number => a !== null);
  return amounts.length > 0 ? Math.max(...amounts) : null;
}

function extractDate(text: string): string | null {
  const iso = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (iso) {
    const [, y, m, d] = iso;
    const candidate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!Number.isNaN(new Date(candidate).getTime())) return candidate;
  }

  const dmy = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const candidate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!Number.isNaN(new Date(candidate).getTime())) return candidate;
  }

  return null;
}

/**
 * Turns raw OCR text from a receipt photo into a draft entry. Returns null when no
 * plausible total could be found — the caller should skip that photo rather than
 * guess. Always defaults `type` to 'expense': receipts are overwhelmingly purchases.
 */
export function parseReceiptText(rawText: string, sourceLabel: string, key: string): DraftEntry | null {
  const amountSle = extractAmount(rawText);
  if (amountSle === null) return null;

  return {
    key,
    entryDate: extractDate(rawText) ?? todayIso(),
    type: 'expense',
    amountSle,
    sourceLabel,
  };
}
