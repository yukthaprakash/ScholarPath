import fs from 'fs';
import path from 'path';
import {
  StudentProfile,
  Scheme,
  SchemeMatch,
  EducationLevel,
  Gender,
  CasteCategory,
  CertificateType,
  CertificateStatus,
  StudentCertificate,
  matchScheme,
  analyzeAll,
  quickCheck
} from '@scholarpath/engine';
import { ProfileRecord } from './profileService';
import { DocumentRecord } from './documentService';
import { NotFoundError } from '../errors/AppError';

export const VALID_CERTIFICATE_TYPES = new Set<string>([
  'INCOME_CERTIFICATE',
  'CASTE_CERTIFICATE',
  'DOMICILE_CERTIFICATE',
  'DISABILITY_CERTIFICATE',
  'MARKSHEET',
  'BONAFIDE_CERTIFICATE',
  'AADHAAR_CARD',
  'RATION_CARD'
]);

/**
 * Calculates a student's age given their date of birth string and a reference date.
 */
export function calculateAge(dateOfBirth?: string | null, referenceDate: string = '2026-10-05'): number {
  if (!dateOfBirth) return 0;
  const birth = new Date(dateOfBirth);
  const ref = new Date(referenceDate);
  if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return 0;
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Maps backend DocumentRecord items into engine StudentCertificate objects.
 * Accurately reflects availability and validity without fabricating missing certificates.
 */
export function mapDocumentsToCertificates(
  documents: DocumentRecord[],
  referenceDate: string = '2026-10-05'
): StudentCertificate[] {
  const certificates: StudentCertificate[] = [];
  const refDate = referenceDate.slice(0, 10);

  for (const doc of documents) {
    const rawType = (doc.type || '').toUpperCase().trim();
    if (!VALID_CERTIFICATE_TYPES.has(rawType)) {
      continue;
    }

    const certType = rawType as CertificateType;
    let status: CertificateStatus = 'VALID';

    if (doc.validUntil) {
      const validUntilStr = doc.validUntil.slice(0, 10);
      if (validUntilStr < refDate) {
        status = 'EXPIRED';
      }
    }

    certificates.push({
      type: certType,
      isAvailable: true,
      validUntil: doc.validUntil ? doc.validUntil.slice(0, 10) : undefined,
      issuedDate: doc.issuedOn ? doc.issuedOn.slice(0, 10) : undefined,
      issuingAuthority: doc.issuer || undefined,
      certificateNumber: doc.id,
      status
    });
  }

  return certificates;
}

/**
 * Validated mapper converting backend ProfileRecord and DocumentRecord items
 * into the engine's canonical StudentProfile domain representation.
 */
export function mapToEngineProfile(
  profile: ProfileRecord,
  documents: DocumentRecord[],
  referenceDate: string = '2026-10-05'
): StudentProfile {
  const extra = (profile.extraAttributes ?? {}) as Record<string, unknown>;

  // Academic level normalization
  let educationLevel: EducationLevel = 'UNDERGRADUATE';
  if (profile.educationLevel) {
    const normalizedLevel = profile.educationLevel.toUpperCase().trim();
    const validLevels: EducationLevel[] = [
      'SCHOOL_CLASS_1_8',
      'SCHOOL_CLASS_9_10',
      'SCHOOL_CLASS_11_12',
      'DIPLOMA',
      'UNDERGRADUATE',
      'POSTGRADUATE',
      'DOCTORAL',
      'POST_DOCTORAL'
    ];
    if (validLevels.includes(normalizedLevel as EducationLevel)) {
      educationLevel = normalizedLevel as EducationLevel;
    }
  }

  // Gender normalization
  let gender: Gender = 'ANY';
  if (profile.gender) {
    const g = profile.gender.toUpperCase().trim();
    if (['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER', 'ANY'].includes(g)) {
      gender = g as Gender;
    }
  }

  // Caste category normalization
  let casteCategory: CasteCategory = 'ANY';
  if (profile.category) {
    const c = profile.category.toUpperCase().trim();
    if (['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'MINORITIES', 'ANY'].includes(c)) {
      casteCategory = c as CasteCategory;
    }
  }

  // Age calculation
  const calculatedAge = calculateAge(profile.dateOfBirth, referenceDate);
  const age = typeof extra.age === 'number' && extra.age > 0 ? extra.age : calculatedAge;

  // Institute Type normalization
  let instituteType: 'GOVERNMENT' | 'AIDED' | 'PRIVATE' | 'DEEMED' = 'GOVERNMENT';
  if (typeof extra.instituteType === 'string') {
    const it = extra.instituteType.toUpperCase().trim();
    if (it === 'GOVERNMENT' || it === 'AIDED' || it === 'PRIVATE' || it === 'DEEMED') {
      instituteType = it;
    }
  }

  // Certificates mapping from real documents
  const certificates = mapDocumentsToCertificates(documents, referenceDate);

  // Documents readiness evaluation
  const readiness = (extra.documentsReadiness ?? {}) as Record<string, unknown>;
  const hasIncomeCert = certificates.some(
    (c) => c.type === 'INCOME_CERTIFICATE' && c.status === 'VALID'
  );

  return {
    id: profile.userId,
    academic: {
      educationLevel,
      courseName: profile.currentCourse || '',
      currentYear: profile.courseYear ?? 1,
      scorePercentage:
        profile.academicPercentage !== null && profile.academicPercentage !== undefined
          ? Number(profile.academicPercentage)
          : 0,
      cgpa: typeof extra.cgpa === 'number' ? extra.cgpa : undefined,
      gradingScale: typeof extra.gradingScale === 'number' ? extra.gradingScale : undefined,
      boardOrUniversity: typeof extra.boardOrUniversity === 'string' ? extra.boardOrUniversity : undefined,
      instituteType,
      institutePincode: typeof extra.institutePincode === 'string' ? extra.institutePincode : undefined,
      instituteState: (profile.instituteState || profile.domicileState || '').toUpperCase(),
      isInstituteGovtRegistered:
        extra.isInstituteGovtRegistered !== undefined ? Boolean(extra.isInstituteGovtRegistered) : true
    },
    personal: {
      age,
      gender,
      casteCategory,
      religion: profile.religion || undefined,
      isDisability: Boolean(profile.isDifferentlyAbled),
      disabilityPercentage:
        profile.disabilityPercentage !== null && profile.disabilityPercentage !== undefined
          ? Number(profile.disabilityPercentage)
          : undefined,
      maritalStatus:
        extra.maritalStatus === 'MARRIED' || extra.maritalStatus === 'SINGLE'
          ? (extra.maritalStatus as 'SINGLE' | 'MARRIED')
          : undefined,
      isSingleGirlChild: Boolean(profile.isSingleGirlChild),
      isOrphan: typeof extra.isOrphan === 'boolean' ? extra.isOrphan : undefined
    },
    demographics: {
      domicileState: (profile.domicileState || '').toUpperCase(),
      district: typeof extra.district === 'string' ? extra.district : undefined,
      areaType: extra.areaType === 'RURAL' || extra.areaType === 'URBAN' ? (extra.areaType as 'RURAL' | 'URBAN') : undefined
    },
    financial: {
      annualHouseholdIncome:
        profile.annualFamilyIncome !== null && profile.annualFamilyIncome !== undefined
          ? Number(profile.annualFamilyIncome)
          : 0,
      isParentGovernmentEmployee:
        typeof extra.isParentGovernmentEmployee === 'boolean' ? extra.isParentGovernmentEmployee : undefined
    },
    certificates,
    documentsReadiness: {
      isAadhaarSeededWithBank:
        typeof readiness.isAadhaarSeededWithBank === 'boolean' ? readiness.isAadhaarSeededWithBank : 'UNSURE',
      isNameMatchingAadhaar:
        typeof readiness.isNameMatchingAadhaar === 'boolean' ? readiness.isNameMatchingAadhaar : 'UNSURE',
      isDobMatchingAadhaar:
        typeof readiness.isDobMatchingAadhaar === 'boolean' ? readiness.isDobMatchingAadhaar : 'UNSURE',
      isIncomeCertificateValidCurrentYear:
        typeof readiness.isIncomeCertificateValidCurrentYear === 'boolean'
          ? readiness.isIncomeCertificateValidCurrentYear
          : hasIncomeCert
            ? true
            : 'UNSURE'
    }
  };
}

let cachedSchemes: Scheme[] | null = null;

/**
 * Loads verified government scholarship schemes from the data/schemes directory.
 */
export function loadVerifiedSchemes(): Scheme[] {
  if (cachedSchemes && cachedSchemes.length > 0) {
    return cachedSchemes;
  }

  const schemesDir = path.resolve(__dirname, '../../../data/schemes');
  if (!fs.existsSync(schemesDir)) {
    return [];
  }

  const files = fs.readdirSync(schemesDir).filter((file) => file.endsWith('.json'));
  const schemes: Scheme[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(schemesDir, file), 'utf-8');
      const json = JSON.parse(content);
      schemes.push(json as Scheme);
    } catch (err) {
      console.error(`[EngineAdapter] Failed loading scheme from ${file}:`, err);
    }
  }

  cachedSchemes = schemes;
  return schemes;
}

/**
 * Resets the in-memory cached schemes (useful for tests).
 */
export function clearSchemeCache(): void {
  cachedSchemes = null;
}

/**
 * Finds a single scheme by its slug or ID.
 */
export function loadVerifiedScheme(slugOrId: string): Scheme | undefined {
  const schemes = loadVerifiedSchemes();
  return schemes.find((s) => s.id === slugOrId || (s as { slug?: string }).slug === slugOrId);
}

export interface EvaluateOptions {
  profile: ProfileRecord;
  documents: DocumentRecord[];
  schemeSlug?: string;
  today?: string;
}

export interface EvaluateResult {
  studentId: string;
  evaluatedAt: string;
  today: string;
  summary: {
    eligibleCount: number;
    nearlyEligibleCount: number;
    needsVerificationCount: number;
    notMatchedCount: number;
    totalFinancialOpportunity: number;
  };
  matches: SchemeMatch[];
}

export interface EngineAdapter {
  evaluate(options: EvaluateOptions): Promise<EvaluateResult>;
  quickCheck(profile: ProfileRecord, documents: DocumentRecord[], schemeSlug: string, today?: string): Promise<{
    state: string;
    isEligibleOrNearly: boolean;
    financialBenefit: number;
  }>;
}

export class LiveEngineAdapter implements EngineAdapter {
  async evaluate(options: EvaluateOptions): Promise<EvaluateResult> {
    const today = options.today || '2026-10-05';
    const studentProfile = mapToEngineProfile(options.profile, options.documents, today);

    if (options.schemeSlug) {
      const scheme = loadVerifiedScheme(options.schemeSlug);
      if (!scheme) {
        throw new NotFoundError(`Scheme with slug '${options.schemeSlug}' not found`);
      }

      const match = matchScheme(studentProfile, scheme, today);
      const isEligibleOrNearly = match.state === 'ELIGIBLE' || match.state === 'NEARLY_ELIGIBLE';

      return {
        studentId: studentProfile.id,
        evaluatedAt: new Date().toISOString(),
        today,
        summary: {
          eligibleCount: match.state === 'ELIGIBLE' ? 1 : 0,
          nearlyEligibleCount: match.state === 'NEARLY_ELIGIBLE' ? 1 : 0,
          needsVerificationCount: match.state === 'NEEDS_VERIFICATION' ? 1 : 0,
          notMatchedCount: match.state === 'NOT_MATCHED' ? 1 : 0,
          totalFinancialOpportunity: isEligibleOrNearly ? match.financialBenefit : 0
        },
        matches: [match]
      };
    }

    const schemes = loadVerifiedSchemes();
    const result = analyzeAll(studentProfile, schemes, { today });

    return {
      studentId: result.studentId,
      evaluatedAt: result.timestamp,
      today: result.today,
      summary: result.summary,
      matches: result.matches
    };
  }

  async quickCheck(
    profile: ProfileRecord,
    documents: DocumentRecord[],
    schemeSlug: string,
    today: string = '2026-10-05'
  ) {
    const scheme = loadVerifiedScheme(schemeSlug);
    if (!scheme) {
      throw new NotFoundError(`Scheme with slug '${schemeSlug}' not found`);
    }

    const studentProfile = mapToEngineProfile(profile, documents, today);
    return quickCheck(studentProfile, scheme, today);
  }
}

export const engineAdapter: EngineAdapter = new LiveEngineAdapter();
