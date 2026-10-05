import { StudentProfile, Scheme, ForecastResult, ForecastYear } from '../types.js';
import { matchScheme } from '../core/matchScheme.js';

export function forecast(
  profile: StudentProfile,
  schemes: Scheme[],
  targetYears: number = 1,
  today: string = '2026-10-05'
): ForecastResult {
  const years: ForecastYear[] = [];
  const initialMatches = schemes.map(s => matchScheme(profile, s, today));
  let currentEligible = initialMatches.filter(m => m.state === 'ELIGIBLE').map(m => m.schemeId);

  const currentYearNum = parseInt(today.split('-')[0], 10) || 2026;

  for (let i = 1; i <= targetYears; i++) {
    const forecastedAcademicYear = `${currentYearNum + i}-${(currentYearNum + i + 1).toString().slice(2)}`;
    const forecastedDate = `${currentYearNum + i}-10-05`;

    const forecastedProfile: StudentProfile = JSON.parse(JSON.stringify(profile));
    forecastedProfile.personal.age += i;
    forecastedProfile.academic.currentYear += i;

    const forecastedMatches = schemes.map(s => matchScheme(forecastedProfile, s, forecastedDate));
    const forecastedEligible = forecastedMatches.filter(m => m.state === 'ELIGIBLE').map(m => m.schemeId);

    const newlyEligible = forecastedEligible.filter(id => !currentEligible.includes(id));
    const lostSchemes = currentEligible.filter(id => !forecastedEligible.includes(id));

    years.push({
      year: i,
      academicYear: forecastedAcademicYear,
      projectedAge: forecastedProfile.personal.age,
      projectedCurrentYear: forecastedProfile.academic.currentYear,
      assumptions: [
        `Student successfully advances to Year ${forecastedProfile.academic.currentYear} of ${forecastedProfile.academic.courseName}`,
        `Academic score percentage remains at or above current ${profile.academic.scorePercentage}%`,
        `Annual household income remains constant at Rs ${profile.financial.annualHouseholdIncome}`
      ],
      newlyEligibleSchemes: newlyEligible,
      lostSchemes,
    });

    currentEligible = forecastedEligible;
  }

  return {
    studentId: profile.id,
    years,
  };
}
