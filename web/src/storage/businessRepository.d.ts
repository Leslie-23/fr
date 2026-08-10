export interface BusinessProfile {
    id: string;
    businessName: string | null;
    ownerName: string | null;
    nraTin: string | null;
    currencyCode: string;
}
/** V1 supports exactly one business profile per browser, same as the mobile app. */
export declare function getOrCreateDefaultBusiness(): BusinessProfile;
export declare function updateBusinessProfile(updates: Partial<Omit<BusinessProfile, 'id' | 'currencyCode'>>): BusinessProfile;
