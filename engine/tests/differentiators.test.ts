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
  shortDescription: 'Scholarship A',
  offeringAuthority: 'Ministry of Education',
  authorityType: 'CENTRAL_GOVT',
  schemeType: 'SCHOLARSHIP',
  benefitDetails: { financialAmountPerYear: 20000, description: 'Rs 20k/yr' },
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
  shortDescription: 'Scholarship B',
  offeringAuthority: 'Ministry of Education',
  authorityType: 'CENTRAL_GOVT',
  schemeType: 'SCHOLARSHIP',
  benefitDetails: { financialAmountPerYear: 15000, description: 'Rs 15k/yr' },
  applicationWindow: { startDate: '2026-08-01', endDate: '2026-10-31', academicYear: '2026-27' },
  officialUrl: 'https://scholarships.gov.in/b',
  sourceCitation: { portalName: 'NSP', url: 'https://scholarships.gov.in/b', tier: 1, clauseRef: 'Sec 2', verifiedDate: '2026-09-01' },
  rules: [],
  requiredCertificates: [],
  isDemo: true,
  version: '1.0',
};

const schemeC: Scheme = {
  id: 'scheme-c',
  title: 'State Merit Scholarship C',
  shortDescription: 'Scholarship C',
  offeringAuthority: 'Dept of Higher Education, Karnataka',
  authorityType: 'STATE_GOVT',
  schemeType: 'FEE_WAIVER',
  benefitDetails: { financialAmountPerYear: 25000, description: 'Tuition waiver' },
  applicationWindow: { startDate: '2026-08-01', endDate: '2026-11-30', academicYear: '2026-27' },
  officialUrl: 'https://ssp.karnataka.gov.in/c',
  sourceCitation: { portalName: 'SSP', url: 'https://ssp.karnataka.gov.in/c', tier: 1, clauseRef: 'Sec 3', verifiedDate: '2026-10-01' },
  rules: [
    { key: 'certificates.INCOME_CERTIFICATE', label: 'Income Cert', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' },
    { key: 'certificates.DOMICILE_CERTIFICATE', label: 'Domicile Cert', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' },
  ],
  requiredCertificates: ['INCOME_CERTIFICATE', 'DOMICILE_CERTIFICATE'],
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

  it('2. Ranks actions primarily by number of schemes unlocked', () => {
    const unlocks = computeUnlocks(mockProfile, [schemeA, schemeC], '2026-10-05');
    expect(unlocks.actions.length).toBeGreaterThanOrEqual(1);
    // Income certificate unlocks both schemeA and schemeC
    const topAction = unlocks.actions[0];
    expect(topAction.actionKey).toBe('certificates.INCOME_CERTIFICATE');
    expect(topAction.schemesUnlocked.length).toBeGreaterThanOrEqual(1);
  });

  it('3. Uses financial yield strictly as tie-breaker when scheme counts are equal', () => {
    const s1: Scheme = {
      ...schemeA,
      id: 's1',
      benefitDetails: { financialAmountPerYear: 10000, description: '' },
      rules: [{ key: 'certificates.MARKSHEET', label: 'Marksheet', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' }],
      requiredCertificates: ['MARKSHEET'],
    };
    const s2: Scheme = {
      ...schemeA,
      id: 's2',
      benefitDetails: { financialAmountPerYear: 30000, description: '' },
      rules: [{ key: 'certificates.CASTE_CERTIFICATE', label: 'Caste', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' }],
      requiredCertificates: ['CASTE_CERTIFICATE'],
    };
    const unlocks = computeUnlocks(mockProfile, [s1, s2], '2026-10-05');
    expect(unlocks.actions.length).toBe(2);
    // Both unlock 1 scheme each, s2 has higher financial benefit (30000 vs 10000)
    expect(unlocks.actions[0].actionKey).toBe('certificates.CASTE_CERTIFICATE');
  });

  it('4. Returns empty actions when profile already meets all actionable rules', () => {
    const fullyReadyProfile: StudentProfile = {
      ...mockProfile,
      certificates: [
        { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'VALID' },
      ],
    };
    const unlocks = computeUnlocks(fullyReadyProfile, [schemeA], '2026-10-05');
    expect(unlocks.actions.length).toBe(0);
  });
});

describe('forecast Differentiator', () => {
  it('5. Projects profile 1 year into future', () => {
    const fc = forecast(mockProfile, [schemeA], 1, '2026-10-05');
    expect(fc.years.length).toBe(1);
    expect(fc.years[0].projectedAge).toBe(20);
    expect(fc.years[0].projectedCurrentYear).toBe(3);
    expect(fc.years[0].assumptions.length).toBeGreaterThan(0);
  });

  it('6. Projects multiple years sequentially', () => {
    const fc = forecast(mockProfile, [schemeA], 3, '2026-10-05');
    expect(fc.years.length).toBe(3);
    expect(fc.years[2].projectedAge).toBe(22);
    expect(fc.years[2].projectedCurrentYear).toBe(5);
  });

  it('7. Detects lost schemes when age limit is exceeded in future year', () => {
    const ageConstrainedScheme: Scheme = {
      ...schemeB,
      id: 'age-constrained',
      rules: [
        { key: 'personal.age', label: 'Age <= 19', operator: 'LESS_THAN_OR_EQUAL', expectedValue: 19, isActionable: false, isRequired: true, version: '1.0' },
      ],
    };
    const fc = forecast(mockProfile, [ageConstrainedScheme], 1, '2026-10-05');
    expect(fc.years[0].lostSchemes).toContain('age-constrained');
  });

  it('8. Forecast documents assumptions explicitly', () => {
    const fc = forecast(mockProfile, [schemeA], 1, '2026-10-05');
    const assumptions = fc.years[0].assumptions.join(' ');
    expect(assumptions).toContain('Student successfully advances');
    expect(assumptions).toContain('Annual household income remains constant');
  });
});

describe('pairConflict Differentiator', () => {
  it('9. Identical scheme comparison is COMPATIBLE with no conflict', () => {
    const res = pairConflict(schemeA, schemeA);
    expect(res.hasConflict).toBe(false);
    expect(res.status).toBe('COMPATIBLE');
  });

  it('10. Detects central govt scholarship conflict', () => {
    const conf = pairConflict(schemeA, schemeB);
    expect(conf.hasConflict).toBe(true);
    expect(conf.status).toBe('INCOMPATIBLE');
    expect(conf.conflictReason).toContain('GOVT_POLICY');
  });

  it('11. Custom conflict graph detection', () => {
    const customGraph: ConflictPair[] = [
      { schemeA: 'scheme-x', schemeB: 'scheme-y', conflictType: 'EXCLUSION', sourceCitation: 'Rule 4', description: 'Cannot combine X and Y' },
    ];
    const sX = { ...schemeA, id: 'scheme-x', authorityType: 'STATE_GOVT' as const };
    const sY = { ...schemeB, id: 'scheme-y', authorityType: 'STATE_GOVT' as const };
    const conf = pairConflict(sX, sY, customGraph);
    expect(conf.hasConflict).toBe(true);
    expect(conf.status).toBe('INCOMPATIBLE');
  });

  it('12. Defaults unproven pairs to REQUIRES_VERIFICATION per Rule 10', () => {
    const unprovenStateScheme: Scheme = { ...schemeA, id: 'state-1', authorityType: 'STATE_GOVT' };
    const unprovenNgoScheme: Scheme = { ...schemeB, id: 'ngo-1', authorityType: 'NGO' };
    const conf = pairConflict(unprovenStateScheme, unprovenNgoScheme);
    expect(conf.hasConflict).toBe(false);
    expect(conf.status).toBe('REQUIRES_VERIFICATION');
    expect(conf.conflictReason).toContain('REQUIRES_VERIFICATION');
  });
});

describe('bestStack Differentiator', () => {
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

  const matchC: SchemeMatch = {
    ...matchA,
    schemeId: 'scheme-c',
    schemeTitle: 'Scheme C',
    schemeType: 'FEE_WAIVER',
    financialBenefit: 25000,
  };

  it('13. Selects highest benefit non-conflicting scheme', () => {
    const schemeMap = new Map<string, Scheme>([
      ['scheme-a', schemeA],
      ['scheme-b', schemeB],
    ]);
    const stack = bestStack([matchA, matchB], schemeMap);
    expect(stack.selectedSchemeIds).toContain('scheme-a');
    expect(stack.rejectedSchemeIds).toContain('scheme-b');
    expect(stack.totalFinancialBenefit).toBe(20000);
  });

  it('14. Allows combining compatible different authority/type schemes', () => {
    const schemeMap = new Map<string, Scheme>([
      ['scheme-a', schemeA],
      ['scheme-c', schemeC],
    ]);
    const stack = bestStack([matchA, matchC], schemeMap);
    expect(stack.selectedSchemeIds).toContain('scheme-c');
    expect(stack.selectedSchemeIds).toContain('scheme-a');
    expect(stack.totalFinancialBenefit).toBe(45000);
  });

  it('15. Prioritizes ELIGIBLE matches over NEARLY_ELIGIBLE matches', () => {
    const matchNearly: SchemeMatch = {
      ...matchA,
      schemeId: 'scheme-a',
      state: 'NEARLY_ELIGIBLE',
      financialBenefit: 50000,
    };
    const matchEligible: SchemeMatch = {
      ...matchB,
      schemeId: 'scheme-b',
      state: 'ELIGIBLE',
      financialBenefit: 15000,
    };
    const schemeMap = new Map<string, Scheme>([
      ['scheme-a', schemeA],
      ['scheme-b', schemeB],
    ]);
    const stack = bestStack([matchNearly, matchEligible], schemeMap);
    expect(stack.selectedSchemeIds).toContain('scheme-b');
    expect(stack.rejectedSchemeIds).toContain('scheme-a');
  });

  it('16. Handles empty eligible match list gracefully', () => {
    const stack = bestStack([], new Map());
    expect(stack.selectedSchemeIds.length).toBe(0);
    expect(stack.totalFinancialBenefit).toBe(0);
  });
});

describe('planBackwards Differentiator', () => {
  it('17. Calculates backward planning steps for scheme deadline', () => {
    const plan = planBackwards(schemeA, '2026-10-05');
    expect(plan).not.toBeNull();
    expect(plan?.steps.length).toBeGreaterThan(0);
    expect(plan?.deadline).toBe('2026-10-31');
    expect(plan?.bufferDays).toBe(2);
  });

  it('18. Returns null when application deadline is missing or empty', () => {
    const schemeNoDeadline: Scheme = {
      ...schemeA,
      applicationWindow: { startDate: '2026-08-01', endDate: '', academicYear: '2026-27' },
    };
    const plan = planBackwards(schemeNoDeadline, '2026-10-05');
    expect(plan).toBeNull();
  });

  it('19. Flags past deadline as infeasible and categorizes into EXPIRED/CRITICAL urgency', () => {
    const pastScheme: Scheme = {
      ...schemeA,
      applicationWindow: { startDate: '2026-08-01', endDate: '2026-09-01', academicYear: '2026-27' },
    };
    const plan = planBackwards(pastScheme, '2026-10-05');
    expect(plan?.isFeasible).toBe(false);
    expect(plan?.urgencyBucket).toBe('EXPIRED');
  });

  it('20. Assigns CRITICAL urgency bucket when lead time is infeasible', () => {
    // Deadline in 5 days, document takes 14 days
    const tightScheme: Scheme = {
      ...schemeA,
      applicationWindow: { startDate: '2026-10-01', endDate: '2026-10-10', academicYear: '2026-27' },
    };
    const plan = planBackwards(tightScheme, '2026-10-05');
    expect(plan?.isFeasible).toBe(false);
    expect(plan?.urgencyBucket).toBe('CRITICAL');
  });

  it('21. Assigns COMFORTABLE urgency when deadline is far away', () => {
    const farScheme: Scheme = {
      ...schemeA,
      applicationWindow: { startDate: '2026-10-01', endDate: '2027-02-28', academicYear: '2026-27' },
    };
    const plan = planBackwards(farScheme, '2026-10-05');
    expect(plan?.isFeasible).toBe(true);
    expect(plan?.urgencyBucket).toBe('COMFORTABLE');
  });

  it('22. Identifies critical path on slowest required certificate', () => {
    const plan = planBackwards(schemeC, '2026-10-05');
    expect(plan).not.toBeNull();
    const criticalSteps = plan!.steps.filter(s => s.isCriticalPath);
    expect(criticalSteps.length).toBeGreaterThan(0);
  });
});

describe('evaluatePreflight Differentiator', () => {
  const readyProfile: StudentProfile = {
    ...mockProfile,
    certificates: [
      { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'VALID' },
    ],
  };

  it('23. Returns READY when all readiness and documents are valid', () => {
    const res = evaluatePreflight(readyProfile, schemeA);
    expect(res.readinessStatus).toBe('READY');
    expect(res.issues.length).toBe(0);
  });

  it('24. Returns HIGH_RISK_REJECTION on unseeded bank account', () => {
    const badProfile: StudentProfile = {
      ...readyProfile,
      documentsReadiness: {
        ...readyProfile.documentsReadiness,
        isAadhaarSeededWithBank: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
    expect(res.issues.some(i => i.severity === 'CRITICAL')).toBe(true);
  });

  it('25. Returns NEEDS_ACTION when bank seeding is UNSURE (never READY)', () => {
    const unsureProfile: StudentProfile = {
      ...readyProfile,
      documentsReadiness: {
        ...readyProfile.documentsReadiness,
        isAadhaarSeededWithBank: 'UNSURE',
      },
    };
    const res = evaluatePreflight(unsureProfile, schemeA);
    expect(res.readinessStatus).toBe('NEEDS_ACTION');
    expect(res.readinessStatus).not.toBe('READY');
  });

  it('26. Returns HIGH_RISK_REJECTION on name mismatch', () => {
    const badProfile: StudentProfile = {
      ...readyProfile,
      documentsReadiness: {
        ...readyProfile.documentsReadiness,
        isNameMatchingAadhaar: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
  });

  it('27. Returns HIGH_RISK_REJECTION on DOB mismatch', () => {
    const badProfile: StudentProfile = {
      ...readyProfile,
      documentsReadiness: {
        ...readyProfile.documentsReadiness,
        isDobMatchingAadhaar: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
  });

  it('28. Returns HIGH_RISK_REJECTION on unregistered institute', () => {
    const badProfile: StudentProfile = {
      ...readyProfile,
      academic: {
        ...readyProfile.academic,
        isInstituteGovtRegistered: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
  });

  it('29. Labels preflight rejection items with (General Guidance)', () => {
    const badProfile: StudentProfile = {
      ...readyProfile,
      documentsReadiness: {
        ...readyProfile.documentsReadiness,
        isAadhaarSeededWithBank: false,
      },
    };
    const res = evaluatePreflight(badProfile, schemeA);
    expect(res.issues[0].issue).toContain('(General Guidance)');
  });

  it('30. Flags expired required certificate as CRITICAL', () => {
    const expiredCertProfile: StudentProfile = {
      ...readyProfile,
      certificates: [
        { type: 'INCOME_CERTIFICATE', isAvailable: true, status: 'EXPIRED' },
      ],
    };
    const res = evaluatePreflight(expiredCertProfile, schemeA);
    expect(res.readinessStatus).toBe('HIGH_RISK_REJECTION');
    expect(res.issues.some(i => i.severity === 'CRITICAL')).toBe(true);
  });
});

describe('trustLevel Differentiator', () => {
  it('31. Computes HIGH trust level for verification <= 14 days ago', () => {
    const recentScheme: Scheme = {
      ...schemeA,
      sourceCitation: { ...schemeA.sourceCitation, verifiedDate: '2026-10-01' },
    };
    const score = trustLevel(recentScheme, '2026-10-05');
    expect(score.trustLevel).toBe('HIGH');
    expect(score.freshnessDays).toBeLessThanOrEqual(14);
  });

  it('32. Computes MEDIUM trust level for verification between 15 and 45 days ago', () => {
    const medScheme: Scheme = {
      ...schemeA,
      sourceCitation: { ...schemeA.sourceCitation, verifiedDate: '2026-09-01' },
    };
    const score = trustLevel(medScheme, '2026-10-05');
    expect(score.trustLevel).toBe('MEDIUM');
  });

  it('33. Computes LOW trust level for verification > 45 days ago', () => {
    const staleScheme: Scheme = {
      ...schemeA,
      sourceCitation: { ...schemeA.sourceCitation, verifiedDate: '2026-06-01' },
    };
    const score = trustLevel(staleScheme, '2026-10-05');
    expect(score.trustLevel).toBe('LOW');
    expect(score.bannerMessage).toContain('Needs verification');
  });
});

describe('mergeHousehold Differentiator', () => {
  it('34. Combines household income accurately for primary student and dependents', () => {
    const dependentStudent: StudentProfile = {
      ...mockProfile,
      id: 'student-sibling-1',
      financial: { annualHouseholdIncome: 180000 },
    };
    const hh = mergeHousehold(mockProfile, [dependentStudent]);
    expect(hh.combinedIncome).toBe(180000);
    expect(hh.dependents.length).toBe(1);
    expect(hh.householdId).toBe('hh-student-diff-1');
  });
});
