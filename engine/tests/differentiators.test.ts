import { describe, it, expect } from 'vitest';
import { computeUnlocks } from '../src/differentiators/computeUnlocks.js';
import { forecast } from '../src/differentiators/forecast.js';
import { pairConflict } from '../src/differentiators/pairConflict.js';
import { bestStack } from '../src/differentiators/bestStack.js';
import { planBackwards } from '../src/differentiators/planBackwards.js';
import { evaluatePreflight } from '../src/differentiators/evaluatePreflight.js';
import { trustLevel } from '../src/differentiators/trustLevel.js';
import { mergeHousehold } from '../src/differentiators/mergeHousehold.js';
import { StudentProfile, Scheme, SchemeMatch, ConflictPair } from '../src/types.js';

const mockProfile: StudentProfile = {
  id: 'student-diff-1',
  academic: {
    educationLevel: 'UNDERGRADUATE',
    courseName: 'BE Computer Science',
    currentYear: 2,
    scorePercentage: 82.5,
    instituteType: 'GOVERNMENT',
    instituteState: 'KARNATAKA',
    isInstituteGovtRegistered: true,
  },
  personal: {
    age: 19,
    gender: 'FEMALE',
    casteCategory: 'OBC',
    isDisability: false,
  },
  demographics: {
    domicileState: 'KARNATAKA',
  },
  financial: {
    annualHouseholdIncome: 180000,
  },
  certificates: [],
  documentsReadiness: {
    isAadhaarSeededWithBank: true,
    isNameMatchingAadhaar: true,
    isDobMatchingAadhaar: true,
    isIncomeCertificateValidCurrentYear: true,
  },
};

const schemeA: Scheme = {
  id: 'scheme-a',
  title: 'Central Sector Scholarship A',
  shortDescription: '',
  offeringAuthority: 'Ministry of Education',
  authorityType: 'CENTRAL_GOVT',
  schemeType: 'SCHOLARSHIP',
  benefitDetails: { financialAmountPerYear: 20000, description: '' },
  applicationWindow: { startDate: '2026-08-01', endDate: '2026-10-31', academicYear: '2026-27' },
  officialUrl: 'https://scholarships.gov.in/a',
  sourceCitation: { portalName: 'NSP', url: 'https://scholarships.gov.in/a', tier: 1, clauseRef: 'Sec 1', verifiedDate: '2026-09-01' },
  rules: [
    { key: 'certificates.INCOME_CERTIFICATE', label: 'Income Cert', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' },
  ],
  requiredCertificates: ['INCOME_CERTIFICATE'],
  isDemo: true,
  version: '1.0',
};

const schemeB: Scheme = {
  id: 'scheme-b',
  title: 'Central Sector Scholarship B',
  shortDescription: '',
  offeringAuthority: 'Ministry of Education',
  authorityType: 'CENTRAL_GOVT',
  schemeType: 'SCHOLARSHIP',
  benefitDetails: { financialAmountPerYear: 15000, description: '' },
  applicationWindow: { startDate: '2026-08-01', endDate: '2026-10-31', academicYear: '2026-27' },
  officialUrl: 'https://scholarships.gov.in/b',
  sourceCitation: { portalName: 'NSP', url: 'https://scholarships.gov.in/b', tier: 1, clauseRef: 'Sec 2', verifiedDate: '2026-09-01' },
  rules: [],
  requiredCertificates: [],
  isDemo: true,
  version: '1.0',
};

describe('computeUnlocks Differentiator', () => {
  it('1. Identifies missing actionable certificate and calculates unlock actions', () => {
    const unlocks = computeUnlocks(mockProfile, [schemeA], '2026-10-05');
    expect(unlocks.actions.length).toBeGreaterThan(0);
    expect(unlocks.actions[0].actionKey).toBe('certificates.INCOME_CERTIFICATE');
    expect(unlocks.actions[0].additionalFinancialUnlocked).toBe(20000);
  });
});

describe('forecast Differentiator', () => {
  it('2. Projects profile 1 year into future', () => {
    const fc = forecast(mockProfile, [schemeA], 1, '2026-10-05');
    expect(fc.years.length).toBe(1);
    expect(fc.years[0].projectedAge).toBe(20);
    expect(fc.years[0].projectedCurrentYear).toBe(3);
  });
});

describe('pairConflict & bestStack Differentiators', () => {
  it('3. Detects central govt scholarship conflict', () => {
    const conf = pairConflict(schemeA, schemeB);
    expect(conf.hasConflict).toBe(true);
    expect(conf.conflictReason).toContain('GOVT_POLICY');
  });

  it('4. Custom conflict graph detection', () => {
    const customGraph: ConflictPair[] = [
      { schemeA: 'scheme-x', schemeB: 'scheme-y', conflictType: 'EXCLUSION', sourceCitation: 'Rule 4', description: 'Cannot combine X and Y' },
    ];
    const sX = { ...schemeA, id: 'scheme-x', authorityType: 'STATE_GOVT' as const };
    const sY = { ...schemeB, id: 'scheme-y', authorityType: 'STATE_GOVT' as const };
    const conf = pairConflict(sX, sY, customGraph);
    expect(conf.hasConflict).toBe(true);
  });

  it('5. bestStack selects highest benefit non-conflicting scheme', () => {
    const matchA: SchemeMatch = {
      schemeId: 'scheme-a',
      schemeTitle: 'Scheme A',
      schemeType: 'SCHOLARSHIP',
      state: 'ELIGIBLE',
      ruleTrace: [],
      failedRules: [],
      unknownRules: [],
      missingActionableRules: [],
      trustScore: { freshnessDays: 5, sourceTier: 1, coveragePercentage: 100, trustLevel: 'HIGH', bannerMessage: '' },
      financialBenefit: 20000,
      deadline: '2026-10-31',
      officialUrl: '',
    };
    const matchB: SchemeMatch = {
      ...matchA,
      schemeId: 'scheme-b',
      schemeTitle: 'Scheme B',
      financialBenefit: 15000,
    };

    const schemeMap = new Map<string, Scheme>([
      ['scheme-a', schemeA],
      ['scheme-b', schemeB],
    ]);

    const stack = bestStack([matchA, matchB], schemeMap);
    expect(stack.selectedSchemeIds).toContain('scheme-a');
    expect(stack.rejectedSchemeIds).toContain('scheme-b');
    expect(stack.totalFinancialBenefit).toBe(20000);
  });
});

describe('planBackwards Differentiator', () => {
  it('6. Calculates backward planning steps for scheme deadline', () => {
    const plan = planBackwards(schemeA, '2026-10-05');
    expect(plan).not.toBeNull();
    expect(plan?.steps.length).toBeGreaterThan(0);
    expect(plan?.deadline).toBe('2026-10-31');
  });

  it('7. Flags past deadline as infeasible', () => {
    const pastScheme: Scheme = {
      ...schemeA,
      applicationWindow: { startDate: '2026-08-01', endDate: '2026-09-01', academicYear: '2026-27' },
    };
    const plan = planBackwards(pastScheme, '2026-10-05');
    expect(plan?.isFeasible).toBe(false);
  });
});

describe('evaluatePreflight Differentiator', () => {
  it('8. Returns READY when no issues exist', () => {
    const res = evaluatePreflight(mockProfile, schemeA);
    expect(res.readinessStatus).toBe('READY');
    expect(res.issues.length).toBe(0);
  });

  it('9. Returns HIGH_RISK_REJECTION on unseeded bank account', () => {
    const badProfile: StudentProfile = {
      ...mockProfile,
      documentsReadiness: {
        ...mockProfile.documentsReadiness,
        isAadhaarSeededWithBank: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
    expect(res.issues[0].severity).toBe('CRITICAL');
  });

  it('10. Returns HIGH_RISK_REJECTION on name mismatch', () => {
    const badProfile: StudentProfile = {
      ...mockProfile,
      documentsReadiness: {
        ...mockProfile.documentsReadiness,
        isNameMatchingAadhaar: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
  });

  it('11. Returns HIGH_RISK_REJECTION on unregistered institute', () => {
    const badProfile: StudentProfile = {
      ...mockProfile,
      academic: {
        ...mockProfile.academic,
        isInstituteGovtRegistered: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
  });
});

describe('trustLevel Differentiator', () => {
  it('12. Computes HIGH trust level for recent Tier 1 citation', () => {
    const score = trustLevel(schemeA, '2026-10-05');
    expect(score.trustLevel).toBe('HIGH');
    expect(score.sourceTier).toBe(1);
  });
});

describe('mergeHousehold Differentiator', () => {
  it('13. Combines household income accurately', () => {
    const hh = mergeHousehold(mockProfile, []);
    expect(hh.combinedIncome).toBe(180000);
    expect(hh.householdId).toBe('hh-student-diff-1');
  });
});
