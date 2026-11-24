import { User } from '../types/user';

const AUTH_STORAGE_KEY = 'scholarpath_user';

export class AuthService {
  /**
   * Retrieve currently authenticated user from localStorage
   */
  public getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  /**
   * Simulate Login
   */
  public async login(email: string, _password: string): Promise<User> {
    // Artificial latency for realistic UX loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const user: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' '),
      email,
      profileCompleted: true,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Simulate Registration
   */
  public async register(name: string, email: string, _password: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!name || name.trim().length < 2) {
      throw new Error('Please provide your full name.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      profileCompleted: false, // New users start with incomplete profile onboarding
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  /**
   * Update User Profile Completion Status
   */
  public updateProfileStatus(completed: boolean): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const updated: User = {
      ...current,
      profileCompleted: completed,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Get default pre-configured demo user for instant testing
   */
  public getDemoUser(): User {
    const demoUser: User = {
      id: 'demo-user-vraj',
      name: 'Vraj Ardeshana',
      email: 'vraj@scholarpath.in',
      profileCompleted: true,
      createdAt: '2026-10-01T00:00:00.000Z',
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    return demoUser;
  }
}

export const authService = new AuthService();
