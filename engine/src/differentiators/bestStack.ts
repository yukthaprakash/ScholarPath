import { Scheme, SchemeMatch, StackResult, ConflictPair, IncompatiblePair } from '../types.js';
import { pairConflict } from './pairConflict.js';

export function bestStack(
  eligibleMatches: SchemeMatch[],
  allSchemesMap: Map<string, Scheme>,
  conflictsGraph: ConflictPair[] = []
): StackResult {
  // Sort eligible matches by financial benefit descending
  const sorted = [...eligibleMatches]
    .filter(m => m.state === 'ELIGIBLE' || m.state === 'NEARLY_ELIGIBLE')
    .sort((a, b) => {
      // Prioritize ELIGIBLE over NEARLY_ELIGIBLE, then higher financial benefit
      if (a.state !== b.state) {
        return a.state === 'ELIGIBLE' ? -1 : 1;
      }
      return b.financialBenefit - a.financialBenefit;
    });

  const selectedSchemeIds: string[] = [];
  const rejectedSchemeIds: string[] = [];
  const incompatiblePairs: IncompatiblePair[] = [];
  const stackingNotes: string[] = [];

  for (const match of sorted) {
    const scheme = allSchemesMap.get(match.schemeId);
    if (!scheme) continue;

    let conflictFound = false;

    for (const selectedId of selectedSchemeIds) {
      const selectedScheme = allSchemesMap.get(selectedId);
      if (!selectedScheme) continue;

      const check = pairConflict(scheme, selectedScheme, conflictsGraph);
      if (check.hasConflict) {
        conflictFound = true;
        incompatiblePairs.push({
          schemeA: match.schemeId,
          schemeB: selectedId,
          reason: check.conflictReason || 'Exclusion conflict',
        });
        stackingNotes.push(
          `Scheme '${scheme.title}' excluded due to conflict with selected scheme '${selectedScheme.title}'.`
        );
        break;
      }
    }

    if (!conflictFound) {
      selectedSchemeIds.push(match.schemeId);
    } else {
      rejectedSchemeIds.push(match.schemeId);
    }
  }

  const totalFinancialBenefit = selectedSchemeIds.reduce((sum, id) => {
    const m = eligibleMatches.find(x => x.schemeId === id);
    return sum + (m ? m.financialBenefit : 0);
  }, 0);

  return {
    selectedSchemeIds,
    rejectedSchemeIds,
    totalFinancialBenefit,
    stackingNotes,
    incompatiblePairs,
  };
}
