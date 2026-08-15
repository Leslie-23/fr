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

const CHECKED_FIELDS: { key: keyof ProfileFields; label: string }[] = [
  { key: 'businessName', label: 'business name' },
  { key: 'ownerName', label: 'owner name' },
  { key: 'businessType', label: 'business type' },
  { key: 'district', label: 'district' },
  { key: 'nraTin', label: 'NRA TIN' },
];

/** How much of the business profile the trader has filled in — drives the progress nudge. */
export function getProfileCompleteness(profile: ProfileFields | null): ProfileCompleteness {
  const missingLabels: string[] = [];
  let filledCount = 0;

  for (const field of CHECKED_FIELDS) {
    const value = profile?.[field.key];
    if (value && value.trim().length > 0) {
      filledCount += 1;
    } else {
      missingLabels.push(field.label);
    }
  }

  const totalCount = CHECKED_FIELDS.length;
  return {
    filledCount,
    totalCount,
    percent: Math.round((filledCount / totalCount) * 100),
    missingLabels,
    isComplete: filledCount === totalCount,
  };
}
