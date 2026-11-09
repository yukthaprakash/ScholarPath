import { Scheme, ConflictPair } from '../types.js';

export interface ConflictCheckResult {
  hasConflict: boolean;
  status: 'COMPATIBLE' | 'INCOMPATIBLE' | 'REQUIRES_VERIFICATION';
  conflictReason?: string;
}

export function pairConflict(
  schemeA: Scheme,
  schemeB: Scheme,
  customConflicts: ConflictPair[] = []
): ConflictCheckResult {
  if (schemeA.id === schemeB.id) {
    return { hasConflict: false, status: 'COMPATIBLE' };
  }

  // Check explicit custom conflict definitions from conflicts.json
  const explicit = customConflicts.find(
    c => (c.schemeA === schemeA.id && c.schemeB === schemeB.id) ||
         (c.schemeA === schemeB.id && c.schemeB === schemeA.id)
  );

  if (explicit) {
    return {
      hasConflict: true,
      status: 'INCOMPATIBLE',
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
      status: 'INCOMPATIBLE',
      conflictReason: 'GOVT_POLICY: Central Government guidelines forbid receiving financial benefits from two Central Sector Scholarship schemes concurrently.',
    };
  }

  // Default per Rule 10: Never assume combinability; default REQUIRES_VERIFICATION
  return {
    hasConflict: false,
    status: 'REQUIRES_VERIFICATION',
    conflictReason: 'REQUIRES_VERIFICATION: Official compatibility between these schemes is unconfirmed; requires verification with offering authorities.',
  };
}
