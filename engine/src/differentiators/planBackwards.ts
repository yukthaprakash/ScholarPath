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
  const deadlineStr = scheme.applicationWindow?.endDate;
  if (!deadlineStr) return null;

  const deadlineMs = new Date(deadlineStr).getTime();
  const todayMs = new Date(today).getTime();

  if (isNaN(deadlineMs) || isNaN(todayMs)) return null;

  const bufferDays = 2; // Mandatory 2-day buffer prior to portal deadline
  const steps: BackwardsPlanStep[] = [];
  let isFeasible = true;

  // Calculate required certificate procurement lead time using MAX duration
  let maxCertLeadDays = 0;
  for (const cert of scheme.requiredCertificates) {
    const days = scheme.estimatedIssuanceDays?.[cert] ?? DEFAULT_ISSUANCE_DAYS[cert] ?? 15;
    if (days > maxCertLeadDays) {
      maxCertLeadDays = days;
    }
  }

  const totalLeadDays = maxCertLeadDays + bufferDays;
  const latestStartDateMs = deadlineMs - totalLeadDays * 24 * 60 * 60 * 1000;
  const latestStartDate = new Date(latestStartDateMs).toISOString().split('T')[0];

  if (latestStartDateMs < todayMs) {
    isFeasible = false;
  }

  // Determine urgency bucket
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDeadline = Math.floor((deadlineMs - todayMs) / msPerDay);
  const daysUntilStart = Math.floor((latestStartDateMs - todayMs) / msPerDay);

  let urgencyBucket: 'EXPIRED' | 'CRITICAL' | 'URGENT' | 'UPCOMING' | 'COMFORTABLE';
  if (daysUntilDeadline < 0) {
    urgencyBucket = 'EXPIRED';
  } else if (!isFeasible) {
    urgencyBucket = 'CRITICAL';
  } else if (daysUntilStart <= 7) {
    urgencyBucket = 'URGENT';
  } else if (daysUntilStart <= 21) {
    urgencyBucket = 'UPCOMING';
  } else {
    urgencyBucket = 'COMFORTABLE';
  }

  // Build document procurement steps
  let stepNum = 1;
  const targetSubmissionPrepMs = deadlineMs - bufferDays * msPerDay;

  for (const cert of scheme.requiredCertificates) {
    const days = scheme.estimatedIssuanceDays?.[cert] ?? DEFAULT_ISSUANCE_DAYS[cert] ?? 15;
    const certTargetMs = targetSubmissionPrepMs;
    const certStartMs = certTargetMs - days * msPerDay;

    steps.push({
      stepNumber: stepNum++,
      title: `Apply for ${cert.replace('_', ' ')}`,
      description: `Apply at nearest Seva Sindhu / MeeSeva / CSC centre. Takes approx ${days} days (conservative max).`,
      startDate: new Date(certStartMs).toISOString().split('T')[0],
      targetDate: new Date(certTargetMs).toISOString().split('T')[0],
      isCriticalPath: days === maxCertLeadDays,
      certificateType: cert,
    });
  }

  // Build final submission step (with 2-day buffer)
  steps.push({
    stepNumber: stepNum,
    title: `Final Portal Online Submission for ${scheme.title}`,
    description: `Upload verified certificates and submit application on ${scheme.sourceCitation.portalName} with 2-day safety buffer.`,
    startDate: new Date(targetSubmissionPrepMs).toISOString().split('T')[0],
    targetDate: deadlineStr,
    isCriticalPath: true,
  });

  return {
    schemeId: scheme.id,
    deadline: deadlineStr,
    isFeasible,
    feasibilityReason: isFeasible
      ? `Start document procurement by ${latestStartDate} to meet ${deadlineStr} deadline with a 2-day buffer.`
      : `CRITICAL DEADLINE WARNING: Latest required start date (${latestStartDate}) is already past today's date (${today}). Infeasible under standard processing times.`,
    steps,
    bufferDays,
    urgencyBucket,
    latestStartDate,
  };
}
