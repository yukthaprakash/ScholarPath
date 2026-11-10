import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentProfile } from '../types/profile';
import { MatchResult, UnlockOpportunity } from '../types/eligibility';
import { profileService, ProfileCompletionStats } from '../services/profileService';
import { schemeService } from '../services/schemeService';
import { eligibilityService, mapBackendMatchToFrontend } from '../services/eligibilityService';
import { ApiError } from '../services/apiClient';
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
  isSyncing: boolean;
  apiError: string | null;
  isDemoMode: boolean;
  completionPercentage: number;
  missingFields: string[];
  isProfileComplete: boolean;
  completionStats: ProfileCompletionStats;
  matches: MatchResult[];
  unlocks: UnlockOpportunity[];
  lastEvaluatedAt: string;
  updateProfile: (updated: StudentProfile) => Promise<void> | void;
  updateProfileSection: (sectionData: Partial<StudentProfile>) => Promise<void> | void;
  recalculateEligibility: () => Promise<RecalculateResult>;
  resetProfile: () => Promise<void> | void;
  clearApiError: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, markProfileCompleted } = useAuth();

  // Initialize profile scoped to current authenticated user
  const [profile, setProfile] = useState<StudentProfile>(() => {
    return profileService.getProfile(user?.id, user ? { id: user.id, name: user.name, email: user.email } : undefined);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unlocks, setUnlocks] = useState<UnlockOpportunity[]>([]);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string>(new Date().toISOString());

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  // Deterministically compute matches and unlock opportunities locally
  const evaluateLocally = useCallback((targetProfile: StudentProfile): RecalculateResult => {
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

  /**
   * Recalculate eligibility with backend engine: POST /api/v1/eligibility/evaluate
   * Gracefully falls back to deterministic local evaluation only if offline or demo mode
   */
  const computeMatches = useCallback(async (targetProfile: StudentProfile): Promise<RecalculateResult> => {
    try {
      const evalResponse = await eligibilityService.evaluateWithBackend();
      if (evalResponse && evalResponse.matches && evalResponse.matches.length > 0) {
        const mappedMatches = evalResponse.matches.map(mapBackendMatchToFrontend);
        setMatches(mappedMatches);

        // Compute unlock opportunities from available catalog
        const catalog = schemeService.getAllSchemes();
        const unlockItems = eligibilityService.identifyUnlocks(targetProfile, catalog);
        setUnlocks(unlockItems);

        const now = evalResponse.evaluatedAt || new Date().toISOString();
        setLastEvaluatedAt(now);
        setIsDemoMode(false);
        setApiError(null);

        const eligibleCount = evalResponse.summary?.eligibleCount ?? mappedMatches.filter((m) => m.status === 'ELIGIBLE').length;
        return {
          success: true,
          eligibleCount,
          totalEvaluated: mappedMatches.length,
          evaluatedAt: now,
        };
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'NETWORK_UNAVAILABLE' || err.status === 0) {
          setIsDemoMode(true);
          setApiError('Backend server is offline. Running in Local Demo Mode.');
        } else if (err.status === 404) {
          // Profile not yet created on backend: sync it first
          try {
            await profileService.saveProfileToBackend(targetProfile, user?.id);
            const retryEval = await eligibilityService.evaluateWithBackend();
            const mapped = retryEval.matches.map(mapBackendMatchToFrontend);
            setMatches(mapped);

            const catalog = schemeService.getAllSchemes();
            const unlockItems = eligibilityService.identifyUnlocks(targetProfile, catalog);
            setUnlocks(unlockItems);

            const now = retryEval.evaluatedAt || new Date().toISOString();
            setLastEvaluatedAt(now);
            setIsDemoMode(false);
            setApiError(null);

            const eligibleCount = retryEval.summary?.eligibleCount ?? mapped.filter((m) => m.status === 'ELIGIBLE').length;
            return {
              success: true,
              eligibleCount,
              totalEvaluated: mapped.length,
              evaluatedAt: now,
            };
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
    return evaluateLocally(targetProfile);
  }, [evaluateLocally, user?.id]);

  // Synchronize profile when authenticated user changes or on initial load
  useEffect(() => {
    let isMounted = true;

    async function initializeProfile() {
      setIsLoading(true);

      // 1. Initial user-scoped local load
      let activeProfile = profileService.getProfile(
        user?.id,
        user ? { id: user.id, name: user.name, email: user.email } : undefined
      );

      if (isMounted) {
        setProfile(activeProfile);
        evaluateLocally(activeProfile);
      }

      // 2. Remote backend hydration
      try {
        const backendProfile = await profileService.getProfileFromBackend(user?.id);
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
  }, [user?.id, computeMatches, evaluateLocally]);

  // Dynamic completion calculation
  const completionStats = profileService.calculateCompletion(profile);

  // Full Profile Update with real backend PUT /profile sync
  const updateProfile = async (updated: StudentProfile) => {
    // 1. Optimistic user-scoped local update
    const saved = profileService.saveProfile(updated, user?.id);
    setProfile(saved);
    evaluateLocally(saved);

    const stats = profileService.calculateCompletion(saved);
    if (stats.isComplete) {
      markProfileCompleted(true);
    }

    // 2. Asynchronous backend persistence
    setIsSyncing(true);
    try {
      const persisted = await profileService.saveProfileToBackend(saved, user?.id);
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
      await computeMatches(saved);
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
  const recalculateEligibility = async (): Promise<RecalculateResult> => {
    setIsSyncing(true);
    try {
      return await computeMatches(profile);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset to default demo profile
  const resetProfile = async () => {
    const reset = profileService.resetToDefault(user?.id);
    setProfile(reset);
    evaluateLocally(reset);
    setIsSyncing(true);
    try {
      await profileService.saveProfileToBackend(reset, user?.id);
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
        lastEvaluatedAt,
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
