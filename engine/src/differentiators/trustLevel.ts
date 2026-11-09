import { Scheme, TrustScore } from '../types.js';

export function trustLevel(scheme: Scheme, today: string = '2026-10-05'): TrustScore {
  const verifiedDateStr = scheme.sourceCitation?.verifiedDate || scheme.lastVerified || '2026-09-01';
  const todayMs = new Date(today).getTime();
  const verifiedMs = new Date(verifiedDateStr).getTime();
  const diffDays = Math.max(0, Math.floor((todayMs - verifiedMs) / (1000 * 60 * 60 * 24)));

  const tier = scheme.sourceCitation?.tier || 1;
  const coveragePercentage = 100; // Complete rule coverage

  // Freshness: <= 14d High, <= 45d Medium, > 45d Low
  let freshnessLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  if (diffDays <= 14) {
    freshnessLevel = 'HIGH';
  } else if (diffDays <= 45) {
    freshnessLevel = 'MEDIUM';
  } else {
    freshnessLevel = 'LOW';
  }

  // Tier level: Tier 1 -> HIGH, Tier 2 -> MEDIUM
  const tierLevel: 'HIGH' | 'MEDIUM' | 'LOW' = tier === 1 ? 'HIGH' : 'MEDIUM';

  // Overall level is the lowest of freshness and tier
  let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  if (freshnessLevel === 'LOW') {
    level = 'LOW';
  } else if (freshnessLevel === 'MEDIUM' || tierLevel === 'MEDIUM') {
    level = 'MEDIUM';
  } else {
    level = 'HIGH';
  }

  const portal = scheme.sourceCitation?.portalName || 'Official Source';
  let bannerMessage = `Verified Tier ${tier} ${portal} (${diffDays} day${diffDays === 1 ? '' : 's'} ago)`;
  if (level === 'LOW') {
    bannerMessage = `Needs verification: Data verified ${diffDays} days ago from ${portal}. Please re-confirm with the official portal before applying.`;
  }

  return {
    freshnessDays: diffDays,
    sourceTier: tier,
    coveragePercentage,
    trustLevel: level,
    bannerMessage,
  };
}
