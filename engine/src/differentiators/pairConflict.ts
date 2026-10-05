import { Scheme, ConflictPair } from '../types.js';

export function pairConflict(
  schemeA: Scheme,
  schemeB: Scheme,
  customConflicts: ConflictPair[] = []
): { hasConflict: boolean; conflictReason?: string } {
  if (schemeA.id === schemeB.id) {
    return { hasConflict: false };
  }

  // Check explicit custom conflict definitions from conflicts.json
  const explicit = customConflicts.find(
    c => (c.schemeA === schemeA.id && c.schemeB === schemeB.id) ||
         (c.schemeA === schemeB.id && c.schemeB === schemeA.id)
  );

  if (explicit) {
    return {
      hasConflict: true,
      conflictReason: `${explicit.conflictType}: ${explicit.description} (Ref: ${explicit.sourceCitation})`,
    };
  }

  // Government Rule: Students cannot hold two major Central Govt financial scholarships concurrently
  if (
    schemeA.authorityType === 'CENTRAL_GOVT' &&
    schemeB.authorityType === 'CENTRAL_GOVT' &&
    schemeA.schemeType === 'SCHOLARSHIP' &&
    schemeB.schemeType === 'SCHOLARSHIP'
  ) {
    return {
      hasConflict: true,
      conflictReason: 'GOVT_POLICY: Central Government guidelines forbid receiving financial benefits from two Central Sector Scholarship schemes concurrently.',
    };
  }

  return { hasConflict: false };
}
