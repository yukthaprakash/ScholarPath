import { describe, it, expect } from 'vitest';
import { matchScheme } from '../../engine/src/core/matchScheme.js';
import { StudentProfile, Scheme } from '../../engine/src/types.js';
import schemeData from '../../data/schemes/nsp-nmmss.json';

const scheme = schemeData as unknown as Scheme;

const eligibleProfile: StudentProfile = {
  id: 'golden-nmmss-eligible',
  academic: {
    educationLevel: 'SCHOOL_CLASS_9_10',
    courseName: 'Class 9',
    currentYear: 1,
    scorePercentage: 68,
    instituteType: 'GOVERNMENT',
    instituteState: 'KARNATAKA',
    isInstituteGovtRegistered: true,
  },
  personal: {
    age: 14,
    gender: 'FEMALE',
    casteCategory: 'GENERAL',
    isDisability: false,
  },
  demographics: { domicileState: 'KARNATAKA' },
  financial: { annualHouseholdIncome: 200000 },
  certificates: [
    { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'VALID' },
    { type: 'MARKSHEET', isAvailable: true, status: 'VALID' },
    { type: 'BONAFIDE_CERTIFICATE', isAvailable: true, status: 'VALID' },
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
  id: 'golden-nmmss-near-miss',
  certificates: [
    { type: 'MARKSHEET', isAvailable: true, status: 'VALID' },
    { type: 'BONAFIDE_CERTIFICATE', isAvailable: true, status: 'VALID' },
  ],
};

const failProfile: StudentProfile = {
  ...eligibleProfile,
  id: 'golden-nmmss-fail',
  academic: {
    ...eligibleProfile.academic,
    instituteType: 'PRIVATE', // Non-actionable: must be government or aided school
  },
};

describe('Golden Profiles: NSP NMMSS', () => {
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

