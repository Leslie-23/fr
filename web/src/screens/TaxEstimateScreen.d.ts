import type { ActivityEntry } from '@domain/entries';
interface Props {
    businessId: string;
    entries: ActivityEntry[];
}
export declare function TaxEstimateScreen({ businessId, entries }: Props): import("react").JSX.Element;
export {};
