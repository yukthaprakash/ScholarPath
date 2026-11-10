import {
  College,
  CourseDegree,
  VERIFIED_COLLEGES,
  VERIFIED_DEGREES,
  INDIAN_STATES,
  KARNATAKA_DISTRICTS
} from '../fixtures/verifiedColleges';

export class CollegeService {
  private colleges: College[] = VERIFIED_COLLEGES;
  private degrees: CourseDegree[] = VERIFIED_DEGREES;

  public getAllColleges(): College[] {
    return [...this.colleges];
  }

  public getCollegeById(id: string): College | undefined {
    return this.colleges.find((c) => c.id === id);
  }

  public searchColleges(query: string, stateFilter?: string): College[] {
    const q = query.toLowerCase().trim();
    return this.colleges.filter((c) => {
      const matchesState = !stateFilter || c.state.toLowerCase() === stateFilter.toLowerCase();
      if (!matchesState) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.university.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q))
      );
    });
  }

  public getDegreesByLevel(level?: string): CourseDegree[] {
    if (!level) return [...this.degrees];
    return this.degrees.filter((d) => d.level === level);
  }

  public getIndianStates(): string[] {
    return [...INDIAN_STATES];
  }

  public getDistrictsByState(state?: string): string[] {
    if (state && state.toLowerCase() === 'karnataka') {
      return [...KARNATAKA_DISTRICTS];
    }
    return [
      'District Headquarter / Urban',
      'Rural / Block Level',
      'Other District',
    ];
  }
}

export const collegeService = new CollegeService();
