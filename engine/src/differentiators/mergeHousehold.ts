import { StudentProfile, HouseholdProfile } from '../types.js';

export function mergeHousehold(
  primaryStudent: StudentProfile,
  dependents: StudentProfile[] = []
): HouseholdProfile {
  // Financial income is at household level; use primary student's household income
  const combinedIncome = primaryStudent.financial.annualHouseholdIncome;

  return {
    householdId: `hh-${primaryStudent.id}`,
    primaryStudent,
    dependents,
    combinedIncome,
  };
}
