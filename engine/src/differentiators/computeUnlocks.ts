import { StudentProfile, Scheme, UnlockResult, UnlockAction } from '../types.js';
import { matchScheme } from '../core/matchScheme.js';

export function computeUnlocks(
  profile: StudentProfile,
  schemes: Scheme[],
  today: string = '2026-10-05'
): UnlockResult {
  const initialMatches = schemes.map(s => matchScheme(profile, s, today));
  
  // Find all missing actionable rules across nearly eligible schemes
  const actionableMap = new Map<string, { label: string; schemeIds: string[] }>();

  for (const match of initialMatches) {
    if (match.state === 'NEARLY_ELIGIBLE') {
      for (const missing of match.missingActionableRules) {
        const key = missing.ruleKey;
        if (!actionableMap.has(key)) {
          actionableMap.set(key, { label: missing.ruleLabel, schemeIds: [] });
        }
        actionableMap.get(key)!.schemeIds.push(match.schemeId);
      }
    }
  }

  const actions: UnlockAction[] = [];

  for (const [key, info] of actionableMap.entries()) {
    // Clone profile and satisfy the actionable rule
    const simulatedProfile: StudentProfile = JSON.parse(JSON.stringify(profile));

    if (key.startsWith('certificates.')) {
      const certType = key.split('.')[1] as any;
      const certObj = simulatedProfile.certificates.find(c => c.type === certType);
      if (certObj) {
        certObj.isAvailable = true;
        certObj.status = 'VALID';
      } else {
        simulatedProfile.certificates.push({
          type: certType,
          isAvailable: true,
          status: 'VALID',
        });
      }
    } else if (key === 'documentsReadiness.isIncomeCertificateValidCurrentYear') {
      simulatedProfile.documentsReadiness.isIncomeCertificateValidCurrentYear = true;
    }

    const reEvaluatedMatches = schemes.map(s => matchScheme(simulatedProfile, s, today));
    const newlyUnlocked: string[] = [];
    let addedFinancial = 0;

    for (const rem of reEvaluatedMatches) {
      const orig = initialMatches.find(m => m.schemeId === rem.schemeId);
      if (orig && orig.state !== 'ELIGIBLE' && rem.state === 'ELIGIBLE') {
        newlyUnlocked.push(rem.schemeId);
        addedFinancial += rem.financialBenefit;
      }
    }

    let effortDays = 15;
    if (key.includes('INCOME_CERTIFICATE')) effortDays = 14;
    if (key.includes('CASTE_CERTIFICATE')) effortDays = 21;

    const unlockedList = newlyUnlocked.length > 0 ? newlyUnlocked : info.schemeIds;

    actions.push({
      actionKey: key,
      actionTitle: `Obtain / Verify: ${info.label}`,
      description: `Satisfying '${info.label}' will move schemes from Nearly Eligible to Eligible.`,
      schemesUnlocked: unlockedList,
      additionalFinancialUnlocked: addedFinancial,
      effortDays,
    });
  }

  // RANKING LAW: Rank primarily by number of schemes unlocked descending.
  // Financial yield is used strictly as a secondary tie-breaker.
  actions.sort((a, b) => {
    const schemeCountDiff = b.schemesUnlocked.length - a.schemesUnlocked.length;
    if (schemeCountDiff !== 0) {
      return schemeCountDiff;
    }
    return b.additionalFinancialUnlocked - a.additionalFinancialUnlocked;
  });

  return {
    studentId: profile.id,
    actions,
  };
}
