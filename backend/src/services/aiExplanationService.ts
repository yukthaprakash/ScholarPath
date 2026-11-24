import { engineAdapter, mapToEngineProfile } from './engineAdapter';
import { getProfileByUserId } from './profileService';
import { getDocumentsByUserId } from './documentService';
import { NotFoundError } from '../errors/AppError';
import { env } from '../config/env';
import { explainMatchWithAI, getDeterministicFallback } from '@scholarpath/ai';
import { SchemeMatch, StudentProfile, RuleTrace } from '@scholarpath/engine';

export interface ExplainEligibilityOptions {
  userId: string;
  schemeSlug?: string;
  language?: 'en' | 'kn' | 'hi';
  today?: string;
  apiKey?: string;
}

export interface RequirementDetail {
  ruleKey: string;
  label: string;
  expectedValue?: unknown;
  studentValue?: unknown;
  clauseRef?: string;
  distance?: {
    numericDifference?: number;
    unit?: string;
    message?: string;
  };
}

export interface SchemeExplanationResult {
  schemeId: string;
  schemeTitle: string;
  state: 'ELIGIBLE' | 'NEARLY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_MATCHED';
  isEligible: boolean;
  explanation: string;
  isFallback: boolean;
  reason?: string;
  language: 'en' | 'kn' | 'hi';
  financialBenefit: number;
  deadline: string;
  officialUrl: string;
  details: {
    satisfiedRequirements: RequirementDetail[];
    failedRequirements: RequirementDetail[];
    unknownRequirements: RequirementDetail[];
    missingActionableDocuments: RequirementDetail[];
    nextSteps: string[];
  };
}

export interface PortfolioExplanationResult {
  studentId: string;
  evaluatedAt: string;
  today: string;
  language: 'en' | 'kn' | 'hi';
  summary: {
    eligibleCount: number;
    nearlyEligibleCount: number;
    needsVerificationCount: number;
    notMatchedCount: number;
    totalFinancialOpportunity: number;
  };
  explanations: SchemeExplanationResult[];
}

/**
 * Builds actionable and grounded next steps based strictly on match state and rule trace.
 */
export function buildNextSteps(match: SchemeMatch): string[] {
  if (match.state === 'ELIGIBLE') {
    return [
      `Review official scheme guidelines and apply online at ${match.officialUrl} before ${match.deadline}.`,
      'Ensure required certificates and marksheets are ready for upload and verification.'
    ];
  }

  if (match.state === 'NEARLY_ELIGIBLE') {
    const steps: string[] = [];
    for (const rule of match.missingActionableRules) {
      steps.push(`Obtain or verify required document: ${rule.ruleLabel}`);
    }
    steps.push(`Once documents are obtained, submit application at ${match.officialUrl} prior to ${match.deadline}.`);
    return steps;
  }

  if (match.state === 'NEEDS_VERIFICATION') {
    const steps: string[] = [];
    for (const rule of match.unknownRules) {
      steps.push(`Update profile with missing field: ${rule.ruleLabel}`);
    }
    steps.push('Re-run eligibility check after updating profile.');
    return steps;
  }

  return [
    'Explore alternative scholarships whose criteria align with your profile.',
    'Review distance-to-eligibility details to check if criteria may be met in subsequent academic cycles.'
  ];
}

/**
 * Guards against hallucinated eligibility claims when the engine determined non-eligibility.
 */
export function checkEngineConsistency(
  explanationText: string,
  state: SchemeMatch['state']
): { isConsistent: boolean; reason?: string } {
  if (state === 'ELIGIBLE') {
    return { isConsistent: true };
  }

  const lower = explanationText.toLowerCase();
  const claimsEligible =
    lower.includes('you are eligible') ||
    lower.includes('you qualify') ||
    lower.includes('fully eligible') ||
    lower.includes('satisfies all criteria') ||
    lower.includes('meets all criteria');

  if (claimsEligible) {
    return {
      isConsistent: false,
      reason: `AI output claimed eligibility for a non-eligible match (state=${state}). Replaced with deterministic fallback.`
    };
  }

  return { isConsistent: true };
}

function mapRuleTrace(trace: RuleTrace): RequirementDetail {
  return {
    ruleKey: trace.ruleKey,
    label: trace.ruleLabel,
    expectedValue: trace.expectedValue,
    studentValue: trace.studentValue,
    clauseRef: trace.clauseRef,
    distance: trace.distance
  };
}

/**
 * Generates an explanation for a single scheme match.
 */
export async function explainSingleMatch(
  studentProfile: StudentProfile,
  match: SchemeMatch,
  options: { language?: 'en' | 'kn' | 'hi'; apiKey?: string }
): Promise<SchemeExplanationResult> {
  const language = options.language || 'en';
  const apiKey = options.apiKey || env.GEMINI_API_KEY;

  const aiResult = await explainMatchWithAI(studentProfile, match, {
    language,
    apiKey
  });

  let explanationText = aiResult.text;
  let isFallback = aiResult.isFallback;
  let reason = aiResult.reason;

  // Engine consistency check: engine is always authoritative
  if (!isFallback) {
    const consistency = checkEngineConsistency(explanationText, match.state);
    if (!consistency.isConsistent) {
      explanationText = getDeterministicFallback(match);
      isFallback = true;
      reason = consistency.reason;
    }
  }

  const satisfiedRequirements = match.ruleTrace
    .filter((r) => r.outcome === 'PASS')
    .map(mapRuleTrace);
  const failedRequirements = match.failedRules.map(mapRuleTrace);
  const unknownRequirements = match.unknownRules.map(mapRuleTrace);
  const missingActionableDocuments = match.missingActionableRules.map(mapRuleTrace);
  const nextSteps = buildNextSteps(match);

  return {
    schemeId: match.schemeId,
    schemeTitle: match.schemeTitle,
    state: match.state,
    isEligible: match.state === 'ELIGIBLE',
    explanation: explanationText,
    isFallback,
    reason,
    language,
    financialBenefit: match.financialBenefit,
    deadline: match.deadline,
    officialUrl: match.officialUrl,
    details: {
      satisfiedRequirements,
      failedRequirements,
      unknownRequirements,
      missingActionableDocuments,
      nextSteps
    }
  };
}

/**
 * Generates plain-language explanations for authenticated student's eligibility evaluation.
 */
export async function explainEligibility(
  options: ExplainEligibilityOptions
): Promise<SchemeExplanationResult | PortfolioExplanationResult> {
  const profile = await getProfileByUserId(options.userId);
  if (!profile) {
    throw new NotFoundError('Student profile not found. Please create a profile before requesting an explanation.');
  }

  const documents = await getDocumentsByUserId(options.userId);
  const today = options.today || '2026-10-05';
  const language = options.language || 'en';

  const studentProfile = mapToEngineProfile(profile, documents, today);

  const evaluation = await engineAdapter.evaluate({
    profile,
    documents,
    schemeSlug: options.schemeSlug,
    today
  });

  if (options.schemeSlug) {
    const match = evaluation.matches[0];
    if (!match) {
      throw new NotFoundError(`Scheme with slug '${options.schemeSlug}' not found`);
    }

    return explainSingleMatch(studentProfile, match, {
      language,
      apiKey: options.apiKey
    });
  }

  const explanations: SchemeExplanationResult[] = [];
  for (const match of evaluation.matches) {
    const single = await explainSingleMatch(studentProfile, match, {
      language,
      apiKey: options.apiKey
    });
    explanations.push(single);
  }

  return {
    studentId: profile.userId,
    evaluatedAt: evaluation.evaluatedAt,
    today,
    language,
    summary: evaluation.summary,
    explanations
  };
}
