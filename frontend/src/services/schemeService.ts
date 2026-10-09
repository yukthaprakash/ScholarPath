import { Scheme, SchemeType, ScopeType } from '../types/scheme';
import { EducationLevel, SocialCategory } from '../types/profile';
import { VERIFIED_SCHEMES } from '../fixtures/verifiedSchemes';

export interface SchemeFilterOptions {
  query?: string;
  type?: SchemeType | 'ALL';
  scope?: ScopeType | 'ALL';
  educationLevel?: EducationLevel | 'ALL';
  category?: SocialCategory | 'ALL';
  maxIncomeLimit?: number;
  domicileState?: string;
}

export class SchemeService {
  private schemes: Scheme[] = VERIFIED_SCHEMES;

  /**
   * Get all schemes in catalog
   */
  public getAllSchemes(): Scheme[] {
    return [...this.schemes];
  }

  /**
   * Find scheme by ID or slug
   */
  public getSchemeByIdOrSlug(idOrSlug: string): Scheme | undefined {
    return this.schemes.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  }

  /**
   * Filter and search schemes cleanly
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
