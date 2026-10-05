import { StudentProfile } from '../types/profile';
import { PassportDocument } from '../types/passport';
import { DEFAULT_DEMO_PROFILE } from '../fixtures/defaultDemoProfile';

const PROFILE_STORAGE_KEY = 'scholarpath_student_profile';

export interface ProfileCompletionStats {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
  sectionScores: {
    personal: boolean;
    social: boolean;
    academic: boolean;
    financial: boolean;
    residency: boolean;
    documents: boolean;
  };
}

export class ProfileService {
  /**
   * Load profile from localStorage or fallback to demo profile
   */
  public getProfile(): StudentProfile {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as StudentProfile;
      }
    } catch {
      // Fallback on error
    }
    return DEFAULT_DEMO_PROFILE;
  }

  /**
   * Save student profile to localStorage
   */
  public saveProfile(profile: StudentProfile): StudentProfile {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Handle storage quota if needed
    }
    return profile;
  }

  /**
   * Reset profile to demo default
   */
  public resetToDefault(): StudentProfile {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_PROFILE));
    return DEFAULT_DEMO_PROFILE;
  }

  /**
   * Calculate profile completion score and identify missing required fields per section
   */
  public calculateCompletion(profile: StudentProfile | null): ProfileCompletionStats {
    if (!profile) {
      return {
        percentage: 0,
        isComplete: false,
        missingFields: [
          'Personal Details',
          'Social Category',
          'Academic Information',
          'Financial Data',
          'Residency / Domicile',
          'Supporting Documents',
        ],
        sectionScores: {
          personal: false,
          social: false,
          academic: false,
          financial: false,
          residency: false,
          documents: false,
        },
      };
    }

    const missingFields: string[] = [];

    // 1. Personal Information Section
    const personalPass = !!(profile.fullName && (profile.dob || profile.dateOfBirth) && profile.gender);
    if (!personalPass) missingFields.push('Personal Details (Name, Date of Birth, Gender)');

    // 2. Social Category Section
    const socialPass = !!profile.socialCategory;
    if (!socialPass) missingFields.push('Social Category (General, OBC, SC, ST, EWS, Minority)');

    // 3. Academic Details Section
    const academicPass = !!(
      profile.educationLevel &&
      (profile.collegeName || profile.collegeId) &&
      (profile.degreeName || profile.courseName) &&
      typeof profile.percentageOrCgpa === 'number' &&
      profile.percentageOrCgpa > 0
    );
    if (!academicPass) missingFields.push('Academic Details (Level, Institution, Degree, Marks)');

    // 4. Financial Details Section
    const financialPass = typeof profile.annualFamilyIncome === 'number' && profile.annualFamilyIncome >= 0;
    if (!financialPass) missingFields.push('Annual Family Income');

    // 5. Residency / Domicile Section
    const residencyPass = !!(profile.domicileState && profile.currentDistrict);
    if (!residencyPass) missingFields.push('Residency / State Domicile & District');

    // 6. Supporting Document Readiness Section
    const documentsPass = Array.isArray(profile.documents) && profile.documents.length >= 2;
    if (!documentsPass) missingFields.push('Supporting Document Readiness Metadata');

    const sections = [personalPass, socialPass, academicPass, financialPass, residencyPass, documentsPass];
    const completedCount = sections.filter(Boolean).length;
    const percentage = Math.round((completedCount / sections.length) * 100);

    return {
      percentage,
      isComplete: percentage >= 80,
      missingFields,
      sectionScores: {
        personal: personalPass,
        social: socialPass,
        academic: academicPass,
        financial: financialPass,
        residency: residencyPass,
        documents: documentsPass,
      },
    };
  }

}

export class DocumentService {
  /**
   * Add or update a certificate metadata record in student profile
   */
  public addOrUpdateDocument(
    profile: StudentProfile,
    doc: PassportDocument
  ): StudentProfile {
    const existingIndex = profile.documents.findIndex(
      (d) => d.id === doc.id || (d.documentType === doc.documentType && d.referenceNumber === doc.referenceNumber)
    );

    let updatedDocs: PassportDocument[];
    if (existingIndex >= 0) {
      updatedDocs = [...profile.documents];
      updatedDocs[existingIndex] = doc;
    } else {
      updatedDocs = [...profile.documents, doc];
    }

    const updatedProfile = {
      ...profile,
      documents: updatedDocs,
    };

    new ProfileService().saveProfile(updatedProfile);
    return updatedProfile;
  }

  /**
   * Remove a document metadata record
   */
  public removeDocument(profile: StudentProfile, docId: string): StudentProfile {
    const updatedDocs = profile.documents.filter((d) => d.id !== docId);
    const updatedProfile = {
      ...profile,
      documents: updatedDocs,
    };
    new ProfileService().saveProfile(updatedProfile);
    return updatedProfile;
  }
}

export const profileService = new ProfileService();
export const documentService = new DocumentService();
