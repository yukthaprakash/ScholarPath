import { z } from 'zod';

export const educationLevelSchema = z.enum([
  'SCHOOL_CLASS_1_8',
  'SCHOOL_CLASS_9_10',
  'SCHOOL_CLASS_11_12',
  'DIPLOMA',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'DOCTORAL',
  'POST_DOCTORAL',
]);

export const genderSchema = z.enum(['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER', 'ANY']);

export const casteCategorySchema = z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'MINORITIES', 'ANY']);

export const certificateTypeSchema = z.enum([
  'INCOME_CERTIFICATE',
  'CASTE_CERTIFICATE',
  'DOMICILE_CERTIFICATE',
  'DISABILITY_CERTIFICATE',
  'MARKSHEET',
  'BONAFIDE_CERTIFICATE',
  'AADHAAR_CARD',
  'RATION_CARD',
]);

export const certificateStatusSchema = z.enum(['VALID', 'EXPIRED', 'UNSURE', 'NOT_ISSUED']);

export const studentCertificateSchema = z.object({
  type: certificateTypeSchema,
  isAvailable: z.boolean(),
  validUntil: z.string().optional(),
  issuedDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
  certificateNumber: z.string().optional(),
  status: certificateStatusSchema,
});

export const profileSchema = z.object({
  id: z.string(),
  academic: z.object({
    educationLevel: educationLevelSchema,
    courseName: z.string(),
    currentYear: z.number().int().min(1),
    scorePercentage: z.number().min(0).max(100),
    cgpa: z.number().min(0).max(10).optional(),
    gradingScale: z.number().optional(),
    boardOrUniversity: z.string().optional(),
    instituteType: z.enum(['GOVERNMENT', 'AIDED', 'PRIVATE', 'DEEMED']),
    institutePincode: z.string().optional(),
    instituteState: z.string(),
    isInstituteGovtRegistered: z.boolean(),
  }),
  personal: z.object({
    age: z.number().int().min(1).max(120),
    gender: genderSchema,
    casteCategory: casteCategorySchema,
    religion: z.string().optional(),
    isDisability: z.boolean(),
    disabilityPercentage: z.number().min(0).max(100).optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED']).optional(),
    isSingleGirlChild: z.boolean().optional(),
    isOrphan: z.boolean().optional(),
  }),
  demographics: z.object({
    domicileState: z.string(),
    district: z.string().optional(),
    areaType: z.enum(['RURAL', 'URBAN']).optional(),
  }),
  financial: z.object({
    annualHouseholdIncome: z.number().min(0),
    isParentGovernmentEmployee: z.boolean().optional(),
  }),
  certificates: z.array(studentCertificateSchema),
  documentsReadiness: z.object({
    isAadhaarSeededWithBank: z.union([z.boolean(), z.literal('UNSURE')]),
    isNameMatchingAadhaar: z.union([z.boolean(), z.literal('UNSURE')]),
    isDobMatchingAadhaar: z.union([z.boolean(), z.literal('UNSURE')]),
    isIncomeCertificateValidCurrentYear: z.union([z.boolean(), z.literal('UNSURE')]),
  }),
});

export const ruleOperatorSchema = z.enum([
  'EQUALS',
  'NOT_EQUALS',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'IN_ARRAY',
  'NOT_IN_ARRAY',
  'CONTAINS',
  'DATE_BEFORE',
  'DATE_AFTER',
  'BETWEEN',
]);

export const ruleSchema = z.object({
  key: z.string(),
  label: z.string(),
  operator: ruleOperatorSchema,
  expectedValue: z.any(),
  isActionable: z.boolean(),
  isRequired: z.boolean(),
  version: z.string(),
  clauseRef: z.string().optional(),
  description: z.string().optional(),
});

export const sourceCitationSchema = z.object({
  portalName: z.string(),
  url: z.string().url(),
  tier: z.union([z.literal(1), z.literal(2)]),
  clauseRef: z.string(),
  verifiedDate: z.string(),
  readOn: z.string().optional(),
});

export const schemeSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  offeringAuthority: z.string(),
  authorityType: z.enum(['CENTRAL_GOVT', 'STATE_GOVT', 'AICTE', 'UGC', 'NGO', 'PRIVATE']),
  state: z.string().optional(),
  schemeType: z.enum(['SCHOLARSHIP', 'FELLOWSHIP', 'FEE_WAIVER', 'HOSTEL_STIPEND', 'WELFARE', 'LOAN_SUBSIDY']),
  benefitDetails: z.object({
    financialAmountPerYear: z.number().optional(),
    description: z.string(),
    components: z.array(z.object({ name: z.string(), amount: z.number() })).optional(),
  }),
  applicationWindow: z.object({
    startDate: z.string(),
    endDate: z.string(),
    academicYear: z.string(),
  }),
  officialUrl: z.string().url(),
  applicationUrl: z.string().url().optional(),
  lastVerified: z.string().optional(),
  sourceCitation: sourceCitationSchema,
  rules: z.array(ruleSchema),
  requiredCertificates: z.array(certificateTypeSchema),
  estimatedIssuanceDays: z.record(certificateTypeSchema, z.number()).optional(),
  isDemo: z.boolean(),
  version: z.string(),
});
