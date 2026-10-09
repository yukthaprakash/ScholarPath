/**
 * ScholarPath Pure TypeScript Rule Engine & Domain Types
 * Person 3 Ownership - Public API Surface
 */

export type EducationLevel = 
  | 'SCHOOL_CLASS_1_8'
  | 'SCHOOL_CLASS_9_10'
  | 'SCHOOL_CLASS_11_12'
  | 'DIPLOMA'
  | 'UNDERGRADUATE'
  | 'POSTGRADUATE'
  | 'DOCTORAL'
  | 'POST_DOCTORAL';

export type Gender = 'MALE' | 'FEMALE' | 'TRANSGENDER' | 'OTHER' | 'ANY';

export type CasteCategory = 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'MINORITIES' | 'ANY';

export type CertificateType =
  | 'INCOME_CERTIFICATE'
  | 'CASTE_CERTIFICATE'
  | 'DOMICILE_CERTIFICATE'
  | 'DISABILITY_CERTIFICATE'
  | 'MARKSHEET'
  | 'BONAFIDE_CERTIFICATE'
  | 'AADHAAR_CARD'
  | 'RATION_CARD';

export type CertificateStatus = 'VALID' | 'EXPIRED' | 'UNSURE' | 'NOT_ISSUED';

export interface StudentCertificate {
  type: CertificateType;
  isAvailable: boolean;
  validUntil?: string; // ISO Date YYYY-MM-DD
  issuedDate?: string; // ISO Date YYYY-MM-DD
  issuingAuthority?: string;
  certificateNumber?: string;
  status: CertificateStatus;
}

export interface StudentProfile {
  id: string;
  academic: {
    educationLevel: EducationLevel;
    courseName: string;
    currentYear: number;
    scorePercentage: number;
    cgpa?: number;
    gradingScale?: number;
    boardOrUniversity?: string;
    instituteType: 'GOVERNMENT' | 'AIDED' | 'PRIVATE' | 'DEEMED';
    institutePincode?: string;
    instituteState: string;
    isInstituteGovtRegistered: boolean;
  };
  personal: {
    age: number;
    gender: Gender;
    casteCategory: CasteCategory;
    religion?: string;
    isDisability: boolean;
    disabilityPercentage?: number;
    maritalStatus?: 'SINGLE' | 'MARRIED';
    isSingleGirlChild?: boolean;
    isOrphan?: boolean;
  };
  demographics: {
    domicileState: string;
    district?: string;
    areaType?: 'RURAL' | 'URBAN';
  };
  financial: {
    annualHouseholdIncome: number;
    isParentGovernmentEmployee?: boolean;
  };
  certificates: StudentCertificate[];
  documentsReadiness: {
    isAadhaarSeededWithBank: boolean | 'UNSURE';
    isNameMatchingAadhaar: boolean | 'UNSURE';
    isDobMatchingAadhaar: boolean | 'UNSURE';
    isIncomeCertificateValidCurrentYear: boolean | 'UNSURE';
  };
}

export type AuthorityType = 'CENTRAL_GOVT' | 'STATE_GOVT' | 'AICTE' | 'UGC' | 'NGO' | 'PRIVATE';

export type SchemeType = 
  | 'SCHOLARSHIP' 
  | 'FELLOWSHIP' 
  | 'FEE_WAIVER' 
  | 'HOSTEL_STIPEND' 
  | 'WELFARE' 
  | 'LOAN_SUBSIDY';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'IN_ARRAY'
  | 'NOT_IN_ARRAY'
  | 'CONTAINS'
  | 'DATE_BEFORE'
  | 'DATE_AFTER'
  | 'BETWEEN';

export interface Rule {
  key: string;
  label: string;
  operator: RuleOperator;
  expectedValue: any;
  isActionable: boolean;
  isRequired: boolean;
  version: string;
  clauseRef?: string;
  description?: string;
}

export interface SourceCitation {
  portalName: string;
  url: string;
  tier: 1 | 2;
  clauseRef: string;
  verifiedDate: string;
}

export interface Scheme {
  id: string; // slug identifier
  title: string;
  shortDescription: string;
  offeringAuthority: string;
  authorityType: AuthorityType;
  state?: string; // Undefined means National / All states
  schemeType: SchemeType;
  benefitDetails: {
    financialAmountPerYear?: number;
    description: string;
    components?: Array<{ name: string; amount: number }>;
  };
  applicationWindow: {
    startDate: string; // ISO Date YYYY-MM-DD
    endDate: string; // ISO Date YYYY-MM-DD
    academicYear: string; // e.g. "2026-27"
  };
  officialUrl: string;
  sourceCitation: SourceCitation;
  rules: Rule[];
  requiredCertificates: CertificateType[];
  estimatedIssuanceDays: Partial<Record<CertificateType, number>>;
  isDemo: boolean;
  version: string;
}

export type RuleOutcome = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface RuleTrace {
  ruleKey: string;
  ruleLabel: string;
  ruleVersion: string;
  studentValue: any;
  expectedValue: any;
  outcome: RuleOutcome;
  distance?: {
    numericDifference?: number;
    unit?: string;
    message?: string;
  };
  isActionable: boolean;
  isRequired: boolean;
  clauseRef?: string;
}

export type SchemeMatchState = 'ELIGIBLE' | 'NEARLY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_MATCHED';

export interface TrustScore {
  freshnessDays: number;
  sourceTier: 1 | 2;
  coveragePercentage: number;
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  bannerMessage: string;
}

export interface SchemeMatch {
  schemeId: string;
  schemeTitle: string;
  schemeType: SchemeType;
  state: SchemeMatchState;
  ruleTrace: RuleTrace[];
  failedRules: RuleTrace[];
  unknownRules: RuleTrace[];
  missingActionableRules: RuleTrace[];
  trustScore: TrustScore;
  financialBenefit: number;
  deadline: string;
  officialUrl: string;
}

export interface AnalyzeResult {
  timestamp: string;
  today: string;
  studentId: string;
  matches: SchemeMatch[];
  summary: {
    eligibleCount: number;
    nearlyEligibleCount: number;
    needsVerificationCount: number;
    notMatchedCount: number;
    totalFinancialOpportunity: number;
  };
}

export interface UnlockAction {
  actionKey: string;
  actionTitle: string;
  description: string;
  schemesUnlocked: string[];
  additionalFinancialUnlocked: number;
  effortDays: number;
}

export interface UnlockResult {
  studentId: string;
  actions: UnlockAction[];
}

export interface ForecastYear {
  year: number;
  academicYear: string;
  projectedAge: number;
  projectedCurrentYear: number;
  assumptions: string[];
  newlyEligibleSchemes: string[];
  lostSchemes: string[];
}

export interface ForecastResult {
  studentId: string;
  years: ForecastYear[];
}

export interface IncompatiblePair {
  schemeA: string;
  schemeB: string;
  reason: string;
}

export interface StackResult {
  selectedSchemeIds: string[];
  rejectedSchemeIds: string[];
  totalFinancialBenefit: number;
  stackingNotes: string[];
  incompatiblePairs: IncompatiblePair[];
}

export interface ConflictPair {
  schemeA: string;
  schemeB: string;
  conflictType: 'EXCLUSION' | 'SAME_CATEGORY' | 'GOVT_POLICY';
  sourceCitation: string;
  description: string;
}

export interface BackwardsPlanStep {
  stepNumber: number;
  title: string;
  description: string;
  startDate: string;
  targetDate: string;
  isCriticalPath: boolean;
  certificateType?: CertificateType;
}

export interface BackwardsPlan {
  schemeId: string;
  deadline: string;
  isFeasible: boolean;
  feasibilityReason?: string;
  steps: BackwardsPlanStep[];
}

export type ReadinessStatus = 'READY' | 'NEEDS_ACTION' | 'HIGH_RISK_REJECTION';

export interface PreflightIssue {
  field: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  issue: string;
  remedy: string;
}

export interface PreflightResult {
  schemeId: string;
  readinessStatus: ReadinessStatus;
  issues: PreflightIssue[];
}

export interface HouseholdProfile {
  householdId: string;
  primaryStudent: StudentProfile;
  dependents: StudentProfile[];
  combinedIncome: number;
}
