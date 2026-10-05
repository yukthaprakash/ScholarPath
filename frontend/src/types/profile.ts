import { PassportDocument } from './passport';

export type EducationLevel =
  | 'CLASS_10'
  | 'CLASS_12_PUC'
  | 'DIPLOMA'
  | 'UNDERGRADUATE'
  | 'POSTGRADUATE'
  | 'PHD_RESEARCH';

export type SocialCategory =
  | 'SC'
  | 'ST'
  | 'OBC'
  | 'GENERAL'
  | 'EWS'
  | 'MINORITY';

export interface StudentProfile {
  id: string;
  userId?: string;

  // Personal Information
  fullName: string;
  dob: string; // Date of birth (YYYY-MM-DD)
  dateOfBirth?: string; // Optional alias for dob
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  email?: string;
  phoneNumber?: string;
  
  // Residency / Domicile
  domicileState: string;
  currentState?: string;
  currentDistrict: string;
  urbanRural: 'URBAN' | 'RURAL';

  // Category & Social Status
  socialCategory: SocialCategory;
  subCategory?: string;
  casteCertificateAvailable?: boolean;
  isMinority: boolean;
  minorityCommunity?: 'MUSLIM' | 'CHRISTIAN' | 'SIKH' | 'BUDDHIST' | 'JAIN' | 'PARSI';
  isPersonWithDisability: boolean;
  disabilityPercentage?: number;
  disabilityCertificateAvailable?: boolean;
  specialCategory?: string;

  // Academic Details
  educationLevel: EducationLevel;
  courseName: string;
  degreeName: string;
  branch?: string; // Specialization
  collegeId?: string;
  collegeName: string;
  university?: string;
  collegeState: string;
  yearOfStudy: number; // e.g. 1, 2, 3, 4
  admissionYear?: number;
  academicYear: string; // e.g. "2026-27"
  percentageOrCgpa: number; // e.g. 88.0 for % or 8.8 for CGPA
  previousAcademicPercentage?: number;
  isCgpa: boolean;
  previousYearPassed: boolean;
  institutionType?: 'GOVERNMENT' | 'AIDED' | 'PRIVATE' | 'DEEMED';

  // Financial Details
  annualFamilyIncome: number; // in INR e.g. 200000
  hasIncomeCertificate: boolean;
  incomeCertificateValidity?: string;
  incomeSource?: string;
  familySize?: number;

  // Special Conditions (supported by published scheme rules)
  isSingleParentChild: boolean;
  isOrphan: boolean;
  isFirstGenerationLearner: boolean;
  isDefenceBackground: boolean;
  isGirlChildOnly: boolean;
  isHosteller: boolean;

  // Document Passport Metadata
  documents: PassportDocument[];
}

