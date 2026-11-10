import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { profileService } from './profileService';
import { apiClient } from './apiClient';
import { DEFAULT_DEMO_PROFILE } from '../fixtures/defaultDemoProfile';
import { BackendProfileRecord } from './profileAdapter';

// In-memory localStorage mock for node environment
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => storage.set(key, val),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ProfileService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves default demo profile if storage is empty', () => {
    const profile = profileService.getProfile();
    expect(profile.fullName).toBe(DEFAULT_DEMO_PROFILE.fullName);
  });

  it('saves and reads back profile from localStorage', () => {
    const custom = {
      ...DEFAULT_DEMO_PROFILE,
      fullName: 'Rahul Roy',
      annualFamilyIncome: 180000,
    };
    profileService.saveProfile(custom);

    const loaded = profileService.getProfile();
    expect(loaded.fullName).toBe('Rahul Roy');
    expect(loaded.annualFamilyIncome).toBe(180000);
  });

  it('fetches profile from backend GET /profile and maps to StudentProfile', async () => {
    const mockBackendRecord: BackendProfileRecord = {
      id: 'prof-001',
      userId: 'usr-123',
      fullName: 'Vikram Singh',
      dateOfBirth: '2004-06-12',
      gender: 'male',
      category: 'GENERAL',
      domicileState: 'Delhi',
      annualFamilyIncome: 300000,
      educationLevel: 'undergraduate',
      currentCourse: 'B.Sc Computer Science',
      courseYear: 3,
      academicPercentage: 88,
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue({ profile: mockBackendRecord });

    const result = await profileService.getProfileFromBackend();
    expect(result.fullName).toBe('Vikram Singh');
    expect(result.gender).toBe('MALE');
    expect(result.socialCategory).toBe('GENERAL');
    expect(result.domicileState).toBe('Delhi');

    // Should also be cached in localStorage
    const cached = profileService.getProfile();
    expect(cached.fullName).toBe('Vikram Singh');
  });

  it('persists profile to backend PUT /profile', async () => {
    const mockBackendRecord: BackendProfileRecord = {
      id: 'prof-001',
      userId: 'usr-123',
      fullName: 'Vikram Singh Updated',
      dateOfBirth: '2004-06-12',
      gender: 'male',
      category: 'GENERAL',
      domicileState: 'Delhi',
      annualFamilyIncome: 250000,
      educationLevel: 'undergraduate',
      currentCourse: 'B.Sc Computer Science',
      courseYear: 3,
      academicPercentage: 90,
    };

    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue({ profile: mockBackendRecord });

    const updatedProfile = {
      ...DEFAULT_DEMO_PROFILE,
      fullName: 'Vikram Singh Updated',
      annualFamilyIncome: 250000,
    };

    const result = await profileService.saveProfileToBackend(updatedProfile);
    expect(putSpy).toHaveBeenCalled();
    expect(result.fullName).toBe('Vikram Singh Updated');
  });

  it('calculates profile completion statistics accurately', () => {
    const stats = profileService.calculateCompletion(DEFAULT_DEMO_PROFILE);
    expect(stats.percentage).toBeGreaterThanOrEqual(80);
    expect(stats.isComplete).toBe(true);

    const emptyStats = profileService.calculateCompletion(null);
    expect(emptyStats.percentage).toBe(0);
    expect(emptyStats.isComplete).toBe(false);
    expect(emptyStats.missingFields.length).toBeGreaterThan(0);
  });
});
