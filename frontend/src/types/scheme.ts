import { EducationLevel, SocialCategory } from './profile';
import { DocumentType } from './passport';

export type SchemeType =
  | 'SCHOLARSHIP'
  | 'FELLOWSHIP'
  | 'FEE_WAIVER'
  | 'HOSTEL_STIPEND'
  | 'LOAN_SUBSIDY';

export type ScopeType = 'CENTRAL' | 'STATE' | 'INSTITUTIONAL';

export interface Scheme {
  id: string;
  slug: string;
  name: string;
  description: string;
  provider: string; // e.g. "Department of Higher Education, Ministry of Education"
  authority: string; // e.g. "Government of India" / "Govt. of Karnataka"
  scope: ScopeType;
  targetState?: string; // e.g. "Karnataka" if state scheme, undefined if central
  academicYear: string; // e.g. "2026-27"
  type: SchemeType;

  // Criteria Limits & Rules
  educationLevels: EducationLevel[];
  allowedCategories: SocialCategory[];
  maxAnnualIncome?: number; // Maximum allowed income in INR
  requiredDomicile?: string; // State name if domicile restricted
  minPercentage?: number; // Minimum required percentage/marks
  genderRestriction?: 'FEMALE_ONLY' | 'ALL';
  disabilityOnly?: boolean;
  minorityOnly?: boolean;
  ruralOnly?: boolean;

  // Benefit Details
  benefitAmountText: string; // e.g. "₹12,000 / year"
  maxBenefitAmount: number; // e.g. 12000

  // Deadlines
  deadlineDate: string; // e.g. "2026-10-31"
  startDocumentsByDate: string; // Reverse-scheduled target date e.g. "2026-10-10"

  // Citation & Trust Metadata
  officialSource: string; // e.g. "NSP Official Guidelines"
  sourceTier: 'TIER_1_OFFICIAL' | 'TIER_2_SECONDARY';
  verifiedYear: string; // e.g. "2026-27"
  officialUrl: string;
  ruleVersion: string; // e.g. "2026.1"

  requiredDocumentTypes: DocumentType[];
}
