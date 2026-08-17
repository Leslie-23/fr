import type { DraftEntry } from './draftEntry';
/**
 * Turns raw OCR text from a receipt photo into a draft entry. Returns null when no
 * plausible total could be found — the caller should skip that photo rather than
 * guess. Always defaults `type` to 'expense': receipts are overwhelmingly purchases.
 */
export declare function parseReceiptText(rawText: string, sourceLabel: string, key: string): DraftEntry | null;
