import { StudentProfile, Scheme, SchemeMatchState } from '../types.js';
import { matchScheme } from './matchScheme.js';

export function quickCheck(
  profile: StudentProfile,
  scheme: Scheme,
  today: string = '2026-10-05'
): { state: SchemeMatchState; isEligibleOrNearly: boolean; financialBenefit: number } {
  const match = matchScheme(profile, scheme, today);
  return {
    state: match.state,
    isEligibleOrNearly: match.state === 'ELIGIBLE' || match.state === 'NEARLY_ELIGIBLE',
    financialBenefit: match.financialBenefit,
  };
}
