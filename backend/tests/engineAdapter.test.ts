import { describe, it, expect } from 'vitest';
import {
  engineAdapter,
  mapToEngineProfile,
  calculateAge,
  mapDocumentsToCertificates,
  loadVerifiedSchemes,
  loadVerifiedScheme
} from '../src/services/engineAdapter';
import { ProfileRecord } from '../src/services/profileService';
import { DocumentRecord } from '../src/services/documentService';

describe('Engine Adapter & Domain Mapper', () => {
  it('correctly calculates age from date of birth against reference date', () => {
    // Born 2006-05-15, reference 2026-10-05 -> 20 years old
    expect(calculateAge('2006-05-15', '2026-10-05')).toBe(20);
    // Born 2006-11-20, reference 2026-10-05 -> 19 years old (birthday not reached yet)
    expect(calculateAge('2006-11-20', '2026-10-05')).toBe(19);
    // Missing date of birth
    expect(calculateAge(null, '2026-10-05')).toBe(0);
    expect(calculateAge(undefined, '2026-10-05')).toBe(0);
  });

  it('maps DocumentRecord list to StudentCertificate array without fabricating missing certificates', () => {
    const docs: DocumentRecord[] = [
      {
        id: 'doc-1',
        userId: 'student-1',
        type: 'INCOME_CERTIFICATE',
        issuer: 'Tahsildar Bangalore North',
        issuedOn: '2026-05-01',
        validUntil: '2027-05-01',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      },
      {
        id: 'doc-2',
        userId: 'student-1',
        type: 'MARKSHEET',
        issuer: 'Karnataka State Board',
        issuedOn: '2025-06-01',
        validUntil: null,
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z'
      },
      {
        id: 'doc-3',
        userId: 'student-1',
        type: 'CASTE_CERTIFICATE',
        issuer: 'Revenue Department',
        issuedOn: '2020-01-01',
        validUntil: '2025-01-01', // Expired relative to 2026-10-05
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z'
      },
      {
        id: 'doc-4',
        userId: 'student-1',
        type: 'UNRECOGNIZED_DOC_TYPE',
        issuer: 'Unknown',
        issuedOn: '2026-01-01',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    const certs = mapDocumentsToCertificates(docs, '2026-10-05');

    // Only recognized types mapped (3 out of 4)
    expect(certs.length).toBe(3);

    const incomeCert = certs.find((c) => c.type === 'INCOME_CERTIFICATE');
    expect(incomeCert).toBeDefined();
    expect(incomeCert?.status).toBe('VALID');
    expect(incomeCert?.isAvailable).toBe(true);

    const casteCert = certs.find((c) => c.type === 'CASTE_CERTIFICATE');
    expect(casteCert).toBeDefined();
    expect(casteCert?.status).toBe('EXPIRED');

    // Bonafide certificate was NOT in documents, must NOT exist
    const bonafideCert = certs.find((c) => c.type === 'BONAFIDE_CERTIFICATE');
    expect(bonafideCert).toBeUndefined();
  });

  it('maps ProfileRecord accurately to engine StudentProfile without fabricating student data', () => {
    const profileRecord: ProfileRecord = {
      userId: 'user-sc-student',
      fullName: 'Ramesh Kumar',
      dateOfBirth: '2005-04-10',
      gender: 'MALE',
      category: 'SC',
      religion: 'HINDU',
      domicileState: 'KARNATAKA',
      isDifferentlyAbled: false,
      annualFamilyIncome: 120000,
      educationLevel: 'UNDERGRADUATE',
      currentCourse: 'BSc Computer Science',
      courseYear: 2,
      academicPercentage: 78,
      instituteName: 'Bangalore City College',
      instituteState: 'KARNATAKA',
      isSingleGirlChild: false
    };

    const docs: DocumentRecord[] = [
      {
        id: 'doc-sc',
        userId: 'user-sc-student',
        type: 'CASTE_CERTIFICATE',
        issuer: 'Nadakacheri',
        issuedOn: '2026-01-15',
        validUntil: '2030-01-15',
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z'
      }
    ];

    const studentProfile = mapToEngineProfile(profileRecord, docs, '2026-10-05');

    expect(studentProfile.id).toBe('user-sc-student');
    expect(studentProfile.academic.educationLevel).toBe('UNDERGRADUATE');
    expect(studentProfile.academic.courseName).toBe('BSc Computer Science');
    expect(studentProfile.academic.scorePercentage).toBe(78);
    expect(studentProfile.personal.casteCategory).toBe('SC');
    expect(studentProfile.personal.gender).toBe('MALE');
    expect(studentProfile.personal.age).toBe(21);
    expect(studentProfile.financial.annualHouseholdIncome).toBe(120000);
    expect(studentProfile.certificates.length).toBe(1);
    expect(studentProfile.certificates[0]?.type).toBe('CASTE_CERTIFICATE');
  });

  it('loads verified schemes from data/schemes', () => {
    const schemes = loadVerifiedSchemes();
    expect(schemes.length).toBeGreaterThanOrEqual(6);

    const scScheme = loadVerifiedScheme('nsp-post-matric-sc');
    expect(scScheme).toBeDefined();
    expect(scScheme?.title).toContain('Scheduled Caste');

    const missingScheme = loadVerifiedScheme('non-existent-scheme-slug');
    expect(missingScheme).toBeUndefined();
  });

  it('performs live eligibility evaluation using @scholarpath/engine', async () => {
    const eligibleProfile: ProfileRecord = {
      userId: 'golden-pmssc-user',
      educationLevel: 'UNDERGRADUATE',
      currentCourse: 'BA History',
      courseYear: 2,
      academicPercentage: 72,
      instituteState: 'KARNATAKA',
      gender: 'MALE',
      category: 'SC',
      isDifferentlyAbled: false,
      domicileState: 'KARNATAKA',
      annualFamilyIncome: 150000
    };

    const docs: DocumentRecord[] = [
      {
        id: 'caste-doc',
        userId: 'golden-pmssc-user',
        type: 'CASTE_CERTIFICATE',
        issuer: 'Govt of Karnataka',
        issuedOn: '2026-01-01',
        validUntil: '2030-01-01',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'income-doc',
        userId: 'golden-pmssc-user',
        type: 'INCOME_CERTIFICATE',
        issuer: 'Tahsildar',
        issuedOn: '2026-05-01',
        validUntil: '2027-05-01',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      },
      {
        id: 'marks-doc',
        userId: 'golden-pmssc-user',
        type: 'MARKSHEET',
        issuer: 'Board',
        issuedOn: '2025-06-01',
        validUntil: null,
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z'
      }
    ];

    const result = await engineAdapter.evaluate({
      profile: eligibleProfile,
      documents: docs,
      schemeSlug: 'nsp-post-matric-sc',
      today: '2026-10-05'
    });

    expect(result.studentId).toBe('golden-pmssc-user');
    expect(result.matches.length).toBe(1);
    expect(result.matches[0]?.state).toBe('ELIGIBLE');
    expect(result.summary.eligibleCount).toBe(1);
    expect(result.summary.totalFinancialOpportunity).toBe(13500);
  });
});
