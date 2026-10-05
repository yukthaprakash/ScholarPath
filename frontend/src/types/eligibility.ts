export type EligibilityState =
  | 'ELIGIBLE'
  | 'NEARLY_ELIGIBLE'
  | 'NOT_MATCHED'
  | 'NEEDS_VERIFICATION';

export type ClauseResult = 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';

export interface ClauseCheck {
  clauseName: string; // e.g. "Family Income Limit"
  studentValue: string; // e.g. "₹2,00,000 / yr"
  expectedValue: string; // e.g. "≤ ₹4,50,000 / yr"
  result: ClauseResult;
  citationSource: string; // e.g. "NSP 2026-27 Guidelines Clause 4.2"
  ruleVersion: string; // e.g. "2026.1"
  explanation: string;
}

export interface RuleTrace {
  schemeId: string;
  schemeName: string;
  clauses: ClauseCheck[];
  overallReason: string;
  evaluatedAt: string;
}

export interface PreflightItem {
  id: string;
  checkName: string; // e.g. "Aadhaar Seeding Status"
  status: 'READY' | 'FIX_FIRST' | 'VERIFY';
  sourceCitation: string;
  rationale: string;
}

export interface MatchResult {
  schemeId: string;
  status: EligibilityState;
  ruleTrace: RuleTrace;
  distanceGap?: string; // e.g. "₹18,000 above the published income limit"
  suggestedAction?: string; // e.g. "Obtain updated RD Income Certificate below ₹1.8L"
  preflightChecks: PreflightItem[];
}

export interface UnlockOpportunity {
  id: string;
  simulatedActionTitle: string; // e.g. "Renew Income Certificate below ₹1.8L"
  description: string;
  newlyEligibleSchemeIds: string[];
  potentialTotalBenefitText: string; // e.g. "₹45,000 / yr"
  authorityDisclaimer: string; // "Preliminary assessment. Final decision rests with government authority."
}
