import type { ActivityEntry } from '@domain/entries';
interface Props {
    entries: ActivityEntry[];
    onEntryChanged: () => void;
}
export declare function DashboardScreen({ entries, onEntryChanged }: Props): import("react").JSX.Element;
export {};
