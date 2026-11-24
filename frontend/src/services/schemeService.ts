import { Scheme, SchemeType, ScopeType } from '../types/scheme';
import { EducationLevel, SocialCategory } from '../types/profile';
import { VERIFIED_SCHEMES } from '../fixtures/verifiedSchemes';
import { apiClient } from './apiClient';
import { toFrontendScheme, BackendSchemeRecord } from './schemeAdapter';

export interface SchemeFilterOptions {
  query?: string;
  type?: SchemeType | 'ALL';
  scope?: ScopeType | 'ALL';
  educationLevel?: EducationLevel | 'ALL';
  category?: SocialCategory | 'ALL';
  maxIncomeLimit?: number;
  domicileState?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSchemesResponse {
  data: BackendSchemeRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FetchSchemesResult {
  schemes: Scheme[];
  total: number;
  page: number;
  totalPages: number;
}

export class SchemeService {
  private schemes: Scheme[] = VERIFIED_SCHEMES;

  /**
   * Synchronously return all schemes from local verified catalog (cached or fallback)
   */
  public getAllSchemes(): Scheme[] {
    return [...this.schemes];
  }

  /**
   * Find scheme by ID or slug synchronously
   */
  public getSchemeByIdOrSlug(idOrSlug: string): Scheme | undefined {
    return this.schemes.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  }

  /**
   * Cache fetched schemes in memory so synchronous lookups across pages work smoothly
   */
  public cacheSchemes(newSchemes: Scheme[]): void {
    const existingMap = new Map(this.schemes.map((s) => [s.slug, s]));
    newSchemes.forEach((s) => existingMap.set(s.slug, s));
    this.schemes = Array.from(existingMap.values());
  }

  /**
   * Fetch schemes with search, multi-field filtering, and pagination from real backend: GET /api/v1/schemes
   */
  public async fetchSchemes(options: SchemeFilterOptions = {}): Promise<FetchSchemesResult> {
    const params: Record<string, string | number | undefined> = {
      page: options.page || 1,
      limit: options.limit || 20,
    };

    if (options.query && options.query.trim()) {
      params.q = options.query.trim();
    }
    if (options.type && options.type !== 'ALL') {
      params.type = options.type.toLowerCase();
    }
    if (options.scope && options.scope !== 'ALL') {
      params.scope = options.scope.toLowerCase();
    }
    if (options.category && options.category !== 'ALL') {
      params.category = options.category;
    }
    if (options.domicileState && options.domicileState !== 'Other') {
      params.state = options.domicileState;
    }

    try {
      const response = await apiClient.get<PaginatedSchemesResponse>('/schemes', params);
      const mappedSchemes = response.data.map(toFrontendScheme);

      // Cache for cross-component access
      this.cacheSchemes(mappedSchemes);

      return {
        schemes: mappedSchemes,
        total: response.pagination.total,
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
      };
    } catch (err) {
      // Re-throw so caller can display a clear error or retry state
      throw err;
    }
  }

  /**
   * Fetch single scheme details by slug from real backend: GET /api/v1/schemes/:slug
   */
  public async fetchSchemeBySlug(slug: string): Promise<Scheme> {
    try {
      const response = await apiClient.get<{ scheme: BackendSchemeRecord }>(`/schemes/${encodeURIComponent(slug)}`);
      const mapped = toFrontendScheme(response.scheme);
      this.cacheSchemes([mapped]);
      return mapped;
    } catch (err) {
      // Check local cache if backend is unavailable or not found
      const local = this.getSchemeByIdOrSlug(slug);
      if (local) {
        // If local exists, return with warning or re-throw based on context
        return local;
      }
      throw err;
    }
  }

  /**
   * Filter and search schemes cleanly in-memory (for demo/offline mode)
   */
  public filterSchemes(options: SchemeFilterOptions): Scheme[] {
    const {
      query,
      type,
      scope,
      educationLevel,
      category,
      maxIncomeLimit,
      domicileState,
    } = options;

    return this.schemes.filter((scheme) => {
      // Keyword search
      if (query && query.trim() !== '') {
        const q = query.toLowerCase().trim();
        const matchesName = scheme.name.toLowerCase().includes(q);
        const matchesDesc = scheme.description.toLowerCase().includes(q);
        const matchesProvider = scheme.provider.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesProvider) {
          return false;
        }
      }

      // Type filter
      if (type && type !== 'ALL' && scheme.type !== type) {
        return false;
      }

      // Scope filter
      if (scope && scope !== 'ALL' && scheme.scope !== scope) {
        return false;
      }

      // Education Level filter
      if (
        educationLevel &&
        educationLevel !== 'ALL' &&
        !scheme.educationLevels.includes(educationLevel)
      ) {
        return false;
      }

      // Social Category filter
      if (
        category &&
        category !== 'ALL' &&
        !scheme.allowedCategories.includes(category)
      ) {
        return false;
      }

      // Domicile filter
      if (
        domicileState &&
        scheme.requiredDomicile &&
        scheme.requiredDomicile.toLowerCase() !== domicileState.toLowerCase()
      ) {
        return false;
      }

      // Max Income Filter
      if (
        maxIncomeLimit !== undefined &&
        scheme.maxAnnualIncome !== undefined &&
        scheme.maxAnnualIncome < maxIncomeLimit
      ) {
        return false;
      }

      return true;
    });
  }
}

export const schemeService = new SchemeService();
