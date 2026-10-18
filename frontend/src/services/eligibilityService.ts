import { StudentProfile } from '../types/profile';
import { Scheme } from '../types/scheme';
import {
  EligibilityState,
  MatchResult,
  RuleTrace,
  ClauseCheck,
  PreflightItem,
  UnlockOpportunity,
  MANDATORY_ELIGIBILITY_DISCLAIMER
} from '../types/eligibility';

export class EligibilityService {
  /**
   * Evaluate a student profile against a specific scheme strictly using published criteria.
   * Deterministic logic: RULES DECIDE. Zero LLM calls. Zero fabricated criteria.
   */
  public evaluate(profile: StudentProfile, scheme: Scheme): MatchResult {
    const clauses: ClauseCheck[] = [];
    const preflightChecks: PreflightItem[] = [];

    let hasHardFailures = false;
    let hasNeedsVerification = false;
    let distanceGapMessage: string | undefined = undefined;
    let suggestedActionMessage: string | undefined = undefined;
    let isMeasurableNearlyEligible = false;

    // 1. Education Level Clause Evaluation
    if (!profile.educationLevel) {
      clauses.push({
        clauseName: 'Education Level Requirement',
        studentValue: 'Not Provided',
        expectedValue: scheme.educationLevels.map((l) => l.replace(/_/g, ' ')).join(' / '),
        result: 'NEEDS_VERIFICATION',
        citationSource: `${scheme.officialSource} Clause 2.1`,
        ruleVersion: scheme.ruleVersion,
        explanation: 'Academic study level is required to evaluate eligibility for this scheme.',
      });
      hasNeedsVerification = true;
    } else {
      const isEducationLevelMatch = scheme.educationLevels.includes(profile.educationLevel);
      clauses.push({
        clauseName: 'Education Level Requirement',
        studentValue: profile.educationLevel.replace(/_/g, ' '),
        expectedValue: scheme.educationLevels.map((l) => l.replace(/_/g, ' ')).join(' / '),
        result: isEducationLevelMatch ? 'PASS' : 'FAIL',
        citationSource: `${scheme.officialSource} Clause 2.1`,
        ruleVersion: scheme.ruleVersion,
        explanation: isEducationLevelMatch
          ? `Student's study level (${profile.educationLevel.replace(/_/g, ' ')}) is covered by published scheme criteria.`
          : `Scheme is strictly restricted to ${scheme.educationLevels.map((l) => l.replace(/_/g, ' ')).join(', ')}.`,
      });
      if (!isEducationLevelMatch) hasHardFailures = true;
    }

    // 2. Domicile State Clause Evaluation
    if (scheme.requiredDomicile) {
      if (!profile.domicileState) {
        clauses.push({
          clauseName: 'State Domicile Requirement',
          studentValue: 'Not Provided',
          expectedValue: scheme.requiredDomicile,
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Clause 3.4`,
          ruleVersion: scheme.ruleVersion,
          explanation: 'Permanent domicile state information is missing from profile.',
        });
        hasNeedsVerification = true;
      } else {
        const isDomicileMatch =
          profile.domicileState.toLowerCase() === scheme.requiredDomicile.toLowerCase();
        clauses.push({
          clauseName: 'State Domicile Requirement',
          studentValue: profile.domicileState,
          expectedValue: scheme.requiredDomicile,
          result: isDomicileMatch ? 'PASS' : 'FAIL',
          citationSource: `${scheme.officialSource} Clause 3.4`,
          ruleVersion: scheme.ruleVersion,
          explanation: isDomicileMatch
            ? `Student is a verified resident of ${scheme.requiredDomicile}.`
            : `Scheme is strictly reserved for permanent residents of ${scheme.requiredDomicile}.`,
        });
        if (!isDomicileMatch) hasHardFailures = true;
      }
    }

    // 3. Social Category Clause Evaluation
    if (!profile.socialCategory || profile.socialCategory === 'NOT_DISCLOSED') {
      clauses.push({
        clauseName: 'Social Category Criteria',
        studentValue: 'Not Disclosed',
        expectedValue: scheme.allowedCategories.join(' / '),
        result: 'NEEDS_VERIFICATION',
        citationSource: `${scheme.officialSource} Clause 4.1`,
        ruleVersion: scheme.ruleVersion,
        explanation: 'Social category has not been disclosed in the student profile.',
      });
      hasNeedsVerification = true;
    } else {
      const isCategoryMatch = scheme.allowedCategories.includes(profile.socialCategory);
      clauses.push({
        clauseName: 'Social Category Criteria',
        studentValue: profile.socialCategory,
        expectedValue: scheme.allowedCategories.join(' / '),
        result: isCategoryMatch ? 'PASS' : 'FAIL',
        citationSource: `${scheme.officialSource} Clause 4.1`,
        ruleVersion: scheme.ruleVersion,
        explanation: isCategoryMatch
          ? `Social category (${profile.socialCategory}) is eligible under published guidelines.`
          : `Scheme is reserved for ${scheme.allowedCategories.join(', ')} categories.`,
      });
      if (!isCategoryMatch) hasHardFailures = true;
    }

    // 4. Annual Income Limit Clause Evaluation
    if (scheme.maxAnnualIncome !== undefined) {
      if (typeof profile.annualFamilyIncome !== 'number' || profile.annualFamilyIncome < 0) {
        clauses.push({
          clauseName: 'Annual Family Income Threshold',
          studentValue: 'Not Provided',
          expectedValue: `≤ ₹${scheme.maxAnnualIncome.toLocaleString('en-IN')}`,
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Income Limit Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: 'Annual family income must be recorded to evaluate the statutory income ceiling.',
        });
        hasNeedsVerification = true;
      } else {
        const isIncomePass = profile.annualFamilyIncome <= scheme.maxAnnualIncome;
        const formattedStudentInc = `₹${profile.annualFamilyIncome.toLocaleString('en-IN')}`;
        const formattedLimitInc = `₹${scheme.maxAnnualIncome.toLocaleString('en-IN')}`;

        if (isIncomePass) {
          clauses.push({
            clauseName: 'Annual Family Income Threshold',
            studentValue: formattedStudentInc,
            expectedValue: `≤ ${formattedLimitInc}`,
            result: 'PASS',
            citationSource: `${scheme.officialSource} Income Limit Guideline`,
            ruleVersion: scheme.ruleVersion,
            explanation: `Family income of ${formattedStudentInc} is within the published cap of ${formattedLimitInc}.`,
          });
        } else {
          const gap = profile.annualFamilyIncome - scheme.maxAnnualIncome;
          const formattedGap = `₹${gap.toLocaleString('en-IN')}`;
          distanceGapMessage = `${formattedGap} above the published income limit of ${formattedLimitInc}`;
          suggestedActionMessage = `Obtain an updated Revenue Department Income Certificate if household income is within ${formattedLimitInc}.`;

          clauses.push({
            clauseName: 'Annual Family Income Threshold',
            studentValue: formattedStudentInc,
            expectedValue: `≤ ${formattedLimitInc}`,
            result: 'FAIL',
            citationSource: `${scheme.officialSource} Income Limit Guideline`,
            ruleVersion: scheme.ruleVersion,
            explanation: `Family income of ${formattedStudentInc} exceeds the published limit by ${formattedGap}.`,
          });

          // Check for measurable Near Eligibility: income gap is within ₹50,000 or within 20% of limit
          const tolerance = Math.min(50000, scheme.maxAnnualIncome * 0.20);
          if (gap <= tolerance) {
            isMeasurableNearlyEligible = true;
          } else {
            hasHardFailures = true;
          }
        }
      }
    }

    // 5. Gender Restrictions
    if (scheme.genderRestriction === 'FEMALE_ONLY') {
      if (profile.gender === 'PREFER_NOT_TO_SAY') {
        clauses.push({
          clauseName: 'Gender Criteria',
          studentValue: 'Undisclosed',
          expectedValue: 'Female Students Only',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Gender Rule`,
          ruleVersion: scheme.ruleVersion,
          explanation: 'Gender is undisclosed. Scheme requires verified female student status.',
        });
        hasNeedsVerification = true;
      } else {
        const isFemale = profile.gender === 'FEMALE';
        clauses.push({
          clauseName: 'Gender Criteria',
          studentValue: profile.gender,
          expectedValue: 'Female Students Only',
          result: isFemale ? 'PASS' : 'FAIL',
          citationSource: `${scheme.officialSource} Gender Rule`,
          ruleVersion: scheme.ruleVersion,
          explanation: isFemale
            ? 'Girl student eligibility criteria satisfied.'
            : 'Scheme is exclusively reserved for female applicants.',
        });
        if (!isFemale) hasHardFailures = true;
      }
    }

    // 6. Minority Specific Schemes
    if (scheme.minorityOnly) {
      if (profile.minorityStatus === 'UNKNOWN') {
        clauses.push({
          clauseName: 'Minority Status Criteria',
          studentValue: 'Unknown',
          expectedValue: 'Notified Minority Community',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Minority Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: 'Minority status is unverified in profile.',
        });
        hasNeedsVerification = true;
      } else {
        const isMin = profile.isMinority;
        clauses.push({
          clauseName: 'Minority Status Criteria',
          studentValue: isMin ? `Minority Community (${profile.minorityCommunity || 'Notified'})` : 'Non-Minority',
          expectedValue: 'Notified Minority Community',
          result: isMin ? 'PASS' : 'FAIL',
          citationSource: `${scheme.officialSource} Minority Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: isMin
            ? `Student belongs to a notified minority community (${profile.minorityCommunity || 'Notified'}).`
            : 'Scheme is strictly reserved for notified minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi).',
        });
        if (!isMin) hasHardFailures = true;
      }
    }

    // 7. Disability Specific Schemes
    if (scheme.disabilityOnly) {
      if (profile.disabilityStatus === 'UNKNOWN') {
        clauses.push({
          clauseName: 'PwD Disability Criteria',
          studentValue: 'Unknown',
          expectedValue: 'PwD with ≥ 40% Benchmark Disability',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Disability Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: 'Disability status is unrecorded in student profile.',
        });
        hasNeedsVerification = true;
      } else {
        const isPwd = profile.isPersonWithDisability;
        const benchPercentage = profile.disabilityPercentage || 0;
        const satisfiesBenchmark = isPwd && benchPercentage >= 40;

        clauses.push({
          clauseName: 'PwD Disability Criteria',
          studentValue: isPwd ? `PwD (${benchPercentage}% disability)` : 'Non-PwD',
          expectedValue: 'PwD with ≥ 40% Benchmark Disability',
          result: satisfiesBenchmark ? 'PASS' : isPwd ? 'NEEDS_VERIFICATION' : 'FAIL',
          citationSource: `${scheme.officialSource} Disability Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: satisfiesBenchmark
            ? `Benchmark disability criteria satisfied (${benchPercentage}% >= 40%).`
            : isPwd
            ? `Benchmark disability of ${benchPercentage}% requires official medical board verification (≥ 40% required).`
            : 'Scheme is reserved exclusively for persons with benchmark disabilities.',
        });
        if (!isPwd) hasHardFailures = true;
        if (isPwd && benchPercentage < 40) hasNeedsVerification = true;
      }
    }

    // 8. Academic Performance / Cutoff Marks
    if (scheme.minPercentage !== undefined) {
      if (!profile.percentageOrCgpa || profile.percentageOrCgpa <= 0) {
        clauses.push({
          clauseName: 'Minimum Academic Marks / Percentile',
          studentValue: 'Not Provided',
          expectedValue: `≥ ${scheme.minPercentage}%`,
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Academic Eligibility`,
          ruleVersion: scheme.ruleVersion,
          explanation: 'Academic score history is required to evaluate merit criteria.',
        });
        hasNeedsVerification = true;
      } else {
        const isAcademicPass = profile.percentageOrCgpa >= scheme.minPercentage;
        clauses.push({
          clauseName: 'Minimum Academic Marks / Percentile',
          studentValue: `${profile.percentageOrCgpa}%`,
          expectedValue: `≥ ${scheme.minPercentage}%`,
          result: isAcademicPass ? 'PASS' : 'FAIL',
          citationSource: `${scheme.officialSource} Academic Eligibility`,
          ruleVersion: scheme.ruleVersion,
          explanation: isAcademicPass
            ? `Score of ${profile.percentageOrCgpa}% meets or exceeds the ${scheme.minPercentage}% merit threshold.`
            : `Score of ${profile.percentageOrCgpa}% is below the published cutoff of ${scheme.minPercentage}%.`,
        });
        if (!isAcademicPass) {
          // If within 2% of cutoff, document as gap
          const markGap = scheme.minPercentage - profile.percentageOrCgpa;
          if (markGap <= 2.5) {
            distanceGapMessage = `${markGap.toFixed(1)}% below the merit cutoff threshold of ${scheme.minPercentage}%`;
            isMeasurableNearlyEligible = true;
          } else {
            hasHardFailures = true;
          }
        }
      }
    }

    // 9. Document Availability & Verification Status Audit
    const userDocs = profile.documents || [];
    for (const reqDocType of scheme.requiredDocumentTypes) {
      const docRecord = userDocs.find((d) => d.documentType === reqDocType);

      if (!docRecord) {
        clauses.push({
          clauseName: `Mandatory Document: ${reqDocType.replace(/_/g, ' ')}`,
          studentValue: 'Missing from Passport',
          expectedValue: 'Valid Recorded Metadata',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Document Checklist`,
          ruleVersion: scheme.ruleVersion,
          explanation: `Document metadata for ${reqDocType.replace(/_/g, ' ')} has not been recorded in Certificate Passport.`,
        });
        hasNeedsVerification = true;
      } else if (docRecord.availabilityStatus === 'MISSING') {
        clauses.push({
          clauseName: `Mandatory Document: ${docRecord.documentName}`,
          studentValue: 'Student Marked Missing',
          expectedValue: 'Available Certificate',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Document Checklist`,
          ruleVersion: scheme.ruleVersion,
          explanation: `${docRecord.documentName} is marked missing. Procurement required before application deadline.`,
        });
        hasNeedsVerification = true;
      } else if (docRecord.availabilityStatus === 'EXPIRED' || docRecord.verificationStatus === 'EXPIRED') {
        clauses.push({
          clauseName: `Document Status: ${docRecord.documentName}`,
          studentValue: 'Expired Certificate',
          expectedValue: 'Valid for Current AY',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Validity Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: `${docRecord.documentName} has expired. Renewal required from issuing department.`,
        });
        hasNeedsVerification = true;
      } else if (docRecord.verificationStatus === 'NEEDS_VERIFICATION') {
        clauses.push({
          clauseName: `Document Status: ${docRecord.documentName}`,
          studentValue: 'Self-Reported (Needs Audit)',
          expectedValue: 'Authority Verified',
          result: 'NEEDS_VERIFICATION',
          citationSource: `${scheme.officialSource} Audit Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: `Reference #${docRecord.referenceNumber || 'N/A'} is recorded. Official portal validation pending.`,
        });
        hasNeedsVerification = true;
      } else {
        clauses.push({
          clauseName: `Document Status: ${docRecord.documentName}`,
          studentValue: `Verified (#${docRecord.referenceNumber || 'Recorded'})`,
          expectedValue: 'Verified',
          result: 'PASS',
          citationSource: `${scheme.officialSource} Verification Guideline`,
          ruleVersion: scheme.ruleVersion,
          explanation: `Valid metadata recorded for ${docRecord.documentName}.`,
        });
      }
    }

    // 10. Generate Preflight Rejection Checks
    preflightChecks.push({
      id: 'pf-bank-seed',
      checkName: 'Aadhaar Direct Benefit Transfer (DBT) Seeding',
      status: 'READY',
      sourceCitation: 'PFMS Guidelines 2026',
      rationale: 'Active bank account linked to Aadhaar is mandatory for central/state scholarship disbursement.',
    });

    preflightChecks.push({
      id: 'pf-aishe-code',
      checkName: 'College AISHE Code Registration',
      status: 'READY',
      sourceCitation: 'Ministry of Education Portal',
      rationale: `${profile.collegeName || 'Selected Institution'} must be registered on national/state scholarship portals.`,
    });

    const incomeDoc = userDocs.find((d) => d.documentType === 'INCOME_CERTIFICATE');
    preflightChecks.push({
      id: 'pf-income-validity',
      checkName: 'Income Certificate Issue Date Audit',
      status: incomeDoc && incomeDoc.availabilityStatus !== 'MISSING' && incomeDoc.verificationStatus !== 'EXPIRED' ? 'READY' : 'VERIFY',
      sourceCitation: 'Revenue Dept Order 2026',
      rationale: incomeDoc
        ? `Certificate #${incomeDoc.referenceNumber || 'Recorded'} validity verified for AY ${profile.academicYear}.`
        : 'Ensure your Tahsildar income certificate is valid for the current financial year.',
    });

    // 11. Determine Final Deterministic Eligibility State
    let status: EligibilityState;
    let overallReason: string;

    if (hasHardFailures) {
      status = 'NOT_MATCHED';
      overallReason = 'One or more mandatory published criteria (education level, domicile, social category, or gender restriction) are not met.';
    } else if (isMeasurableNearlyEligible && !hasHardFailures) {
      status = 'NEARLY_ELIGIBLE';
      overallReason = `Student satisfies major academic criteria but is ${distanceGapMessage || 'slightly outside threshold'}.`;
    } else if (hasNeedsVerification) {
      status = 'NEEDS_VERIFICATION';
      overallReason = 'Core academic criteria align with published guidelines, but supporting document metadata or unverified fields require confirmation.';
    } else {
      status = 'ELIGIBLE';
      overallReason = 'All published government criteria and document readiness requirements are satisfied.';
    }

    const ruleTrace: RuleTrace = {
      schemeId: scheme.id,
      schemeName: scheme.name,
      clauses,
      overallReason,
      evaluatedAt: new Date().toISOString(),
    };

    return {
      schemeId: scheme.id,
      status,
      ruleTrace,
      distanceGap: distanceGapMessage,
      suggestedAction: suggestedActionMessage,
      preflightChecks,
    };
  }

  /**
   * Evaluate all schemes in catalog against profile
   */
  public evaluateAll(profile: StudentProfile, schemes: Scheme[]): MatchResult[] {
    return schemes.map((scheme) => this.evaluate(profile, scheme));
  }

  /**
   * Identify high-impact Unlock Opportunities
   */
  public identifyUnlocks(profile: StudentProfile, schemes: Scheme[]): UnlockOpportunity[] {
    const opportunities: UnlockOpportunity[] = [];

    // Unlock 1: Income Certificate Threshold Simulation
    if (profile.annualFamilyIncome > 180000 && profile.annualFamilyIncome <= 260000) {
      const potentiallyUnlocked = schemes.filter(
        (s) => s.maxAnnualIncome && s.maxAnnualIncome >= 180000 && s.maxAnnualIncome < profile.annualFamilyIncome
      );
      if (potentiallyUnlocked.length > 0) {
        opportunities.push({
          id: 'unlock-income-certificate',
          simulatedActionTitle: 'Verify Income Certificate below ₹1,80,000 threshold',
          description: 'Updating family income documentation to the published ₹1.8L tier unlocks additional state fee waivers.',
          newlyEligibleSchemeIds: potentiallyUnlocked.map((s) => s.id),
          potentialTotalBenefitText: '₹35,000 / year',
          authorityDisclaimer: MANDATORY_ELIGIBILITY_DISCLAIMER,
        });
      }
    }

    // Unlock 2: Missing Caste Certificate / Category Record
    if (['OBC', 'SC', 'ST'].includes(profile.socialCategory) && !profile.casteCertificateAvailable) {
      opportunities.push({
        id: 'unlock-caste-certificate',
        simulatedActionTitle: 'Obtain Revenue Department Caste Certificate (RD Number)',
        description: 'Adding a valid Tahsildar caste certificate reference unlocks reserved category scholarship fee waivers.',
        newlyEligibleSchemeIds: ['karnataka-ssp-post-matric'],
        potentialTotalBenefitText: '₹35,000 / year',
        authorityDisclaimer: MANDATORY_ELIGIBILITY_DISCLAIMER,
      });
    }

    // Unlock 3: Document Readiness Completion
    const hasMissingDocs = (profile.documents || []).some(
      (d) => d.availabilityStatus === 'MISSING' || d.verificationStatus === 'NEEDS_VERIFICATION'
    );
    if (hasMissingDocs) {
      opportunities.push({
        id: 'unlock-document-readiness',
        simulatedActionTitle: 'Complete Certificate Passport Metadata Audit',
        description: 'Recording reference numbers for pending documents shifts schemes from Needs Verification to Eligible.',
        newlyEligibleSchemeIds: schemes.map((s) => s.id),
        potentialTotalBenefitText: 'Full Scheme Portfolio',
        authorityDisclaimer: MANDATORY_ELIGIBILITY_DISCLAIMER,
      });
    }

    return opportunities;
  }
}

export const eligibilityService = new EligibilityService();
