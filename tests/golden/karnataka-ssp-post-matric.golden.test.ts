import { describe, it, expect } from 'vitest';
import { matchScheme } from '../../engine/src/core/matchScheme.js';
import { StudentProfile, Scheme } from '../../engine/src/types.js';
import schemeData from '../../data/schemes/karnataka-ssp-post-matric.json';

const scheme = schemeData as unknown as Scheme;

const eligibleProfile: StudentProfile = {
  id: 'golden-ssp-eligible',
  academic: {
    educationLevel: 'UNDERGRADUATE',
    courseName: 'B.Sc Physics',
    currentYear: 2,
    scorePercentage: 78,
    instituteType: 'GOVERNMENT',
    instituteState: 'KARNATAKA',
    isInstituteGovtRegistered: true,
  },
  personal: {
    age: 20,
    gender: 'MALE',
    casteCategory: 'SC',
    isDisability: false,
  },
  demographics: { domicileState: 'KARNATAKA' },
  financial: { annualHouseholdIncome: 180000 },
  certificates: [
    { type: 'CASTE_CERTIFICATE', isAvailable: true, status: 'VALID' },
    { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'VALID' },
    { type: 'DOMICILE_CERTIFICATE', isAvailable: true, status: 'VALID' },
  ],
  documentsReadiness: {
    isAadhaarSeededWithBank: true,
    isNameMatchingAadhaar: true,
    isDobMatchingAadhaar: true,
    isIncomeCertificateValidCurrentYear: true,
  },
};

const nearMissProfile: StudentProfile = {
  ...eligibleProfile,
  id: 'golden-ssp-near-miss',
  certificates: [
    { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'VALID' },
    { type: 'DOMICILE_CERTIFICATE', isAvailable: true, status: 'VALID' },
  ],
};

const failProfile: StudentProfile = {
  ...eligibleProfile,
  id: 'golden-ssp-fail',
  demographics: {
    domicileState: 'MAHARASHTRA', // Non-actionable: must be Karnataka domicile
  },
};

describe('Golden Profiles: Karnataka SSP Post-Matric', () => {
  it('Golden Profile 1: Match ELIGIBLE state', () => {
    const res = matchScheme(eligibleProfile, scheme, '2026-10-05');
    expect(res.state).toBe('ELIGIBLE');
  });

  it('Golden Profile 2: Match NEARLY_ELIGIBLE state', () => {
    const res = matchScheme(nearMissProfile, scheme, '2026-10-05');
    expect(res.state).toBe('NEARLY_ELIGIBLE');
  });

  it('Golden Profile 3: Match NOT_MATCHED state', () => {
    const res = matchScheme(failProfile, scheme, '2026-10-05');
    expect(res.state).toBe('NOT_MATCHED');
  });
});

