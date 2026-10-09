import { describe, it, expect } from 'vitest';
import { matchScheme } from '../../engine/src/core/matchScheme.js';
import { StudentProfile, Scheme } from '../../engine/src/types.js';
import schemeData from '../../data/schemes/nsp-central-sector-ug.json';

const scheme = schemeData as unknown as Scheme;

// 1. Eligible Golden Profile
const eligibleProfile: StudentProfile = {
  id: 'golden-nsp-eligible',
  academic: {
    educationLevel: 'UNDERGRADUATE',
    courseName: 'BSc Physics',
    currentYear: 1,
    scorePercentage: 88,
    instituteType: 'GOVERNMENT',
    instituteState: 'KARNATAKA',
    isInstituteGovtRegistered: true,
  },
  personal: {
    age: 18,
    gender: 'FEMALE',
    casteCategory: 'GENERAL',
    isDisability: false,
  },
  demographics: { domicileState: 'KARNATAKA' },
  financial: { annualHouseholdIncome: 200000 },
  certificates: [
    { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'VALID' },
    { type: 'MARKSHEET', isAvailable: true, status: 'VALID' },
  ],
  documentsReadiness: {
    isAadhaarSeededWithBank: true,
    isNameMatchingAadhaar: true,
    isDobMatchingAadhaar: true,
    isIncomeCertificateValidCurrentYear: true,
  },
};

// 2. Near-Miss Golden Profile (Missing Income Cert)
const nearMissProfile: StudentProfile = {
  ...eligibleProfile,
  id: 'golden-nsp-near-miss',
  certificates: [
    { type: 'MARKSHEET', isAvailable: true, status: 'VALID' },
  ],
};

// 3. Fail Golden Profile (Non-actionable Education Level mismatch -> NOT_MATCHED)
const failProfile: StudentProfile = {
  ...eligibleProfile,
  id: 'golden-nsp-fail',
  academic: {
    ...eligibleProfile.academic,
    educationLevel: 'POSTGRADUATE', // Scheme requires UNDERGRADUATE (Non-actionable rule failure)
  },
};

describe('Golden Profiles: NSP Central Sector UG', () => {
  it('Golden Profile 1: Match ELIGIBLE state', () => {
    const res = matchScheme(eligibleProfile, scheme, '2026-10-05');
    expect(res.state).toBe('ELIGIBLE');
    expect(res.failedRules.length).toBe(0);
  });

  it('Golden Profile 2: Match NEARLY_ELIGIBLE state', () => {
    const res = matchScheme(nearMissProfile, scheme, '2026-10-05');
    expect(res.state).toBe('NEARLY_ELIGIBLE');
    expect(res.missingActionableRules.length).toBe(1);
  });

  it('Golden Profile 3: Match NOT_MATCHED state', () => {
    const res = matchScheme(failProfile, scheme, '2026-10-05');
    expect(res.state).toBe('NOT_MATCHED');
    expect(res.failedRules.length).toBeGreaterThan(0);
  });
});
