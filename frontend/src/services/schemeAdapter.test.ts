import { describe, it, expect } from 'vitest';
import {
  toFrontendScheme,
  extractBenefitAmount,
  extractAllowedCategories,
  extractRequiredDocuments,
  BackendSchemeRecord,
} from './schemeAdapter';

describe('SchemeAdapter', () => {
  const sampleBackendScheme: BackendSchemeRecord = {
    id: 'scheme-001',
    slug: 'post-matric-scholarship-obc',
    title: 'Post-Matric Scholarship for OBC Students',
    shortDescription: 'Financial assistance for OBC post-matric students',
    fullDescription: 'Comprehensive fee waiver and stipend for eligible backward class scholars.',
    type: 'scholarship',
    scope: 'state',
    state: 'Karnataka',
    authority: 'Department of Social Welfare',
    category: 'OBC',
    financialBenefit: 'Up to ₹15,000 per annum',
    deadline: '2026-10-31',
    isActive: true,
    officialUrl: 'https://scholarships.gov.in',
    applicationUrl: 'https://postmatric.karnataka.gov.in',
    requiredDocuments: [
      { type: 'income_certificate', name: 'Income Certificate' },
      { type: 'caste_certificate', name: 'Caste Certificate' },
      { type: 'marksheet_12th', name: 'Class 12 Marksheet' },
    ],
    sources: [
      { name: 'Karnataka Social Welfare Gazette', url: 'https://sw.kar.nic.in' },
    ],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('converts backend SchemeRecord into frontend Scheme model accurately', () => {
    const frontendScheme = toFrontendScheme(sampleBackendScheme);

    expect(frontendScheme.id).toBe('scheme-001');
    expect(frontendScheme.slug).toBe('post-matric-scholarship-obc');
    expect(frontendScheme.name).toBe('Post-Matric Scholarship for OBC Students');
    expect(frontendScheme.scope).toBe('STATE');
    expect(frontendScheme.targetState).toBe('Karnataka');
    expect(frontendScheme.type).toBe('SCHOLARSHIP');
    expect(frontendScheme.benefitAmountText).toBe('Up to ₹15,000 per annum');
    expect(frontendScheme.maxBenefitAmount).toBe(15000);
    expect(frontendScheme.deadlineDate).toBe('2026-10-31');
    expect(frontendScheme.allowedCategories).toContain('OBC');
    expect(frontendScheme.requiredDocumentTypes).toContain('INCOME_CERTIFICATE');
    expect(frontendScheme.requiredDocumentTypes).toContain('CASTE_CERTIFICATE');
    expect(frontendScheme.requiredDocumentTypes).toContain('MARKS_CARD_12TH');
    expect(frontendScheme.officialSource).toBe('Karnataka Social Welfare Gazette');
  });

  it('extracts numeric financial benefits correctly from various text formats', () => {
    expect(extractBenefitAmount('Up to ₹15,000 per annum')).toBe(15000);
    expect(extractBenefitAmount('₹12,000 / year')).toBe(12000);
    expect(extractBenefitAmount('Full Tuition Fee + ₹50,000 Stipend')).toBe(50000);
    expect(extractBenefitAmount(null)).toBe(15000);
  });

  it('extracts categories from both direct category property and rule lists', () => {
    const categories = extractAllowedCategories(sampleBackendScheme);
    expect(categories).toContain('OBC');

    const centralScheme: BackendSchemeRecord = {
      ...sampleBackendScheme,
      category: null,
      rules: [
        { field: 'category', value: 'SC' },
        { field: 'category', value: 'ST' },
      ],
    };

    const extracted = extractAllowedCategories(centralScheme);
    expect(extracted).toContain('SC');
    expect(extracted).toContain('ST');
  });

  it('maps document types accurately from backend documents list', () => {
    const docs = extractRequiredDocuments(sampleBackendScheme);
    expect(docs).toEqual(['INCOME_CERTIFICATE', 'CASTE_CERTIFICATE', 'MARKS_CARD_12TH']);
  });
});
