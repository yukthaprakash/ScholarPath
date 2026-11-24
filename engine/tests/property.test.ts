import { describe, it, expect } from 'vitest';
import { matchScheme } from '../src/core/matchScheme.js';
import { calculateDistance } from '../src/core/evaluateRule.js';
import { StudentProfile, Scheme, EducationLevel, CasteCategory, Gender } from '../src/types.js';

const educationLevels: EducationLevel[] = [
  'SCHOOL_CLASS_1_8',
  'SCHOOL_CLASS_9_10',
  'SCHOOL_CLASS_11_12',
  'DIPLOMA',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'DOCTORAL',
  'POST_DOCTORAL',
];

const castes: CasteCategory[] = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'MINORITIES'];
const genders: Gender[] = ['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER'];
const states = ['KARNATAKA', 'MAHARASHTRA', 'ASSAM', 'DELHI', 'TAMIL_NADU', 'KERALA'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomProfile(id: number): StudentProfile {
  return {
    id: `fuzz-student-${id}`,
    academic: {
      educationLevel: randomChoice(educationLevels),
      courseName: 'General Studies',
      currentYear: Math.floor(Math.random() * 4) + 1,
      scorePercentage: Math.floor(Math.random() * 100),
      instituteType: Math.random() > 0.5 ? 'GOVERNMENT' : 'PRIVATE',
      instituteState: randomChoice(states),
      isInstituteGovtRegistered: Math.random() > 0.1,
    },
    personal: {
      age: Math.floor(Math.random() * 25) + 14,
      gender: randomChoice(genders),
      casteCategory: randomChoice(castes),
      isDisability: Math.random() > 0.8,
      disabilityPercentage: Math.floor(Math.random() * 100),
      isSingleGirlChild: Math.random() > 0.7,
    },
    demographics: {
      domicileState: randomChoice(states),
    },
    financial: {
      annualHouseholdIncome: Math.floor(Math.random() * 1000000),
    },
    certificates: [
      { type: 'INCOME_CERTIFICATE', isAvailable: Math.random() > 0.5, status: 'VALID' },
      { type: 'CASTE_CERTIFICATE', isAvailable: Math.random() > 0.5, status: 'VALID' },
      { type: 'MARKSHEET', isAvailable: true, status: 'VALID' },
    ],
    documentsReadiness: {
      isAadhaarSeededWithBank: Math.random() > 0.2,
      isNameMatchingAadhaar: Math.random() > 0.1,
      isDobMatchingAadhaar: Math.random() > 0.1,
      isIncomeCertificateValidCurrentYear: Math.random() > 0.3,
    },
  };
}

const testScheme: Scheme = {
  id: 'property-test-scheme',
  title: 'Property Testing Scheme',
  shortDescription: 'Scheme for generative property testing',
  offeringAuthority: 'Test Authority',
  authorityType: 'CENTRAL_GOVT',
  schemeType: 'SCHOLARSHIP',
  benefitDetails: { financialAmountPerYear: 20000, description: '' },
  applicationWindow: { startDate: '2026-08-01', endDate: '2026-10-31', academicYear: '2026-27' },
  officialUrl: 'https://scholarships.gov.in',
  sourceCitation: { portalName: 'NSP', url: 'https://scholarships.gov.in', tier: 1, clauseRef: 'Sec 1', verifiedDate: '2026-10-01' },
  rules: [
    { key: 'financial.annualHouseholdIncome', label: 'Income <= 2.5 LPA', operator: 'LESS_THAN_OR_EQUAL', expectedValue: 250000, isActionable: true, isRequired: true, version: '1.0' },
    { key: 'personal.casteCategory', label: 'Caste is SC or ST', operator: 'IN_ARRAY', expectedValue: ['SC', 'ST'], isActionable: false, isRequired: true, version: '1.0' },
    { key: 'academic.educationLevel', label: 'Undergraduate', operator: 'EQUALS', expectedValue: 'UNDERGRADUATE', isActionable: false, isRequired: true, version: '1.0' },
  ],
  requiredCertificates: ['INCOME_CERTIFICATE', 'CASTE_CERTIFICATE'],
  isDemo: true,
  version: '1.0',
};

describe('Property-Based Engine Testing (100 Randomized Fuzz Profiles)', () => {
  it('Property 1: Pure Determinism — same profile evaluated twice produces exact identical state and rule trace', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateRandomProfile(i);
      const res1 = matchScheme(p, testScheme, '2026-10-05');
      const res2 = matchScheme(p, testScheme, '2026-10-05');
      expect(res1.state).toBe(res2.state);
      expect(res1.ruleTrace.length).toBe(res2.ruleTrace.length);
      for (let j = 0; j < res1.ruleTrace.length; j++) {
        expect(res1.ruleTrace[j].outcome).toBe(res2.ruleTrace[j].outcome);
      }
    }
  });

  it('Property 2: Non-Actionable Failure Invariant — if any non-actionable rule fails, state MUST be NOT_MATCHED', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateRandomProfile(i);
      const res = matchScheme(p, testScheme, '2026-10-05');
      const nonActionableFailed = res.ruleTrace.some(t => !t.isActionable && t.isRequired && t.outcome === 'FAIL');
      if (nonActionableFailed) {
        expect(res.state).toBe('NOT_MATCHED');
        expect(res.state).not.toBe('ELIGIBLE');
        expect(res.state).not.toBe('NEARLY_ELIGIBLE');
      }
    }
  });

  it('Property 3: Actionable Rule Failure Invariant — failing only actionable rules can never yield NOT_MATCHED', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateRandomProfile(i);
      const res = matchScheme(p, testScheme, '2026-10-05');
      const nonActionableFailed = res.ruleTrace.some(t => !t.isActionable && t.isRequired && t.outcome === 'FAIL');
      const nonActionableUnknown = res.ruleTrace.some(t => !t.isActionable && t.isRequired && t.outcome === 'UNKNOWN');
      if (!nonActionableFailed && !nonActionableUnknown) {
        // Can only be ELIGIBLE or NEARLY_ELIGIBLE
        expect(['ELIGIBLE', 'NEARLY_ELIGIBLE']).toContain(res.state);
      }
    }
  });

  it('Property 4: Numeric Distance Invariant — distance is positive and exact when limit is exceeded', () => {
    for (let income = 250001; income <= 300000; income += 5000) {
      const rule = { key: 'income', label: '', operator: 'LESS_THAN_OR_EQUAL' as const, expectedValue: 250000, isActionable: true, isRequired: true, version: '1.0' };
      const dist = calculateDistance(income, rule);
      expect(dist).toBeDefined();
      expect(dist?.numericDifference).toBe(income - 250000);
    }
  });
});

