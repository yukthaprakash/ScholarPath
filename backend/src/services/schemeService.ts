import { query, checkDatabaseHealth } from '../db';
import { SchemeQueryInput } from '../schemas/schemeSchema';
import { NotFoundError } from '../errors/AppError';

export interface SchemeRecord {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  type: string;
  scope: 'state' | 'central';
  state?: string | null;
  authority: string;
  category?: string | null;
  financialBenefit?: string | null;
  deadline?: string | null;
  isActive: boolean;
  officialUrl?: string | null;
  applicationUrl?: string | null;
  details?: Record<string, unknown>;
  rules?: unknown[];
  requiredDocuments?: unknown[];
  sources?: unknown[];
  trustData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSchemes {
  data: SchemeRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In-memory initial seed for test mode or offline operation
const seedSchemes: SchemeRecord[] = [
  {
    id: 'scheme-001',
    slug: 'post-matric-scholarship-obc',
    title: 'Post-Matric Scholarship for OBC Students',
    shortDescription: 'Financial assistance for OBC post-matriculation students',
    fullDescription: 'Provides financial support for post-secondary education of students belonging to OBC category.',
    type: 'scholarship',
    scope: 'state',
    state: 'Karnataka',
    authority: 'Department of Social Welfare',
    category: 'OBC',
    financialBenefit: 'Up to ₹15,000 per annum',
    deadline: '2026-10-31',
    isActive: true,
    officialUrl: 'https://scholarships.gov.in',
    applicationUrl: 'https://postmatric.karnataka.gov.in',
    details: { eligibilitySummary: 'OBC students with family income <= 2.5 LPA' },
    rules: [{ code: 'INCOME_LE_250K', field: 'annualFamilyIncome', op: 'LTE', value: 250000 }],
    requiredDocuments: [{ type: 'income_certificate', name: 'Income Certificate' }],
    sources: [{ name: 'Social Welfare Gazette 2026', url: 'https://sw.kar.nic.in' }],
    trustData: { trustScore: 95, verified: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-002',
    slug: 'central-sector-scheme-university-students',
    title: 'Central Sector Scheme of Scholarships for College and University Students',
    shortDescription: 'Financial assistance for meritorious students from low income families',
    fullDescription: 'Scholarship awarded to meritorious students for pursuing higher studies in degree courses.',
    type: 'scholarship',
    scope: 'central',
    state: null,
    authority: 'Ministry of Education',
    category: 'MERIT_CUM_MEANS',
    financialBenefit: '₹12,000 per annum at Graduation level',
    deadline: '2026-10-31',
    isActive: true,
    officialUrl: 'https://scholarships.gov.in',
    applicationUrl: 'https://scholarships.gov.in',
    details: { eligibilitySummary: 'Above 80th percentile in Class 12 board' },
    rules: [{ code: 'PERCENTILE_GE_80', field: 'academicPercentage', op: 'GTE', value: 80 }],
    requiredDocuments: [{ type: 'marksheet_12th', name: 'Class 12 Marksheet' }],
    sources: [{ name: 'MoE Guidelines 2026', url: 'https://education.gov.in' }],
    trustData: { trustScore: 98, verified: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function getSchemes(input: SchemeQueryInput): Promise<PaginatedSchemes> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    // Perform in-memory filtering & pagination
    let filtered = [...seedSchemes];

    const searchTerm = (input.q || input.search)?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm) ||
          s.shortDescription?.toLowerCase().includes(searchTerm) ||
          s.authority.toLowerCase().includes(searchTerm) ||
          s.category?.toLowerCase().includes(searchTerm)
      );
    }

    if (input.type) {
      filtered = filtered.filter((s) => s.type.toLowerCase() === input.type?.toLowerCase());
    }

    if (input.scope) {
      filtered = filtered.filter((s) => s.scope === input.scope);
    }

    if (input.state) {
      filtered = filtered.filter((s) => s.state?.toLowerCase() === input.state?.toLowerCase());
    }

    if (input.authority) {
      filtered = filtered.filter((s) => s.authority.toLowerCase().includes(input.authority!.toLowerCase()));
    }

    if (input.category) {
      filtered = filtered.filter((s) => s.category?.toLowerCase() === input.category?.toLowerCase());
    }

    const total = filtered.length;
    const page = input.page;
    const limit = input.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  // Database Query Execution
  const conditions: string[] = ['is_active = true'];
  const params: unknown[] = [];
  let paramIndex = 1;

  const searchTerm = input.q || input.search;
  if (searchTerm && searchTerm.trim().length > 0) {
    conditions.push(`(
      tsv @@ websearch_to_tsquery('english', $${paramIndex})
      OR LOWER(title) LIKE LOWER($${paramIndex + 1})
      OR LOWER(authority) LIKE LOWER($${paramIndex + 1})
    )`);
    params.push(searchTerm.trim(), `%${searchTerm.trim()}%`);
    paramIndex += 2;
  }

  if (input.type) {
    conditions.push(`type = $${paramIndex}`);
    params.push(input.type);
    paramIndex++;
  }

  if (input.scope) {
    conditions.push(`scope = $${paramIndex}`);
    params.push(input.scope);
    paramIndex++;
  }

  if (input.state) {
    conditions.push(`LOWER(state) = LOWER($${paramIndex})`);
    params.push(input.state);
    paramIndex++;
  }

  if (input.authority) {
    conditions.push(`LOWER(authority) LIKE LOWER($${paramIndex})`);
    params.push(`%${input.authority}%`);
    paramIndex++;
  }

  if (input.category) {
    conditions.push(`LOWER(category) = LOWER($${paramIndex})`);
    params.push(input.category);
    paramIndex++;
  }

  if (input.deadline === 'active_only') {
    conditions.push(`(deadline IS NULL OR deadline >= CURRENT_DATE)`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countSql = `SELECT COUNT(*)::int AS total FROM schemes ${whereClause}`;
  const countRes = await query<{ total: number }>(countSql, params);
  const total = countRes.rows[0]?.total ?? 0;

  // Sorting
  const sortColumn =
    input.sortBy === 'deadline' ? 'deadline' : input.sortBy === 'created_at' ? 'created_at' : 'title';
  const sortOrder = input.sortOrder === 'desc' ? 'DESC' : 'ASC';

  // Pagination params
  const offset = (input.page - 1) * input.limit;
  const dataSql = `
    SELECT
      id,
      slug,
      title,
      short_description AS "shortDescription",
      full_description AS "fullDescription",
      type,
      scope,
      state,
      authority,
      category,
      financial_benefit AS "financialBenefit",
      deadline::text AS "deadline",
      is_active AS "isActive",
      official_url AS "officialUrl",
      application_url AS "applicationUrl",
      details,
      rules,
      required_documents AS "requiredDocuments",
      sources,
      trust_data AS "trustData",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM schemes
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder} NULLS LAST
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(input.limit, offset);
  const dataRes = await query<SchemeRecord>(dataSql, params);

  const totalPages = Math.ceil(total / input.limit) || 1;

  return {
    data: dataRes.rows,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages
    }
  };
}

export async function getSchemeBySlug(slug: string): Promise<SchemeRecord> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    const found = seedSchemes.find((s) => s.slug === slug && s.isActive);
    if (!found) {
      throw new NotFoundError(`Scheme with slug '${slug}' not found`);
    }
    return found;
  }

  const sql = `
    SELECT
      id,
      slug,
      title,
      short_description AS "shortDescription",
      full_description AS "fullDescription",
      type,
      scope,
      state,
      authority,
      category,
      financial_benefit AS "financialBenefit",
      deadline::text AS "deadline",
      is_active AS "isActive",
      official_url AS "officialUrl",
      application_url AS "applicationUrl",
      details,
      rules,
      required_documents AS "requiredDocuments",
      sources,
      trust_data AS "trustData",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM schemes
    WHERE slug = $1 AND is_active = true
  `;

  const res = await query<SchemeRecord>(sql, [slug]);

  if (!res.rows[0] || res.rows.length === 0) {
    throw new NotFoundError(`Scheme with slug '${slug}' not found`);
  }

  return res.rows[0];
}
