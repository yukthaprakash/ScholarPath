import { Scheme, BackwardsPlan, BackwardsPlanStep, CertificateType } from '../types.js';

const DEFAULT_ISSUANCE_DAYS: Record<CertificateType, number> = {
  INCOME_CERTIFICATE: 14,
  CASTE_CERTIFICATE: 21,
  DOMICILE_CERTIFICATE: 21,
  DISABILITY_CERTIFICATE: 30,
  MARKSHEET: 7,
  BONAFIDE_CERTIFICATE: 5,
  AADHAAR_CARD: 15,
  RATION_CARD: 30,
};

export function planBackwards(
  scheme: Scheme,
  today: string = '2026-10-05'
): BackwardsPlan | null {
  const deadlineStr = scheme.applicationWindow.endDate;
  if (!deadlineStr) return null;

  const deadlineMs = new Date(deadlineStr).getTime();
  const todayMs = new Date(today).getTime();

  const steps: BackwardsPlanStep[] = [];
  let isFeasible = true;
  let totalLeadDays = 5; // Final submission lead buffer

  // Calculate required certificate procurement lead time
  let maxCertLeadDays = 0;
  for (const cert of scheme.requiredCertificates) {
    const days = scheme.estimatedIssuanceDays?.[cert] ?? DEFAULT_ISSUANCE_DAYS[cert] ?? 15;
    if (days > maxCertLeadDays) {
      maxCertLeadDays = days;
    }
  }

  totalLeadDays += maxCertLeadDays;

  const latestStartDateMs = deadlineMs - totalLeadDays * 24 * 60 * 60 * 1000;
  const latestStartDate = new Date(latestStartDateMs).toISOString().split('T')[0];

  if (latestStartDateMs < todayMs) {
    isFeasible = false;
  }

  // Build step 1: Document procurement
  let stepNum = 1;
  for (const cert of scheme.requiredCertificates) {
    const days = scheme.estimatedIssuanceDays?.[cert] ?? DEFAULT_ISSUANCE_DAYS[cert] ?? 15;
    const certTargetMs = deadlineMs - 7 * 24 * 60 * 60 * 1000;
    const certStartMs = certTargetMs - days * 24 * 60 * 60 * 1000;

    steps.push({
      stepNumber: stepNum++,
      title: `Apply for ${cert.replace('_', ' ')}`,
      description: `Apply at nearest Seva Sindhu / MeeSeva / CSC centre. Takes approx ${days} days.`,
      startDate: new Date(certStartMs).toISOString().split('T')[0],
      targetDate: new Date(certTargetMs).toISOString().split('T')[0],
      isCriticalPath: days === maxCertLeadDays,
      certificateType: cert,
    });
  }

  // Build final submission step
  steps.push({
    stepNumber: stepNum,
    title: `Final Portal Online Submission for ${scheme.title}`,
    description: `Upload verified certificates and submit application on ${scheme.sourceCitation.portalName}.`,
    startDate: new Date(deadlineMs - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetDate: deadlineStr,
    isCriticalPath: true,
  });

  return {
    schemeId: scheme.id,
    deadline: deadlineStr,
    isFeasible,
    feasibilityReason: isFeasible
      ? `Start document procurement by ${latestStartDate} to meet ${deadlineStr} deadline.`
      : `CRITICAL DEADLINE WARNING: Latest required start date (${latestStartDate}) is already past today's date (${today}). Urgent action required.`,
    steps,
  };
}
