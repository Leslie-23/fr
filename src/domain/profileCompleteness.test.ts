import { getProfileCompleteness } from './profileCompleteness';

describe('getProfileCompleteness', () => {
  it('is 0% for a null profile, missing all five fields', () => {
    const result = getProfileCompleteness(null);
    expect(result).toEqual({
      filledCount: 0,
      totalCount: 5,
      percent: 0,
      missingLabels: ['business name', 'owner name', 'business type', 'district', 'NRA TIN'],
      isComplete: false,
    });
  });

  it('counts only non-blank fields as filled', () => {
    const result = getProfileCompleteness({
      businessName: 'Kamara Provisions',
      ownerName: '  ',
      businessType: null,
      district: 'Bo',
      nraTin: undefined,
    });
    expect(result.filledCount).toBe(2);
    expect(result.percent).toBe(40);
    expect(result.missingLabels).toEqual(['owner name', 'business type', 'NRA TIN']);
    expect(result.isComplete).toBe(false);
  });

  it('is complete when all five fields are filled', () => {
    const result = getProfileCompleteness({
      businessName: 'Kamara Provisions',
      ownerName: 'Fatmata Kamara',
      businessType: 'Retail',
      district: 'Bo',
      nraTin: 'TIN123',
    });
    expect(result.isComplete).toBe(true);
    expect(result.percent).toBe(100);
    expect(result.missingLabels).toEqual([]);
  });
});
