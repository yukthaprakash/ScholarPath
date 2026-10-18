import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentProfile } from '../types/profile';
import { MatchResult, UnlockOpportunity } from '../types/eligibility';
import { profileService, ProfileCompletionStats } from '../services/profileService';
import { schemeService } from '../services/schemeService';
import { eligibilityService } from '../services/eligibilityService';
import { useAuth } from './AuthContext';

export interface RecalculateResult {
  success: boolean;
  eligibleCount: number;
  totalEvaluated: number;
  evaluatedAt: string;
  errorMessage?: string;
}

interface ProfileContextType {
  profile: StudentProfile;
  isLoading: boolean;
  completionPercentage: number;
  missingFields: string[];
  isProfileComplete: boolean;
  completionStats: ProfileCompletionStats;
  matches: MatchResult[];
  unlocks: UnlockOpportunity[];
  lastEvaluatedAt: string;
  updateProfile: (updated: StudentProfile) => void;
  updateProfileSection: (sectionData: Partial<StudentProfile>) => void;
  recalculateEligibility: () => RecalculateResult;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, markProfileCompleted } = useAuth();

  // Initialize profile scoped to current authenticated user
  const [profile, setProfile] = useState<StudentProfile>(() => {
    return profileService.getProfile(user?.id, user ? { id: user.id, name: user.name, email: user.email } : undefined);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unlocks, setUnlocks] = useState<UnlockOpportunity[]>([]);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string>(new Date().toISOString());

  // Deterministically compute matches and unlock opportunities
  const evaluateProfile = useCallback((targetProfile: StudentProfile): RecalculateResult => {
    try {
      const allSchemes = schemeService.getAllSchemes();
      const results = eligibilityService.evaluateAll(targetProfile, allSchemes);
      const unlockItems = eligibilityService.identifyUnlocks(targetProfile, allSchemes);
      const now = new Date().toISOString();

      setMatches(results);
      setUnlocks(unlockItems);
      setLastEvaluatedAt(now);

      const eligibleCount = results.filter((r) => r.status === 'ELIGIBLE').length;

      return {
        success: true,
        eligibleCount,
        totalEvaluated: results.length,
        evaluatedAt: now,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Evaluation rule processing failure';
      console.error('ScholarPath deterministic evaluation failed:', err);
      return {
        success: false,
        eligibleCount: 0,
        totalEvaluated: 0,
        evaluatedAt: new Date().toISOString(),
        errorMessage: message,
      };
    }
  }, []);

  // Synchronize profile when authenticated user changes
  useEffect(() => {
    setIsLoading(true);
    const loaded = profileService.getProfile(
      user?.id,
      user ? { id: user.id, name: user.name, email: user.email } : undefined
    );
    setProfile(loaded);
    evaluateProfile(loaded);
    setIsLoading(false);
  }, [user?.id, evaluateProfile]);

  // Dynamic completion calculation
  const completionStats = profileService.calculateCompletion(profile);

  // Full Profile Update
  const updateProfile = (updated: StudentProfile) => {
    const saved = profileService.saveProfile(updated, user?.id);
    setProfile(saved);
    evaluateProfile(saved);

    const stats = profileService.calculateCompletion(saved);
    if (stats.isComplete) {
      markProfileCompleted(true);
    }
  };

  // Partial Section Update
  const updateProfileSection = (sectionData: Partial<StudentProfile>) => {
    const updated: StudentProfile = {
      ...profile,
      ...sectionData,
    };
    updateProfile(updated);
  };

  // Trigger manual recalculation
  const recalculateEligibility = (): RecalculateResult => {
    return evaluateProfile(profile);
  };

  // Reset profile to default demo or blank initial profile
  const resetProfile = () => {
    const reset = profileService.resetToDefault(user?.id);
    setProfile(reset);
    evaluateProfile(reset);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        completionPercentage: completionStats.percentage,
        missingFields: completionStats.missingFields,
        isProfileComplete: completionStats.isComplete,
        completionStats,
        matches,
        unlocks,
        lastEvaluatedAt,
        updateProfile,
        updateProfileSection,
        recalculateEligibility,
        resetProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
