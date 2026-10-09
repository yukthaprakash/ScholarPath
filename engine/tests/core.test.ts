import { describe, it, expect } from 'vitest';
import { evaluateRule } from '../src/core/evaluateRule.js';
import { matchScheme } from '../src/core/matchScheme.js';
import { quickCheck } from '../src/core/quickCheck.js';
import { analyzeAll } from '../src/core/analyzeAll.js';
import { Rule, StudentProfile, Scheme } from '../src/types.js';

const mockProfile: StudentProfile = {
  id: 'test-student-1',
  academic: {
    educationLevel: 'UNDERGRADUATE',
    courseName: 'BTech Computer Science',
    currentYear: 2,
    scorePercentage: 85,
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
  demographics: {
    domicileState: 'KARNATAKA',
  },
  financial: {
    annualHouseholdIncome: 200000,
  },
  certificates: [
    {
      type: 'MARKSHEET',
      isAvailable: true,
      status: 'VALID',
    },
  ],
  documentsReadiness: {
    isAadhaarSeededWithBank: true,
    isNameMatchingAadhaar: true,
    isDobMatchingAadhaar: true,
    isIncomeCertificateValidCurrentYear: true,
  },
};

const sampleScheme: Scheme = {
  id: 'sample-scholarship',
  title: 'Sample Central Scholarship',
  shortDescription: 'Scholarship for undergraduate students.',
  offeringAuthority: 'Ministry of Education',
  authorityType: 'CENTRAL_GOVT',
  schemeType: 'SCHOLARSHIP',
  benefitDetails: {
    financialAmountPerYear: 12000,
    description: 'Rs 12000 per year',
  },
  applicationWindow: {
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    academicYear: '2026-27',
  },
  officialUrl: 'https://scholarships.gov.in',
  sourceCitation: {
    portalName: 'National Scholarship Portal',
    url: 'https://scholarships.gov.in',
    tier: 1,
    clauseRef: 'Section 3.1',
    verifiedDate: '2026-09-15',
  },
  rules: [
    {
      key: 'financial.annualHouseholdIncome',
      label: 'Income <= 2.5L',
      operator: 'LESS_THAN_OR_EQUAL',
      expectedValue: 250000,
      isActionable: true,
      isRequired: true,
      version: '1.0',
    },
    {
      key: 'academic.scorePercentage',
      label: 'Score >= 80%',
      operator: 'GREATER_THAN_OR_EQUAL',
      expectedValue: 80,
      isActionable: true,
      isRequired: true,
      version: '1.0',
    },
    {
      key: 'personal.gender',
      label: 'Gender Female',
      operator: 'EQUALS',
      expectedValue: 'FEMALE',
      isActionable: false,
      isRequired: true,
      version: '1.0',
    },
  ],
  requiredCertificates: ['INCOME_CERTIFICATE'],
  isDemo: true,
  version: '1.0',
};

describe('evaluateRule Engine', () => {
  it('1. EQUALS pass', () => {
    const rule: Rule = { key: 'personal.gender', label: '', operator: 'EQUALS', expectedValue: 'FEMALE', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('2. EQUALS fail', () => {
    const rule: Rule = { key: 'personal.gender', label: '', operator: 'EQUALS', expectedValue: 'MALE', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL');
  });

  it('3. EQUALS wildcard ANY', () => {
    const rule: Rule = { key: 'personal.casteCategory', label: '', operator: 'EQUALS', expectedValue: 'ANY', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('4. NOT_EQUALS pass', () => {
    const rule: Rule = { key: 'personal.casteCategory', label: '', operator: 'NOT_EQUALS', expectedValue: 'GENERAL', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('5. LESS_THAN_OR_EQUAL pass with numeric distance', () => {
    const rule: Rule = { key: 'financial.annualHouseholdIncome', label: '', operator: 'LESS_THAN_OR_EQUAL', expectedValue: 250000, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
    expect(trace.distance?.numericDifference).toBe(50000);
  });

  it('6. LESS_THAN_OR_EQUAL fail with distance', () => {
    const rule: Rule = { key: 'financial.annualHouseholdIncome', label: '', operator: 'LESS_THAN_OR_EQUAL', expectedValue: 150000, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL');
    expect(trace.distance?.numericDifference).toBe(50000);
  });

  it('7. GREATER_THAN_OR_EQUAL pass', () => {
    const rule: Rule = { key: 'academic.scorePercentage', label: '', operator: 'GREATER_THAN_OR_EQUAL', expectedValue: 80, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('8. GREATER_THAN_OR_EQUAL fail', () => {
    const rule: Rule = { key: 'academic.scorePercentage', label: '', operator: 'GREATER_THAN_OR_EQUAL', expectedValue: 90, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL');
    expect(trace.distance?.numericDifference).toBe(5);
  });

  it('9. IN_ARRAY pass', () => {
    const rule: Rule = { key: 'personal.casteCategory', label: '', operator: 'IN_ARRAY', expectedValue: ['OBC', 'SC', 'ST'], isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('10. IN_ARRAY fail', () => {
    const rule: Rule = { key: 'personal.casteCategory', label: '', operator: 'IN_ARRAY', expectedValue: ['SC', 'ST'], isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL');
  });

  it('11. NOT_IN_ARRAY pass', () => {
    const rule: Rule = { key: 'personal.casteCategory', label: '', operator: 'NOT_IN_ARRAY', expectedValue: ['GENERAL'], isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('12. CONTAINS string pass', () => {
    const rule: Rule = { key: 'academic.courseName', label: '', operator: 'CONTAINS', expectedValue: 'Computer Science', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('13. BETWEEN range pass', () => {
    const rule: Rule = { key: 'personal.age', label: '', operator: 'BETWEEN', expectedValue: [18, 25], isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('14. BETWEEN range boundary min', () => {
    const rule: Rule = { key: 'personal.age', label: '', operator: 'BETWEEN', expectedValue: [20, 25], isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('15. DATE_BEFORE pass', () => {
    const rule: Rule = { key: 'applicationWindow.endDate', label: '', operator: 'DATE_BEFORE', expectedValue: '2026-12-31', isActionable: false, isRequired: true, version: '1.0' };
    const dummyProf: any = { applicationWindow: { endDate: '2026-10-31' } };
    const trace = evaluateRule(dummyProf, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('16. Missing field resolves to UNKNOWN', () => {
    const rule: Rule = { key: 'personal.religion', label: '', operator: 'EQUALS', expectedValue: 'HINDU', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('UNKNOWN');
  });

  it('17. Certificate shortcut present and valid', () => {
    const rule: Rule = { key: 'certificates.MARKSHEET', label: '', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('18. Certificate shortcut missing returns false -> FAIL', () => {
    const rule: Rule = { key: 'certificates.INCOME_CERTIFICATE', label: '', operator: 'EQUALS', expectedValue: true, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL');
  });
});

describe('matchScheme State Hierarchy Logic', () => {
  it('19. ELIGIBLE when all rules pass', () => {
    const match = matchScheme(mockProfile, sampleScheme, '2026-10-05');
    expect(match.state).toBe('ELIGIBLE');
  });

  it('20. NOT_MATCHED when required non-actionable rule fails', () => {
    const scheme: Scheme = {
      ...sampleScheme,
      rules: [
        ...sampleScheme.rules,
        {
          key: 'personal.gender',
          label: 'Must be male',
          operator: 'EQUALS',
          expectedValue: 'MALE',
          isActionable: false,
          isRequired: true,
          version: '1.0',
        },
      ],
    };
    const match = matchScheme(mockProfile, scheme, '2026-10-05');
    expect(match.state).toBe('NOT_MATCHED');
  });

  it('21. NEEDS_VERIFICATION when required non-actionable rule is UNKNOWN', () => {
    const scheme: Scheme = {
      ...sampleScheme,
      rules: [
        {
          key: 'personal.religion', // missing in profile
          label: 'Religion check',
          operator: 'EQUALS',
          expectedValue: 'HINDU',
          isActionable: false,
          isRequired: true,
          version: '1.0',
        },
      ],
    };
    const match = matchScheme(mockProfile, scheme, '2026-10-05');
    expect(match.state).toBe('NEEDS_VERIFICATION');
  });

  it('22. NEARLY_ELIGIBLE when required actionable rule fails', () => {
    const scheme: Scheme = {
      ...sampleScheme,
      rules: [
        {
          key: 'certificates.INCOME_CERTIFICATE',
          label: 'Income Cert Required',
          operator: 'EQUALS',
          expectedValue: true,
          isActionable: true,
          isRequired: true,
          version: '1.0',
        },
      ],
    };
    const match = matchScheme(mockProfile, scheme, '2026-10-05');
    expect(match.state).toBe('NEARLY_ELIGIBLE');
    expect(match.missingActionableRules.length).toBe(1);
  });

  it('23. NOT_MATCHED takes priority over NEARLY_ELIGIBLE', () => {
    const scheme: Scheme = {
      ...sampleScheme,
      rules: [
        {
          key: 'personal.gender',
          label: 'Must be male',
          operator: 'EQUALS',
          expectedValue: 'MALE',
          isActionable: false,
          isRequired: true,
          version: '1.0',
        },
        {
          key: 'certificates.INCOME_CERTIFICATE',
          label: 'Income Cert',
          operator: 'EQUALS',
          expectedValue: true,
          isActionable: true,
          isRequired: true,
          version: '1.0',
        },
      ],
    };
    const match = matchScheme(mockProfile, scheme, '2026-10-05');
    expect(match.state).toBe('NOT_MATCHED');
  });

  it('24. quickCheck returns correct boolean and state', () => {
    const qc = quickCheck(mockProfile, sampleScheme, '2026-10-05');
    expect(qc.state).toBe('ELIGIBLE');
    expect(qc.isEligibleOrNearly).toBe(true);
    expect(qc.financialBenefit).toBe(12000);
  });

  it('25. analyzeAll summarizes counts correctly', () => {
    const result = analyzeAll(mockProfile, [sampleScheme], { today: '2026-10-05' });
    expect(result.summary.eligibleCount).toBe(1);
    expect(result.summary.totalFinancialOpportunity).toBe(12000);
    expect(result.matches.length).toBe(1);
  });

  it('26. LESS_THAN operator strict comparison', () => {
    const rule: Rule = { key: 'financial.annualHouseholdIncome', label: '', operator: 'LESS_THAN', expectedValue: 200000, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL'); // 200000 is not < 200000
  });

  it('27. GREATER_THAN operator strict comparison', () => {
    const rule: Rule = { key: 'academic.scorePercentage', label: '', operator: 'GREATER_THAN', expectedValue: 85, isActionable: true, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL'); // 85 is not > 85
  });

  it('28. NOT_IN_ARRAY fail when included', () => {
    const rule: Rule = { key: 'personal.casteCategory', label: '', operator: 'NOT_IN_ARRAY', expectedValue: ['OBC', 'SC'], isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(mockProfile, rule, '2026-10-05');
    expect(trace.outcome).toBe('FAIL');
  });

  it('29. CONTAINS array value match', () => {
    const dummyProf: any = { skills: ['coding', 'math'] };
    const rule: Rule = { key: 'skills', label: '', operator: 'CONTAINS', expectedValue: 'math', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(dummyProf, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });

  it('30. DATE_AFTER pass check', () => {
    const dummyProf: any = { issueDate: '2026-09-01' };
    const rule: Rule = { key: 'issueDate', label: '', operator: 'DATE_AFTER', expectedValue: '2026-01-01', isActionable: false, isRequired: true, version: '1.0' };
    const trace = evaluateRule(dummyProf, rule, '2026-10-05');
    expect(trace.outcome).toBe('PASS');
  });
});
