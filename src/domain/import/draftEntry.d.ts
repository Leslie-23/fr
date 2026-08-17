import type { ActivityType } from '../entries';
/** An entry pending review before it's saved — produced by CSV import or receipt OCR. */
export interface DraftEntry {
    key: string;
    entryDate: string;
    type: ActivityType;
    amountSle: number;
    category?: string;
    sourceLabel: string;
}
