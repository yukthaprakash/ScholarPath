import { SchemeMatch } from '../engine/src/types.js';

export function getDeterministicFallback(match: SchemeMatch): string {
  if (match.state === 'ELIGIBLE') {
    return `Based on our verified rule engine, your profile satisfies all criteria for ${match.schemeTitle}. Annual benefit: Rs ${match.financialBenefit}. Deadline: ${match.deadline}. Final eligibility is determined by the official authority.`;
  }

  if (match.state === 'NEARLY_ELIGIBLE') {
    const missingLabels = match.missingActionableRules.map(m => m.ruleLabel).join('; ');
    return `You are Nearly Eligible for ${match.schemeTitle}. To become eligible, you need to satisfy: ${missingLabels}. Deadline: ${match.deadline}.`;
  }

  if (match.state === 'NEEDS_VERIFICATION') {
    return `Your application status for ${match.schemeTitle} requires data verification for missing fields. Please update your profile details.`;
  }

  return `Your profile does not currently match the published criteria for ${match.schemeTitle}. Refer to official guidelines at ${match.officialUrl} for details.`;
}
