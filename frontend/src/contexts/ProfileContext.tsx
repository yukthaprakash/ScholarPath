import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentProfile } from '../types/profile';
import { MatchResult, UnlockOpportunity } from '../types/eligibility';
import { profileService, ProfileCompletionStats } from '../services/profileService';
import { schemeService } from '../services/schemeService';
import { eligibilityService, mapBackendMatchToFrontend } from '../services/eligibilityService';
import { ApiError } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: StudentProfile;
  isLoading: boolean;
  isSyncing: boolean;
  apiError: string | null;
  isDemoMode: boolean;
  completionPercentage: number;
  missingFields: string[];
  isProfileComplete: boolean;
  completionStats: ProfileCompletionStats;
  matches: MatchResult[];
  unlocks: UnlockOpportunity[];
  updateProfile: (updated: StudentProfile) => Promise<void> | void;
  updateProfileSection: (sectionData: Partial<StudentProfile>) => Promise<void> | void;
  recalculateEligibility: () => Promise<void> | void;
  resetProfile: () => Promise<void> | void;
  clearApiError: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { markProfileCompleted } = useAuth();
  const [profile, setProfile] = useState<StudentProfile>(() => profileService.getProfile());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unlocks, setUnlocks] = useState<UnlockOpportunity[]>([]);

  // Compute stats on profile change
  const completionStats = profileService.calculateCompletion(profile);

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  /**
   * Recalculate eligibility with backend engine: POST /api/v1/eligibility/evaluate
   * Gracefully falls back to deterministic local evaluation only if offline or demo mode
   */
  const computeMatches = useCallback(async (targetProfile: StudentProfile) => {
    try {
      const evalResponse = await eligibilityService.evaluateWithBackend();
      if (evalResponse && evalResponse.matches && evalResponse.matches.length > 0) {
        const mappedMatches = evalResponse.matches.map(mapBackendMatchToFrontend);
        setMatches(mappedMatches);

        // Compute unlock opportunities from available catalog
        const catalog = schemeService.getAllSchemes();
        const unlockItems = eligibilityService.identifyUnlocks(targetProfile, catalog);
        setUnlocks(unlockItems);
        setIsDemoMode(false);
        setApiError(null);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'NETWORK_UNAVAILABLE' || err.status === 0) {
          setIsDemoMode(true);
          setApiError('Backend server is offline. Running in Local Demo Mode.');
        } else if (err.status === 404) {
          // Profile not yet created on backend: sync it first
          try {
            await profileService.saveProfileToBackend(targetProfile);
            const retryEval = await eligibilityService.evaluateWithBackend();
            const mapped = retryEval.matches.map(mapBackendMatchToFrontend);
            setMatches(mapped);
            setIsDemoMode(false);
            setApiError(null);
            return;
          } catch {
            setIsDemoMode(true);
          }
        } else {
          setApiError(`Eligibility evaluation error: ${err.message}`);
        }
      } else {
        setIsDemoMode(true);
      }
    }

    // Fallback: evaluate locally against verified scheme catalog
    const allSchemes = schemeService.getAllSchemes();
    const results = eligibilityService.evaluateAll(targetProfile, allSchemes);
    const unlockItems = eligibilityService.identifyUnlocks(targetProfile, allSchemes);
    setMatches(results);
    setUnlocks(unlockItems);
  }, []);

  // Initial load: sync profile from backend GET /profile, then evaluate
  useEffect(() => {
    let isMounted = true;

    async function initializeProfile() {
      setIsLoading(true);
      let activeProfile = profileService.getProfile();

      try {
        const backendProfile = await profileService.getProfileFromBackend();
        if (isMounted && backendProfile) {
          activeProfile = backendProfile;
          setProfile(backendProfile);
          setIsDemoMode(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError && (err.code === 'NETWORK_UNAVAILABLE' || err.status === 0)) {
            setIsDemoMode(true);
            setApiError('Backend server unreachable. Using local profile.');
          } else {
            setIsDemoMode(true);
          }
        }
      }

      if (isMounted) {
        await computeMatches(activeProfile);
        setIsLoading(false);
      }
    }

    initializeProfile();

    return () => {
      isMounted = false;
    };
  }, [computeMatches]);

  // Full Profile Update with real backend PUT /profile sync
  const updateProfile = async (updated: StudentProfile) => {
    // 1. Optimistic local update
    setProfile(updated);
    profileService.saveProfile(updated);

    const stats = profileService.calculateCompletion(updated);
    if (stats.isComplete) {
      markProfileCompleted(true);
    }

    // 2. Asynchronous backend persistence
    setIsSyncing(true);
    try {
      const persisted = await profileService.saveProfileToBackend(updated);
      setProfile(persisted);
      await computeMatches(persisted);
      setApiError(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError(`Profile update failed: ${err.message}`);
      } else {
        setApiError('Failed to synchronize profile with backend.');
      }
      // Re-evaluate locally on error
      await computeMatches(updated);
    } finally {
      setIsSyncing(false);
    }
  };

  // Partial Section Update
  const updateProfileSection = async (sectionData: Partial<StudentProfile>) => {
    const updated: StudentProfile = {
      ...profile,
      ...sectionData,
    };
    await updateProfile(updated);
  };

  // Trigger manual re-evaluation
  const recalculateEligibility = async () => {
    setIsSyncing(true);
    try {
      await computeMatches(profile);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset to default demo profile
  const resetProfile = async () => {
    const reset = profileService.resetToDefault();
    setProfile(reset);
    setIsSyncing(true);
    try {
      await profileService.saveProfileToBackend(reset);
      await computeMatches(reset);
    } catch {
      await computeMatches(reset);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        isSyncing,
        apiError,
        isDemoMode,
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
        clearApiError,
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
