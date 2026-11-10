import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  eligibilityService,
  mapBackendMatchToFrontend,
  BackendSchemeMatch,
  BackendEvaluateResponse,
} from './eligibilityService';
import { apiClient } from './apiClient';
import { DEFAULT_DEMO_PROFILE } from '../fixtures/defaultDemoProfile';
import { VERIFIED_SCHEMES } from '../fixtures/verifiedSchemes';

describe('EligibilityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps backend scheme match to frontend MatchResult with clauses and distance gap', () => {
    const mockBackendMatch: BackendSchemeMatch = {
      schemeId: 'scheme-nsp-001',
      schemeTitle: 'Central Sector Scheme for University Students',
      state: 'NEARLY_ELIGIBLE',
      financialBenefit: 12000,
      deadline: '2026-10-31',
      officialUrl: 'https://scholarships.gov.in',
      ruleTrace: [
        {
          ruleKey: 'INCOME_LIMIT',
          ruleLabel: 'Annual Family Income Limit',
          outcome: 'PASS',
          clauseRef: 'MoE Guideline 4.1',
          studentValue: 200000,
          expectedValue: 450000,
        },
        {
          ruleKey: 'MARKS_PERCENTILE',
          ruleLabel: 'Board Exam Percentile Requirement',
          outcome: 'FAIL',
          clauseRef: 'MoE Guideline 3.2',
          studentValue: 78,
          expectedValue: 80,
          distance: {
            numericDifference: 2,
            unit: 'percentile points',
            message: '2 percentile points below required 80th percentile',
          },
        },
      ],
      failedRules: [
        {
          ruleKey: 'MARKS_PERCENTILE',
          ruleLabel: 'Board Exam Percentile Requirement',
          outcome: 'FAIL',
          distance: {
            message: '2 percentile points below required 80th percentile',
          },
        },
      ],
      unknownRules: [],
      missingActionableRules: [
        {
          ruleKey: 'DOC_BONAFIDE',
          ruleLabel: 'College Bonafide Certificate',
          outcome: 'UNKNOWN',
        },
      ],
      distanceToEligibility: [
        {
          ruleKey: 'MARKS_PERCENTILE',
          message: '2 percentile points below required 80th percentile',
          actionableFix: 'Submit re-evaluation marksheet if grade increased',
        },
      ],
    };

    const result = mapBackendMatchToFrontend(mockBackendMatch);

    expect(result.schemeId).toBe('scheme-nsp-001');
    expect(result.status).toBe('NEARLY_ELIGIBLE');
    expect(result.distanceGap).toBe('2 percentile points below required 80th percentile');
    expect(result.suggestedAction).toBe('Submit re-evaluation marksheet if grade increased');
    expect(result.ruleTrace.clauses).toHaveLength(2);
    expect(result.ruleTrace.clauses[0].result).toBe('PASS');
    expect(result.ruleTrace.clauses[1].result).toBe('FAIL');
    expect(result.preflightChecks).toHaveLength(2);
  });

  it('calls POST /api/v1/eligibility/evaluate with options', async () => {
    const mockResponse: BackendEvaluateResponse = {
      studentId: 'student-001',
      evaluatedAt: '2026-10-12T00:00:00.000Z',
      today: '2026-10-05',
      summary: {
        eligibleCount: 1,
        nearlyEligibleCount: 0,
        needsVerificationCount: 0,
        notMatchedCount: 0,
        totalFinancialOpportunity: 15000,
      },
      matches: [],
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await eligibilityService.evaluateWithBackend({
      schemeSlug: 'post-matric-obc',
      today: '2026-10-05',
    });

    expect(postSpy).toHaveBeenCalledWith('/eligibility/evaluate', {
      schemeSlug: 'post-matric-obc',
      today: '2026-10-05',
    });
    expect(result.summary.eligibleCount).toBe(1);
  });

  it('calls POST /api/v1/eligibility/explain with selected language', async () => {
    const mockExplanation = {
      schemeId: 'scheme-001',
      schemeTitle: 'Post-Matric OBC',
      state: 'ELIGIBLE',
      isEligible: true,
      explanation: 'You satisfy all criteria.',
      isFallback: false,
      language: 'kn',
      financialBenefit: 15000,
      deadline: '2026-10-31',
      officialUrl: 'https://scholarships.gov.in',
      details: {
        satisfiedRequirements: [],
        failedRequirements: [],
        unknownRequirements: [],
        missingActionableDocuments: [],
        nextSteps: ['Apply on portal'],
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockExplanation);

    const result = await eligibilityService.explainWithBackend({
      schemeSlug: 'post-matric-obc',
      language: 'kn',
    });

    expect(postSpy).toHaveBeenCalledWith('/eligibility/explain', {
      schemeSlug: 'post-matric-obc',
      language: 'kn',
    });
    expect((result as typeof mockExplanation).language).toBe('kn');
  });

  it('evaluates locally against verified schemes deterministically as offline fallback', () => {
    const matches = eligibilityService.evaluateAll(DEFAULT_DEMO_PROFILE, VERIFIED_SCHEMES);
    expect(matches.length).toBeGreaterThan(0);
    // At least one scheme matches or requires verification based on published criteria
    const validMatches = matches.filter((m) => m.status === 'ELIGIBLE' || m.status === 'NEARLY_ELIGIBLE' || m.status === 'NEEDS_VERIFICATION');
    expect(validMatches.length).toBeGreaterThan(0);
  });
});
