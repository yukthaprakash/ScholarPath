import { describe, it, expect } from 'vitest';
import { matchScheme } from '../../engine/src/core/matchScheme.js';
import { StudentProfile, Scheme } from '../../engine/src/types.js';
import schemeData from '../../data/schemes/karnataka-pratibha-puraskar.json';

const scheme = schemeData as unknown as Scheme;

const eligibleProfile: StudentProfile = {
  id: 'golden-pratibha-eligible',
  academic: {
    educationLevel: 'UNDERGRADUATE',
    courseName: 'B.Sc Computer Science',
    currentYear: 3,
    scorePercentage: 84,
    instituteType: 'GOVERNMENT',
    instituteState: 'KARNATAKA',
    isInstituteGovtRegistered: true,
  },
  personal: {
    age: 20,
    gender: 'FEMALE',
    casteCategory: 'OBC',
    isDisability: false,
  },
  demographics: { domicileState: 'KARNATAKA' },
  financial: { annualHouseholdIncome: 200000 },
  certificates: [
    { type: 'MARKSHEET', isAvailable: true, status: 'VALID' },
    { type: 'CASTE_CERTIFICATE', isAvailable: true, status: 'VALID' },
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
  id: 'golden-pratibha-near-miss',
  certificates: [
    { type: 'CASTE_CERTIFICATE', isAvailable: true, status: 'VALID' },
    { type: 'DOMICILE_CERTIFICATE', isAvailable: true, status: 'VALID' },
  ],
};

const failProfile: StudentProfile = {
  ...eligibleProfile,
  id: 'golden-pratibha-fail',
  academic: {
    ...eligibleProfile.academic,
    currentYear: 1, // Non-actionable: must be in Year 3 or higher
  },
};

describe('Golden Profiles: Karnataka Pratibha Puraskar', () => {
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

