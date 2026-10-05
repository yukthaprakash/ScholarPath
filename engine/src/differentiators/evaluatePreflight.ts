import { StudentProfile, Scheme, PreflightResult, PreflightIssue, ReadinessStatus } from '../types.js';

export function evaluatePreflight(profile: StudentProfile, scheme: Scheme): PreflightResult {
  const issues: PreflightIssue[] = [];

  // Rejection Cause 1: Aadhaar-bank account seeding (General Guidance)
  if (profile.documentsReadiness.isAadhaarSeededWithBank === false) {
    issues.push({
      field: 'documentsReadiness.isAadhaarSeededWithBank',
      severity: 'CRITICAL',
      issue: '(General Guidance) Bank account is not seeded with Aadhaar DBT (Direct Benefit Transfer).',
      remedy: 'Visit your bank branch and submit NPCI Aadhaar seeding form immediately.',
    });
  } else if (profile.documentsReadiness.isAadhaarSeededWithBank === 'UNSURE') {
    issues.push({
      field: 'documentsReadiness.isAadhaarSeededWithBank',
      severity: 'WARNING',
      issue: '(General Guidance) Aadhaar bank seeding status is unverified.',
      remedy: 'Check seeding status via UIDAI portal or bank SMS service.',
    });
  }

  // Rejection Cause 2: Name / DOB Mismatch across documents (General Guidance)
  if (profile.documentsReadiness.isNameMatchingAadhaar === false) {
    issues.push({
      field: 'documentsReadiness.isNameMatchingAadhaar',
      severity: 'CRITICAL',
      issue: '(General Guidance) Name mismatch between Marks Card and Aadhaar Card.',
      remedy: 'Apply for name correction on Aadhaar portal or provide gazette notification.',
    });
  }

  if (profile.documentsReadiness.isDobMatchingAadhaar === false) {
    issues.push({
      field: 'documentsReadiness.isDobMatchingAadhaar',
      severity: 'CRITICAL',
      issue: '(General Guidance) Date of Birth mismatch between SSLC marks card and Aadhaar card.',
      remedy: 'Update Date of Birth on Aadhaar using SSLC marks card as proof.',
    });
  }

  // Rejection Cause 3: Income Certificate Current Year Validity (General Guidance)
  if (scheme.requiredCertificates.includes('INCOME_CERTIFICATE')) {
    if (profile.documentsReadiness.isIncomeCertificateValidCurrentYear === false) {
      issues.push({
        field: 'documentsReadiness.isIncomeCertificateValidCurrentYear',
        severity: 'CRITICAL',
        issue: '(General Guidance) Income Certificate is expired or not valid for current academic year.',
        remedy: 'Apply for fresh Income Certificate at Nadakacheri / Revenue office.',
      });
    } else if (profile.documentsReadiness.isIncomeCertificateValidCurrentYear === 'UNSURE') {
      issues.push({
        field: 'documentsReadiness.isIncomeCertificateValidCurrentYear',
        severity: 'WARNING',
        issue: '(General Guidance) Current year validity of Income Certificate is unconfirmed.',
        remedy: 'Verify financial year mentioned on your Revenue Department Income Certificate.',
      });
    }
  }

  // Rejection Cause 4: Institute Govt Registration (General Guidance)
  if (!profile.academic.isInstituteGovtRegistered) {
    issues.push({
      field: 'academic.isInstituteGovtRegistered',
      severity: 'CRITICAL',
      issue: '(General Guidance) Institution is not registered / approved on official portal.',
      remedy: 'Request your college nodal officer to complete AISHE / portal onboarding.',
    });
  }

  let readinessStatus: ReadinessStatus = 'READY';
  const hasCritical = issues.some(i => i.severity === 'CRITICAL');
  const hasWarning = issues.some(i => i.severity === 'WARNING');

  if (hasCritical) {
    readinessStatus = 'HIGH_RISK_REJECTION';
  } else if (hasWarning) {
    readinessStatus = 'NEEDS_ACTION';
  } else {
    readinessStatus = 'READY';
  }

  return {
    schemeId: scheme.id,
    readinessStatus,
    issues,
  };
}
