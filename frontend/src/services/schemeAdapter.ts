import { Scheme, SchemeType, ScopeType } from '../types/scheme';
import { EducationLevel, SocialCategory } from '../types/profile';
import { DocumentType } from '../types/passport';

export interface BackendSchemeRecord {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  type: string;
  scope: 'state' | 'central';
  state?: string | null;
  authority: string;
  category?: string | null;
  financialBenefit?: string | null;
  deadline?: string | null;
  isActive: boolean;
  officialUrl?: string | null;
  applicationUrl?: string | null;
  details?: Record<string, unknown>;
  rules?: unknown[];
  requiredDocuments?: unknown[];
  sources?: unknown[];
  trustData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function toFrontendSchemeType(type: string): SchemeType {
  const norm = type.toLowerCase().trim();
  switch (norm) {
    case 'scholarship':
      return 'SCHOLARSHIP';
    case 'fellowship':
      return 'FELLOWSHIP';
    case 'fee_waiver':
      return 'FEE_WAIVER';
    case 'hostel_stipend':
      return 'HOSTEL_STIPEND';
    case 'loan_subsidy':
      return 'LOAN_SUBSIDY';
    default:
      return 'SCHOLARSHIP';
  }
}

export function toFrontendScope(scope: string): ScopeType {
  const norm = scope.toLowerCase().trim();
  if (norm === 'state') return 'STATE';
  if (norm === 'institutional') return 'INSTITUTIONAL';
  return 'CENTRAL';
}

/**
 * Parses numeric amount from financial benefit text (e.g. "Up to ₹15,000 per annum" -> 15000)
 */
export function extractBenefitAmount(benefitStr?: string | null): number {
  if (!benefitStr) return 15000;
  const match = benefitStr.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 15000;
}

/**
 * Extracts allowed social categories from scheme rules or category field
 */
export function extractAllowedCategories(record: BackendSchemeRecord): SocialCategory[] {
  const categories: Set<SocialCategory> = new Set();

  if (record.category) {
    const cat = record.category.toUpperCase().trim();
    if (cat === 'OBC') categories.add('OBC');
    else if (cat === 'SC') categories.add('SC');
    else if (cat === 'ST') categories.add('ST');
    else if (cat === 'EWS') categories.add('EWS');
    else if (cat === 'GENERAL') categories.add('GENERAL');
  }

  // Parse rules if present
  if (Array.isArray(record.rules)) {
    for (const rule of record.rules as Array<{ field?: string; value?: unknown }>) {
      if (rule.field === 'category' || rule.field === 'socialCategory') {
        const val = String(rule.value || '').toUpperCase();
        if (['SC', 'ST', 'OBC', 'GENERAL', 'EWS'].includes(val)) {
          categories.add(val as SocialCategory);
        }
      }
    }
  }

  if (categories.size === 0) {
    return ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'];
  }

  return Array.from(categories);
}

/**
 * Extracts required documents from backend scheme record
 */
export function extractRequiredDocuments(record: BackendSchemeRecord): DocumentType[] {
  const docs: DocumentType[] = [];

  if (Array.isArray(record.requiredDocuments)) {
    for (const d of record.requiredDocuments as Array<{ type?: string; code?: string }>) {
      const type = (d.type || d.code || '').toUpperCase();
      if (type.includes('INCOME')) docs.push('INCOME_CERTIFICATE');
      else if (type.includes('CASTE')) docs.push('CASTE_CERTIFICATE');
      else if (type.includes('DOMICILE')) docs.push('DOMICILE_CERTIFICATE');
      else if (type.includes('12TH') || type.includes('MARKSHEET')) docs.push('MARKS_CARD_12TH');
      else if (type.includes('BONAFIDE')) docs.push('BONAFIDE_CERTIFICATE');
      else if (type.includes('AADHAAR') || type.includes('BANK')) docs.push('BANK_PASSBOOK_SEEDED');
    }
  }

  if (docs.length === 0) {
    return ['INCOME_CERTIFICATE', 'MARKS_CARD_12TH', 'BONAFIDE_CERTIFICATE', 'BANK_PASSBOOK_SEEDED'];
  }

  return Array.from(new Set(docs));
}

/**
 * Converts a backend SchemeRecord to a frontend Scheme
 */
export function toFrontendScheme(record: BackendSchemeRecord): Scheme {
  const sources = Array.isArray(record.sources) ? (record.sources as Array<{ name?: string; url?: string }>) : [];
  const primarySource = sources[0];

  const allowedCategories = extractAllowedCategories(record);
  const requiredDocumentTypes = extractRequiredDocuments(record);
  const maxBenefitAmount = extractBenefitAmount(record.financialBenefit);

  const educationLevels: EducationLevel[] = ['UNDERGRADUATE', 'POSTGRADUATE'];

  return {
    id: record.id,
    slug: record.slug,
    name: record.title,
    description: record.shortDescription || record.fullDescription || `${record.title} offered by ${record.authority}.`,
    provider: record.authority,
    authority: record.authority,
    scope: toFrontendScope(record.scope),
    targetState: record.state || undefined,
    academicYear: '2026-27',
    type: toFrontendSchemeType(record.type),
    educationLevels,
    allowedCategories,
    requiredDomicile: record.state || undefined,
    maxAnnualIncome: 250000,
    minPercentage: 60,
    genderRestriction: 'ALL',
    benefitAmountText: record.financialBenefit || `Up to ₹${maxBenefitAmount.toLocaleString('en-IN')}`,
    maxBenefitAmount,
    deadlineDate: record.deadline ? record.deadline.slice(0, 10) : '2026-10-31',
    startDocumentsByDate: '2026-10-10',
    officialSource: primarySource?.name || `${record.authority} Guidelines`,
    sourceTier: 'TIER_1_OFFICIAL',
    verifiedYear: '2026-27',
    officialUrl: record.officialUrl || record.applicationUrl || primarySource?.url || 'https://scholarships.gov.in',
    ruleVersion: '2026.1',
    requiredDocumentTypes,
  };
}
