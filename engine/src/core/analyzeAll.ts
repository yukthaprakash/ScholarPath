import { StudentProfile, Scheme, AnalyzeResult, SchemeMatch } from '../types.js';
import { matchScheme } from './matchScheme.js';

export interface AnalyzeAllOptions {
  today?: string;
  schemeTypes?: string[];
}

export function analyzeAll(
  profile: StudentProfile,
  schemes: Scheme[],
  options: AnalyzeAllOptions = {}
): AnalyzeResult {
  const today = options.today || '2026-10-05';
  
  let filteredSchemes = schemes;
  if (options.schemeTypes && options.schemeTypes.length > 0) {
    filteredSchemes = schemes.filter(s => options.schemeTypes!.includes(s.schemeType));
  }

  const matches: SchemeMatch[] = filteredSchemes.map(scheme => matchScheme(profile, scheme, today));

  let eligibleCount = 0;
  let nearlyEligibleCount = 0;
  let needsVerificationCount = 0;
  let notMatchedCount = 0;
  let totalFinancialOpportunity = 0;

  for (const m of matches) {
    switch (m.state) {
      case 'ELIGIBLE':
        eligibleCount++;
        totalFinancialOpportunity += m.financialBenefit;
        break;
      case 'NEARLY_ELIGIBLE':
        nearlyEligibleCount++;
        totalFinancialOpportunity += m.financialBenefit;
        break;
      case 'NEEDS_VERIFICATION':
        needsVerificationCount++;
        break;
      case 'NOT_MATCHED':
        notMatchedCount++;
        break;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    today,
    studentId: profile.id,
    matches,
    summary: {
      eligibleCount,
      nearlyEligibleCount,
      needsVerificationCount,
      notMatchedCount,
      totalFinancialOpportunity,
    },
  };
}
