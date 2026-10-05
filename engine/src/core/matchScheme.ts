import { StudentProfile, Scheme, SchemeMatch, SchemeMatchState, RuleTrace } from '../types.js';
import { evaluateRule } from './evaluateRule.js';
import { trustLevel } from '../differentiators/trustLevel.js';

export function matchScheme(profile: StudentProfile, scheme: Scheme, today: string = '2026-10-05'): SchemeMatch {
  const ruleTrace: RuleTrace[] = scheme.rules.map(rule => evaluateRule(profile, rule, today));

  const failedRules = ruleTrace.filter(t => t.outcome === 'FAIL');
  const unknownRules = ruleTrace.filter(t => t.outcome === 'UNKNOWN');
  const missingActionableRules = ruleTrace.filter(t => t.isActionable && t.outcome !== 'PASS');

  let state: SchemeMatchState = 'ELIGIBLE';

  const hasRequiredNonActionableFailed = ruleTrace.some(
    t => t.isRequired && !t.isActionable && t.outcome === 'FAIL'
  );

  const hasRequiredNonActionableUnknown = ruleTrace.some(
    t => t.isRequired && !t.isActionable && t.outcome === 'UNKNOWN'
  );

  const hasRequiredActionableNotSatisfied = ruleTrace.some(
    t => t.isRequired && t.isActionable && t.outcome !== 'PASS'
  );

  if (hasRequiredNonActionableFailed) {
    state = 'NOT_MATCHED';
  } else if (hasRequiredNonActionableUnknown) {
    state = 'NEEDS_VERIFICATION';
  } else if (hasRequiredActionableNotSatisfied) {
    state = 'NEARLY_ELIGIBLE';
  } else {
    state = 'ELIGIBLE';
  }

  const score = trustLevel(scheme, today);

  return {
    schemeId: scheme.id,
    schemeTitle: scheme.title,
    schemeType: scheme.schemeType,
    state,
    ruleTrace,
    failedRules,
    unknownRules,
    missingActionableRules,
    trustScore: score,
    financialBenefit: scheme.benefitDetails.financialAmountPerYear || 0,
    deadline: scheme.applicationWindow.endDate,
    officialUrl: scheme.officialUrl,
  };
}
