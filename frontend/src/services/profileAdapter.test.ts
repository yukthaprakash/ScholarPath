import { describe, it, expect } from 'vitest';
import {
  toBackendProfile,
  toFrontendProfile,
  toBackendEducationLevel,
  toFrontendEducationLevel,
  toBackendGender,
  toFrontendGender,
  BackendProfileRecord,
} from './profileAdapter';
import { StudentProfile } from '../types/profile';

describe('ProfileAdapter', () => {
  const sampleFrontendProfile: StudentProfile = {
    id: 'student-001',
    userId: 'usr-123',
    fullName: 'Ananya Sharma',
    dob: '2005-08-20',
    dateOfBirth: '2005-08-20',
    gender: 'FEMALE',
    email: 'ananya@example.com',
    phoneNumber: '+91 9876543210',
    domicileState: 'Karnataka',
    currentDistrict: 'Bangalore Urban',
    urbanRural: 'URBAN',
    socialCategory: 'OBC',
    isMinority: false,
    isPersonWithDisability: false,
    educationLevel: 'UNDERGRADUATE',
    courseName: 'Computer Science and Engineering',
    degreeName: 'B.E.',
    collegeName: 'RV College of Engineering',
    collegeState: 'Karnataka',
    yearOfStudy: 2,
    academicYear: '2026-27',
    percentageOrCgpa: 86.5,
    isCgpa: false,
    previousYearPassed: true,
    annualFamilyIncome: 220000,
    hasIncomeCertificate: true,
    isSingleParentChild: false,
    isOrphan: false,
    isFirstGenerationLearner: true,
    isDefenceBackground: false,
    isGirlChildOnly: true,
    isHosteller: false,
    documents: [
      {
        id: 'doc-001',
        documentType: 'INCOME_CERTIFICATE',
        documentName: 'Income Certificate',
        issuer: 'Revenue Dept Karnataka',
        issueDate: '2026-05-10',
        validityYear: '2026-2031',
        academicYear: '2026-27',
        referenceNumber: 'RD0012345678',
        verificationStatus: 'VERIFIED',
      },
    ],
  };

  it('converts frontend StudentProfile to backend UpdateProfileInput without data loss', () => {
    const backendPayload = toBackendProfile(sampleFrontendProfile);

    expect(backendPayload.fullName).toBe('Ananya Sharma');
    expect(backendPayload.dateOfBirth).toBe('2005-08-20');
    expect(backendPayload.gender).toBe('female');
    expect(backendPayload.category).toBe('OBC');
    expect(backendPayload.domicileState).toBe('Karnataka');
    expect(backendPayload.annualFamilyIncome).toBe(220000);
    expect(backendPayload.educationLevel).toBe('undergraduate');
    expect(backendPayload.academicPercentage).toBe(86.5);
    expect(backendPayload.courseYear).toBe(2);
    expect(backendPayload.isSingleGirlChild).toBe(true);

    // Extra attributes must preserve rich frontend metadata
    expect(backendPayload.extraAttributes).toBeDefined();
    expect(backendPayload.extraAttributes?.currentDistrict).toBe('Bangalore Urban');
    expect(backendPayload.extraAttributes?.isFirstGenerationLearner).toBe(true);
    expect(backendPayload.extraAttributes?.documents).toHaveLength(1);
  });

  it('converts backend ProfileRecord back to frontend StudentProfile correctly', () => {
    const backendRecord: BackendProfileRecord = {
      id: 'prof-999',
      userId: 'usr-123',
      fullName: 'Ananya Sharma',
      dateOfBirth: '2005-08-20',
      gender: 'female',
      category: 'OBC',
      domicileState: 'Karnataka',
      annualFamilyIncome: 220000,
      educationLevel: 'undergraduate',
      currentCourse: 'Computer Science and Engineering',
      courseYear: 2,
      academicPercentage: 86.5,
      instituteName: 'RV College of Engineering',
      instituteState: 'Karnataka',
      isSingleGirlChild: true,
      extraAttributes: {
        currentDistrict: 'Bangalore Urban',
        degreeName: 'B.E.',
        urbanRural: 'URBAN',
        isFirstGenerationLearner: true,
        documents: sampleFrontendProfile.documents,
      },
    };

    const frontendModel = toFrontendProfile(backendRecord);

    expect(frontendModel.fullName).toBe('Ananya Sharma');
    expect(frontendModel.dob).toBe('2005-08-20');
    expect(frontendModel.gender).toBe('FEMALE');
    expect(frontendModel.socialCategory).toBe('OBC');
    expect(frontendModel.educationLevel).toBe('UNDERGRADUATE');
    expect(frontendModel.degreeName).toBe('B.E.');
    expect(frontendModel.currentDistrict).toBe('Bangalore Urban');
    expect(frontendModel.isGirlChildOnly).toBe(true);
    expect(frontendModel.documents).toHaveLength(1);
  });

  it('correctly maps education level enums in both directions', () => {
    expect(toBackendEducationLevel('CLASS_10')).toBe('class_10');
    expect(toBackendEducationLevel('CLASS_12_PUC')).toBe('class_12');
    expect(toBackendEducationLevel('DIPLOMA')).toBe('diploma');
    expect(toBackendEducationLevel('UNDERGRADUATE')).toBe('undergraduate');
    expect(toBackendEducationLevel('POSTGRADUATE')).toBe('postgraduate');
    expect(toBackendEducationLevel('PHD_RESEARCH')).toBe('phd');

    expect(toFrontendEducationLevel('class_10')).toBe('CLASS_10');
    expect(toFrontendEducationLevel('class_12')).toBe('CLASS_12_PUC');
    expect(toFrontendEducationLevel('diploma')).toBe('DIPLOMA');
    expect(toFrontendEducationLevel('undergraduate')).toBe('UNDERGRADUATE');
    expect(toFrontendEducationLevel('postgraduate')).toBe('POSTGRADUATE');
    expect(toFrontendEducationLevel('phd')).toBe('PHD_RESEARCH');
  });

  it('correctly maps gender enums in both directions', () => {
    expect(toBackendGender('MALE')).toBe('male');
    expect(toBackendGender('FEMALE')).toBe('female');
    expect(toBackendGender('OTHER')).toBe('other');
    expect(toBackendGender('PREFER_NOT_TO_SAY')).toBe('prefer_not_to_say');

    expect(toFrontendGender('male')).toBe('MALE');
    expect(toFrontendGender('female')).toBe('FEMALE');
    expect(toFrontendGender('other')).toBe('OTHER');
    expect(toFrontendGender('unknown')).toBe('PREFER_NOT_TO_SAY');
  });

  it('maps minorityCommunity PARSI to backend religion OTHER', () => {
    const parsiProfile: Partial<StudentProfile> = {
      fullName: 'Rustom Framjee',
      socialCategory: 'MINORITY',
      minorityCommunity: 'PARSI',
    };

    const backendPayload = toBackendProfile(parsiProfile);
    expect(backendPayload.religion).toBe('OTHER');
    expect(backendPayload.extraAttributes?.minorityCommunity).toBe('PARSI');

    const muslimProfile: Partial<StudentProfile> = {
      fullName: 'Farhan Ali',
      socialCategory: 'MINORITY',
      minorityCommunity: 'MUSLIM',
    };
    const muslimPayload = toBackendProfile(muslimProfile);
    expect(muslimPayload.religion).toBe('MUSLIM');
  });
});
