import { StudentProfile, EducationLevel, SocialCategory } from '../types/profile';

/**
 * Backend Profile Representation (matches backend/src/services/profileService.ts)
 */
export interface BackendProfileRecord {
  id?: string;
  userId: string;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  category?: string | null;
  religion?: string | null;
  domicileState?: string | null;
  isDifferentlyAbled?: boolean;
  disabilityPercentage?: number | null;
  annualFamilyIncome?: number | null;
  educationLevel?: string | null;
  currentCourse?: string | null;
  courseYear?: number | null;
  academicPercentage?: number | null;
  instituteName?: string | null;
  instituteState?: string | null;
  isSingleGirlChild?: boolean;
  parentOccupation?: string | null;
  extraAttributes?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Backend Profile Update Payload (matches backend/src/schemas/profileSchema.ts)
 */
export interface BackendUpdateProfileInput {
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  category?: 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS' | null;
  religion?: 'HINDU' | 'MUSLIM' | 'CHRISTIAN' | 'SIKH' | 'BUDDHIST' | 'JAIN' | 'OTHER' | null;
  domicileState?: string | null;
  isDifferentlyAbled?: boolean;
  disabilityPercentage?: number | null;
  annualFamilyIncome?: number | null;
  educationLevel?: 'class_10' | 'class_12' | 'undergraduate' | 'postgraduate' | 'diploma' | 'phd' | null;
  currentCourse?: string | null;
  courseYear?: number | null;
  academicPercentage?: number | null;
  instituteName?: string | null;
  instituteState?: string | null;
  isSingleGirlChild?: boolean;
  parentOccupation?: string | null;
  extraAttributes?: Record<string, unknown>;
}

/**
 * Maps frontend EducationLevel to backend educationLevel enum
 */
export function toBackendEducationLevel(
  level?: EducationLevel
): 'class_10' | 'class_12' | 'undergraduate' | 'postgraduate' | 'diploma' | 'phd' | undefined {
  if (!level) return undefined;
  switch (level) {
    case 'CLASS_10':
      return 'class_10';
    case 'CLASS_12_PUC':
      return 'class_12';
    case 'UNDERGRADUATE':
      return 'undergraduate';
    case 'POSTGRADUATE':
      return 'postgraduate';
    case 'DIPLOMA':
      return 'diploma';
    case 'PHD_RESEARCH':
      return 'phd';
    default:
      return 'undergraduate';
  }
}

/**
 * Maps backend educationLevel to frontend EducationLevel
 */
export function toFrontendEducationLevel(level?: string | null): EducationLevel {
  if (!level) return 'UNDERGRADUATE';
  const norm = level.toLowerCase().trim();
  switch (norm) {
    case 'class_10':
    case 'school_class_9_10':
      return 'CLASS_10';
    case 'class_12':
    case 'school_class_11_12':
      return 'CLASS_12_PUC';
    case 'diploma':
      return 'DIPLOMA';
    case 'postgraduate':
      return 'POSTGRADUATE';
    case 'phd':
    case 'doctoral':
    case 'post_doctoral':
      return 'PHD_RESEARCH';
    case 'undergraduate':
    default:
      return 'UNDERGRADUATE';
  }
}

/**
 * Maps frontend gender to backend gender enum
 */
export function toBackendGender(
  gender?: StudentProfile['gender']
): 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined {
  if (!gender) return undefined;
  switch (gender) {
    case 'MALE':
      return 'male';
    case 'FEMALE':
      return 'female';
    case 'OTHER':
      return 'other';
    case 'PREFER_NOT_TO_SAY':
      return 'prefer_not_to_say';
    default:
      return undefined;
  }
}

/**
 * Maps backend gender to frontend gender
 */
export function toFrontendGender(gender?: string | null): StudentProfile['gender'] {
  if (!gender) return 'PREFER_NOT_TO_SAY';
  const norm = gender.toUpperCase().trim();
  switch (norm) {
    case 'MALE':
      return 'MALE';
    case 'FEMALE':
      return 'FEMALE';
    case 'OTHER':
      return 'OTHER';
    default:
      return 'PREFER_NOT_TO_SAY';
  }
}

/**
 * Maps frontend SocialCategory to backend category
 */
export function toBackendCategory(category?: SocialCategory): 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS' | undefined {
  if (!category) return undefined;
  switch (category) {
    case 'GENERAL':
    case 'OBC':
    case 'SC':
    case 'ST':
    case 'EWS':
      return category;
    case 'MINORITY':
      // Minority in backend is tracked via religion or category GENERAL with minority flag
      return 'GENERAL';
    default:
      return undefined;
  }
}

/**
 * Maps backend category to frontend SocialCategory
 */
export function toFrontendCategory(category?: string | null, isMinority?: boolean): SocialCategory {
  if (isMinority) return 'MINORITY';
  if (!category) return 'GENERAL';
  const norm = category.toUpperCase().trim();
  if (norm === 'OBC' || norm === 'SC' || norm === 'ST' || norm === 'EWS') {
    return norm;
  }
  return 'GENERAL';
}

/**
 * Converts frontend StudentProfile to backend UpdateProfileInput
 */
export function toBackendProfile(profile: Partial<StudentProfile>): BackendUpdateProfileInput {
  const dob = profile.dob || profile.dateOfBirth;
  const isMinority = profile.socialCategory === 'MINORITY' || !!profile.isMinority;

  // Preserve all frontend properties safely in extraAttributes
  const extraAttributes: Record<string, unknown> = {
    currentDistrict: profile.currentDistrict,
    currentState: profile.currentState,
    urbanRural: profile.urbanRural,
    courseName: profile.courseName,
    degreeName: profile.degreeName,
    branch: profile.branch,
    collegeId: profile.collegeId,
    collegeName: profile.collegeName,
    university: profile.university,
    collegeState: profile.collegeState,
    percentageOrCgpa: profile.percentageOrCgpa,
    isCgpa: profile.isCgpa,
    previousYearPassed: profile.previousYearPassed,
    hasIncomeCertificate: profile.hasIncomeCertificate,
    isMinority,
    minorityCommunity: profile.minorityCommunity,
    isSingleParentChild: profile.isSingleParentChild,
    isOrphan: profile.isOrphan,
    isFirstGenerationLearner: profile.isFirstGenerationLearner,
    isDefenceBackground: profile.isDefenceBackground,
    isHosteller: profile.isHosteller,
    documents: profile.documents || [],
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    casteCertificateAvailable: profile.casteCertificateAvailable,
    disabilityCertificateAvailable: profile.disabilityCertificateAvailable,
    subCategory: profile.subCategory,
  };

  return {
    fullName: profile.fullName || undefined,
    dateOfBirth: dob ? dob.slice(0, 10) : undefined,
    gender: toBackendGender(profile.gender),
    category: toBackendCategory(profile.socialCategory),
    religion: profile.minorityCommunity
      ? profile.minorityCommunity === 'PARSI'
        ? 'OTHER'
        : (profile.minorityCommunity as BackendUpdateProfileInput['religion'])
      : undefined,
    domicileState: profile.domicileState || undefined,
    isDifferentlyAbled: Boolean(profile.isPersonWithDisability),
    disabilityPercentage: profile.disabilityPercentage,
    annualFamilyIncome: typeof profile.annualFamilyIncome === 'number' ? profile.annualFamilyIncome : undefined,
    educationLevel: toBackendEducationLevel(profile.educationLevel),
    currentCourse: profile.courseName || profile.degreeName || undefined,
    courseYear: profile.yearOfStudy,
    academicPercentage:
      typeof profile.percentageOrCgpa === 'number'
        ? profile.isCgpa
          ? Math.min(100, Math.round(profile.percentageOrCgpa * 9.5))
          : profile.percentageOrCgpa
        : undefined,
    instituteName: profile.collegeName || undefined,
    instituteState: profile.collegeState || profile.domicileState || undefined,
    isSingleGirlChild: Boolean(profile.isGirlChildOnly),
    extraAttributes,
  };
}

/**
 * Converts backend ProfileRecord to frontend StudentProfile with seamless fallback for missing fields
 */
export function toFrontendProfile(
  backend: BackendProfileRecord,
  fallback?: StudentProfile
): StudentProfile {
  const extra = (backend.extraAttributes ?? {}) as Record<string, unknown>;

  const dob =
    backend.dateOfBirth ||
    (typeof extra.dob === 'string' ? extra.dob : undefined) ||
    fallback?.dob ||
    '2004-05-15';

  const isMinority =
    backend.religion === 'MUSLIM' ||
    backend.religion === 'CHRISTIAN' ||
    backend.religion === 'SIKH' ||
    backend.religion === 'BUDDHIST' ||
    backend.religion === 'JAIN' ||
    Boolean(extra.isMinority);

  const socialCategory = toFrontendCategory(
    backend.category || (typeof extra.socialCategory === 'string' ? extra.socialCategory : undefined),
    isMinority && !backend.category
  );

  return {
    id: backend.id || backend.userId || fallback?.id || 'demo-profile-001',
    userId: backend.userId,
    fullName: backend.fullName || fallback?.fullName || 'ScholarPath Student',
    dob,
    dateOfBirth: dob,
    gender: toFrontendGender(backend.gender || fallback?.gender),
    email: (typeof extra.email === 'string' ? extra.email : undefined) || fallback?.email,
    phoneNumber: (typeof extra.phoneNumber === 'string' ? extra.phoneNumber : undefined) || fallback?.phoneNumber,

    domicileState: backend.domicileState || fallback?.domicileState || 'Karnataka',
    currentState: (typeof extra.currentState === 'string' ? extra.currentState : undefined) || fallback?.currentState,
    currentDistrict: (typeof extra.currentDistrict === 'string' ? extra.currentDistrict : undefined) || fallback?.currentDistrict || 'Bangalore Urban',
    urbanRural: (extra.urbanRural === 'RURAL' || extra.urbanRural === 'URBAN')
      ? extra.urbanRural
      : fallback?.urbanRural || 'URBAN',

    socialCategory,
    subCategory: (typeof extra.subCategory === 'string' ? extra.subCategory : undefined) || fallback?.subCategory,
    casteCertificateAvailable: Boolean(extra.casteCertificateAvailable ?? fallback?.casteCertificateAvailable),
    isMinority,
    minorityCommunity: (typeof extra.minorityCommunity === 'string' ? extra.minorityCommunity as StudentProfile['minorityCommunity'] : undefined) || fallback?.minorityCommunity,
    isPersonWithDisability: Boolean(backend.isDifferentlyAbled ?? fallback?.isPersonWithDisability),
    disabilityPercentage: backend.disabilityPercentage ?? fallback?.disabilityPercentage,
    disabilityCertificateAvailable: Boolean(extra.disabilityCertificateAvailable ?? fallback?.disabilityCertificateAvailable),
    specialCategory: fallback?.specialCategory,

    educationLevel: toFrontendEducationLevel(backend.educationLevel || fallback?.educationLevel),
    courseName: (typeof extra.courseName === 'string' ? extra.courseName : undefined) || backend.currentCourse || fallback?.courseName || 'Computer Science and Engineering',
    degreeName: (typeof extra.degreeName === 'string' ? extra.degreeName : undefined) || fallback?.degreeName || 'B.Tech / B.E.',
    branch: (typeof extra.branch === 'string' ? extra.branch : undefined) || fallback?.branch,
    collegeId: (typeof extra.collegeId === 'string' ? extra.collegeId : undefined) || fallback?.collegeId,
    collegeName: backend.instituteName || (typeof extra.collegeName === 'string' ? extra.collegeName : undefined) || fallback?.collegeName || 'National Institute of Technology',
    university: (typeof extra.university === 'string' ? extra.university : undefined) || fallback?.university,
    collegeState: backend.instituteState || fallback?.collegeState || backend.domicileState || 'Karnataka',
    yearOfStudy: backend.courseYear || fallback?.yearOfStudy || 2,
    admissionYear: fallback?.admissionYear || 2024,
    academicYear: fallback?.academicYear || '2026-27',
    percentageOrCgpa:
      typeof extra.percentageOrCgpa === 'number'
        ? extra.percentageOrCgpa
        : typeof backend.academicPercentage === 'number'
          ? backend.academicPercentage
          : fallback?.percentageOrCgpa || 85.0,
    previousAcademicPercentage: fallback?.previousAcademicPercentage,
    isCgpa: Boolean(extra.isCgpa ?? fallback?.isCgpa),
    previousYearPassed: Boolean(extra.previousYearPassed ?? fallback?.previousYearPassed ?? true),
    institutionType: fallback?.institutionType || 'GOVERNMENT',

    annualFamilyIncome:
      typeof backend.annualFamilyIncome === 'number'
        ? backend.annualFamilyIncome
        : fallback?.annualFamilyIncome || 200000,
    hasIncomeCertificate: Boolean(extra.hasIncomeCertificate ?? fallback?.hasIncomeCertificate ?? true),
    incomeCertificateValidity: fallback?.incomeCertificateValidity,
    incomeSource: fallback?.incomeSource,
    familySize: fallback?.familySize,

    isSingleParentChild: Boolean(extra.isSingleParentChild ?? fallback?.isSingleParentChild),
    isOrphan: Boolean(extra.isOrphan ?? fallback?.isOrphan),
    isFirstGenerationLearner: Boolean(extra.isFirstGenerationLearner ?? fallback?.isFirstGenerationLearner),
    isDefenceBackground: Boolean(extra.isDefenceBackground ?? fallback?.isDefenceBackground),
    isGirlChildOnly: Boolean(backend.isSingleGirlChild ?? fallback?.isGirlChildOnly),
    isHosteller: Boolean(extra.isHosteller ?? fallback?.isHosteller),

    documents: Array.isArray(extra.documents)
      ? (extra.documents as StudentProfile['documents'])
      : fallback?.documents || [],
  };
}
