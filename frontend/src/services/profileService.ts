import { StudentProfile } from '../types/profile';
import { PassportDocument, AvailabilityStatus, VerificationStatus } from '../types/passport';
import { DEFAULT_DEMO_PROFILE } from '../fixtures/defaultDemoProfile';

const GENERIC_PROFILE_STORAGE_KEY = 'scholarpath_student_profile';

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
    special: boolean;
    documents: boolean;
  };
}

export class ProfileService {
  /**
   * Compute scoped storage key per user ID to prevent demo users / multiple accounts from colliding.
   */
  private getStorageKey(userId?: string): string {
    return userId ? `scholarpath_profile_${userId}` : GENERIC_PROFILE_STORAGE_KEY;
  }

  /**
   * Safely sanitize and validate loaded profile data against missing/malformed fields
   */
  public sanitizeProfile(raw: Partial<StudentProfile>): StudentProfile {
    return {
      id: raw.id || `profile_${Date.now()}`,
      userId: raw.userId,
      fullName: typeof raw.fullName === 'string' ? raw.fullName.trim() : '',
      dob: raw.dob || raw.dateOfBirth || '',
      dateOfBirth: raw.dateOfBirth || raw.dob || '',
      gender: raw.gender || 'PREFER_NOT_TO_SAY',
      email: raw.email || '',
      phoneNumber: raw.phoneNumber || '',
      domicileState: raw.domicileState || 'Karnataka',
      currentState: raw.currentState || raw.domicileState || 'Karnataka',
      currentDistrict: raw.currentDistrict || '',
      urbanRural: raw.urbanRural || 'URBAN',
      socialCategory: raw.socialCategory || 'GENERAL',
      subCategory: raw.subCategory || '',
      casteCertificateAvailable: !!raw.casteCertificateAvailable,
      isMinority: !!raw.isMinority,
      minorityCommunity: raw.minorityCommunity,
      isPersonWithDisability: !!raw.isPersonWithDisability,
      disabilityPercentage: raw.disabilityPercentage,
      disabilityCertificateAvailable: !!raw.disabilityCertificateAvailable,
      specialCategory: raw.specialCategory,
      educationLevel: raw.educationLevel || 'UNDERGRADUATE',
      courseName: raw.courseName || '',
      degreeName: raw.degreeName || '',
      branch: raw.branch || raw.courseName || '',
      collegeId: raw.collegeId,
      collegeName: raw.collegeName || '',
      university: raw.university || '',
      collegeState: raw.collegeState || 'Karnataka',
      yearOfStudy: typeof raw.yearOfStudy === 'number' && raw.yearOfStudy > 0 ? raw.yearOfStudy : 1,
      admissionYear: raw.admissionYear,
      academicYear: raw.academicYear || '2026-27',
      percentageOrCgpa: typeof raw.percentageOrCgpa === 'number' ? raw.percentageOrCgpa : 0,
      previousAcademicPercentage: raw.previousAcademicPercentage,
      isCgpa: !!raw.isCgpa,
      previousYearPassed: raw.previousYearPassed !== undefined ? !!raw.previousYearPassed : true,
      institutionType: raw.institutionType || 'AIDED',
      isCustomInstitution: !!raw.isCustomInstitution,
      isCustomCourse: !!raw.isCustomCourse,
      annualFamilyIncome: typeof raw.annualFamilyIncome === 'number' && raw.annualFamilyIncome >= 0 ? raw.annualFamilyIncome : 0,
      hasIncomeCertificate: !!raw.hasIncomeCertificate,
      incomeCertificateValidity: raw.incomeCertificateValidity || '',
      incomeSource: raw.incomeSource || 'Salaried / Private Service',
      familySize: typeof raw.familySize === 'number' ? raw.familySize : 4,
      isSingleParentChild: !!raw.isSingleParentChild,
      isOrphan: !!raw.isOrphan,
      isFirstGenerationLearner: !!raw.isFirstGenerationLearner,
      isDefenceBackground: !!raw.isDefenceBackground,
      isGirlChildOnly: !!raw.isGirlChildOnly,
      isHosteller: !!raw.isHosteller,
      documents: Array.isArray(raw.documents) ? raw.documents : [],
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Create an initial blank profile for a newly registered user
   */
  public createInitialProfile(userMeta?: { id: string; name: string; email: string }): StudentProfile {
    return {
      id: userMeta ? `profile_${userMeta.id}` : `profile_${Date.now()}`,
      userId: userMeta?.id,
      fullName: userMeta?.name || '',
      dob: '',
      dateOfBirth: '',
      gender: 'PREFER_NOT_TO_SAY',
      email: userMeta?.email || '',
      phoneNumber: '',
      domicileState: 'Karnataka',
      currentState: 'Karnataka',
      currentDistrict: '',
      urbanRural: 'URBAN',
      socialCategory: 'GENERAL',
      subCategory: '',
      casteCertificateAvailable: false,
      isMinority: false,
      isPersonWithDisability: false,
      educationLevel: 'UNDERGRADUATE',
      courseName: '',
      degreeName: '',
      branch: '',
      collegeName: '',
      university: '',
      collegeState: 'Karnataka',
      yearOfStudy: 1,
      academicYear: '2026-27',
      percentageOrCgpa: 0,
      isCgpa: false,
      previousYearPassed: true,
      institutionType: 'AIDED',
      annualFamilyIncome: 0,
      hasIncomeCertificate: false,
      isSingleParentChild: false,
      isOrphan: false,
      isFirstGenerationLearner: false,
      isDefenceBackground: false,
      isGirlChildOnly: false,
      isHosteller: false,
      documents: [],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Load profile from localStorage scoped to user ID, falling back safely
   */
  public getProfile(userId?: string, userMeta?: { id: string; name: string; email: string }): StudentProfile {
    // 1. Check user-specific storage
    if (userId) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(userId));
        if (stored) {
          const parsed = JSON.parse(stored);
          return this.sanitizeProfile(parsed);
        }
      } catch {
        // Fall through
      }
    }

    // 2. Check generic storage
    try {
      const genericStored = localStorage.getItem(GENERIC_PROFILE_STORAGE_KEY);
      if (genericStored) {
        const parsed = JSON.parse(genericStored);
        if (!userId || parsed.userId === userId || userId === 'demo-user-vraj') {
          return this.sanitizeProfile(parsed);
        }
      }
    } catch {
      // Fall through
    }

    // 3. Fallback: Demo user returns full demo dataset
    if (!userId || userId === 'demo-user-vraj') {
      return { ...DEFAULT_DEMO_PROFILE };
    }

    // 4. Returning initial profile for new registered user
    return this.createInitialProfile(userMeta || { id: userId, name: '', email: '' });
  }

  /**
   * Save student profile to localStorage
   */
  public saveProfile(profile: StudentProfile, userId?: string): StudentProfile {
    const updatedProfile: StudentProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    const targetUserId = userId || profile.userId;

    try {
      if (targetUserId) {
        localStorage.setItem(this.getStorageKey(targetUserId), JSON.stringify(updatedProfile));
      }
      localStorage.setItem(GENERIC_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.error('ScholarPath: Failed to persist student profile to localStorage:', e);
    }

    return updatedProfile;
  }

  /**
   * Reset profile to demo default or initial blank profile
   */
  public resetToDefault(userId?: string): StudentProfile {
    if (userId && userId !== 'demo-user-vraj') {
      const initial = this.createInitialProfile({ id: userId, name: '', email: '' });
      this.saveProfile(initial, userId);
      return initial;
    }

    const demo = { ...DEFAULT_DEMO_PROFILE, updatedAt: new Date().toISOString() };
    this.saveProfile(demo, 'demo-user-vraj');
    return demo;
  }

  /**
   * Calculate profile completion score and identify missing required fields per section.
   * Deterministic calculation based on defined required criteria, never a hardcoded score.
   */
  public calculateCompletion(profile: StudentProfile | null): ProfileCompletionStats {
    if (!profile) {
      return {
        percentage: 0,
        isComplete: false,
        missingFields: [
          'Personal Details (Name, Date of Birth, Gender)',
          'Social Category',
          'Academic Information (Level, Institution, Score)',
          'Financial Data (Annual Family Income)',
          'Residency / Domicile (State & District)',
          'Supporting Documents (At least 2 metadata records)',
        ],
        sectionScores: {
          personal: false,
          social: false,
          academic: false,
          financial: false,
          residency: false,
          special: false,
          documents: false,
        },
      };
    }

    const missingFields: string[] = [];

    // 1. Personal Information Section
    const personalPass = !!(
      profile.fullName &&
      profile.fullName.trim().length >= 2 &&
      (profile.dob || profile.dateOfBirth) &&
      profile.gender &&
      profile.gender !== 'PREFER_NOT_TO_SAY'
    );
    if (!personalPass) missingFields.push('Personal Details (Name, Date of Birth, Gender)');

    // 2. Social Category Section
    const socialPass = !!(profile.socialCategory && profile.socialCategory !== 'NOT_DISCLOSED');
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
    const residencyPass = !!(profile.domicileState && profile.currentDistrict && profile.currentDistrict.trim().length > 0);
    if (!residencyPass) missingFields.push('Residency / State Domicile & District');

    // 6. Special circumstances check (considered answered if profile exists)
    const specialPass = true;

    // 7. Supporting Document Readiness Section (at least 2 recorded documents)
    const documentsPass = Array.isArray(profile.documents) && profile.documents.length >= 2;
    if (!documentsPass) missingFields.push('Supporting Document Readiness Metadata (At least 2 certificates)');

    // Evaluated required sections: personal, social, academic, financial, residency, documents
    const requiredSections = [personalPass, socialPass, academicPass, financialPass, residencyPass, documentsPass];
    const completedCount = requiredSections.filter(Boolean).length;
    const percentage = Math.round((completedCount / requiredSections.length) * 100);

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
        special: specialPass,
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
    doc: PassportDocument,
    userId?: string
  ): StudentProfile {
    const existingIndex = profile.documents.findIndex(
      (d) => d.id === doc.id || (d.documentType === doc.documentType && d.referenceNumber && d.referenceNumber === doc.referenceNumber)
    );

    let updatedDocs: PassportDocument[];
    if (existingIndex >= 0) {
      updatedDocs = [...profile.documents];
      updatedDocs[existingIndex] = { ...doc };
    } else {
      updatedDocs = [...profile.documents, { ...doc }];
    }

    const updatedProfile: StudentProfile = {
      ...profile,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    return profileService.saveProfile(updatedProfile, userId || profile.userId);
  }

  /**
   * Remove a document metadata record
   */
  public removeDocument(profile: StudentProfile, docId: string, userId?: string): StudentProfile {
    const updatedDocs = profile.documents.filter((d) => d.id !== docId);
    const updatedProfile: StudentProfile = {
      ...profile,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };
    return profileService.saveProfile(updatedProfile, userId || profile.userId);
  }

  /**
   * Toggle or update availability status
   */
  public setDocumentStatus(
    profile: StudentProfile,
    docId: string,
    availability: AvailabilityStatus,
    verification: VerificationStatus,
    userId?: string
  ): StudentProfile {
    const updatedDocs = profile.documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          availabilityStatus: availability,
          verificationStatus: verification,
        };
      }
      return d;
    });

    const updatedProfile: StudentProfile = {
      ...profile,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    return profileService.saveProfile(updatedProfile, userId || profile.userId);
  }
}

export const profileService = new ProfileService();
export const documentService = new DocumentService();
