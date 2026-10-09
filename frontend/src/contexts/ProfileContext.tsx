import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentProfile } from '../types/profile';
import { MatchResult, UnlockOpportunity } from '../types/eligibility';
import { profileService, ProfileCompletionStats } from '../services/profileService';
import { schemeService } from '../services/schemeService';
import { eligibilityService } from '../services/eligibilityService';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: StudentProfile;
  isLoading: boolean;
  completionPercentage: number;
  missingFields: string[];
  isProfileComplete: boolean;
  completionStats: ProfileCompletionStats;
  matches: MatchResult[];
  unlocks: UnlockOpportunity[];
  updateProfile: (updated: StudentProfile) => void;
  updateProfileSection: (sectionData: Partial<StudentProfile>) => void;
  recalculateEligibility: () => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { markProfileCompleted } = useAuth();
  const [profile, setProfile] = useState<StudentProfile>(() => profileService.getProfile());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unlocks, setUnlocks] = useState<UnlockOpportunity[]>([]);

  // Compute stats on profile change
  const completionStats = profileService.calculateCompletion(profile);

  // Recalculate deterministic eligibility matches against scheme catalog
  const computeMatches = useCallback((targetProfile: StudentProfile) => {
    const allSchemes = schemeService.getAllSchemes();
    const results = eligibilityService.evaluateAll(targetProfile, allSchemes);
    const unlockItems = eligibilityService.identifyUnlocks(targetProfile, allSchemes);
    setMatches(results);
    setUnlocks(unlockItems);
  }, []);

  // Initial load
  useEffect(() => {
    const loaded = profileService.getProfile();
    setProfile(loaded);
    computeMatches(loaded);
    setIsLoading(false);
  }, [computeMatches]);

  // Full Profile Update
  const updateProfile = (updated: StudentProfile) => {
    setProfile(updated);
    profileService.saveProfile(updated);
    computeMatches(updated);

    const stats = profileService.calculateCompletion(updated);
    if (stats.isComplete) {
      markProfileCompleted(true);
    }
  };

  // Partial Section Update
  const updateProfileSection = (sectionData: Partial<StudentProfile>) => {
    const updated = {
      ...profile,
      ...sectionData,
    };
    updateProfile(updated);
  };

  // Trigger manual re-evaluation
  const recalculateEligibility = () => {
    computeMatches(profile);
  };

  // Reset to default demo
  const resetProfile = () => {
    const reset = profileService.resetToDefault();
    setProfile(reset);
    computeMatches(reset);
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

