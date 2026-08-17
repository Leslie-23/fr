export interface ProfileFields {
    businessName?: string | null;
    ownerName?: string | null;
    businessType?: string | null;
    district?: string | null;
    nraTin?: string | null;
}
export interface ProfileCompleteness {
    filledCount: number;
    totalCount: number;
    percent: number;
    missingLabels: string[];
    isComplete: boolean;
}
/** How much of the business profile the trader has filled in — drives the progress nudge. */
export declare function getProfileCompleteness(profile: ProfileFields | null): ProfileCompleteness;
