import fs from 'fs';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from '../db';
import { validateScheme, Scheme } from '@scholarpath/engine';

export interface DbSchemeRecord {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string | null;
  type: string;
  scope: 'state' | 'central';
  state: string | null;
  authority: string;
  category: string | null;
  financialBenefit: string | null;
  deadline: string | null;
  isActive: boolean;
  officialUrl: string;
  applicationUrl: string;
  details: Record<string, unknown>;
  rules: unknown[];
  requiredDocuments: unknown[];
  sources: unknown[];
  trustData: Record<string, unknown>;
}

export interface SeedOptions {
  dryRun?: boolean;
  schemesDir?: string;
  client?: PoolClient;
  silent?: boolean;
}

export interface SeedRecordResult {
  file: string;
  slug: string;
  title: string;
  status: 'inserted' | 'updated' | 'would_insert' | 'would_update' | 'failed' | 'skipped';
  error?: string;
}

export interface SeedReport {
  totalFiles: number;
  validCount: number;
  invalidCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  dryRun: boolean;
  results: SeedRecordResult[];
}

/**
 * Extracts a demographic/caste/target category from the scheme rules and metadata.
 */
export function extractCategory(scheme: Scheme): string | null {
  const rawScheme = scheme as unknown as Record<string, unknown>;
  const directCategory = rawScheme['category'];
  if (typeof directCategory === 'string' && directCategory.trim().length > 0) {
    return directCategory.trim();
  }

  const casteRule = scheme.rules.find((r) => r.key.endsWith('casteCategory'));
  if (casteRule && typeof casteRule.expectedValue === 'string') {
    return casteRule.expectedValue;
  }

  if (scheme.rules.some((r) => r.key.endsWith('isSingleGirlChild'))) {
    return 'SINGLE_GIRL_CHILD';
  }

  if (scheme.rules.some((r) => r.key.endsWith('gender') && r.expectedValue === 'FEMALE')) {
    return 'FEMALE';
  }

  if (scheme.id.includes('central-sector')) {
    return 'MERIT_CUM_MEANS';
  }

  return null;
}

/**
 * Maps a validated canonical Scheme object into the PostgreSQL schemes table columns.
 */
export function mapSchemeToDbRecord(scheme: Scheme): DbSchemeRecord {
  const isStateScope = Boolean(scheme.state) || scheme.authorityType === 'STATE_GOVT';
  const scope: 'state' | 'central' = isStateScope ? 'state' : 'central';

  const financialBenefit =
    scheme.benefitDetails.description ??
    (scheme.benefitDetails.financialAmountPerYear
      ? `₹${scheme.benefitDetails.financialAmountPerYear.toLocaleString('en-IN')}`
      : null);

  const deadline = scheme.applicationWindow.endDate ?? null;

  const requiredDocuments = scheme.requiredCertificates.map((cert) => ({
    type: cert.toLowerCase(),
    name: cert.replace(/_/g, ' '),
    estimatedDays: scheme.estimatedIssuanceDays?.[cert] ?? null
  }));

  const sources = scheme.sourceCitation ? [scheme.sourceCitation] : [];

  const trustData: Record<string, unknown> = {
    tier: scheme.sourceCitation?.tier ?? 1,
    portalName: scheme.sourceCitation?.portalName ?? null,
    url: scheme.sourceCitation?.url ?? scheme.officialUrl,
    clauseRef: scheme.sourceCitation?.clauseRef ?? null,
    verifiedDate: scheme.sourceCitation?.verifiedDate ?? null,
    readOn: ((scheme.sourceCitation as unknown as Record<string, unknown>)?.['readOn'] as string | undefined) ?? null,
    lastVerified: ((scheme as unknown as Record<string, unknown>)?.['lastVerified'] as string | undefined) ?? scheme.sourceCitation?.verifiedDate ?? null
  };

  const details: Record<string, unknown> = {
    authorityType: scheme.authorityType,
    benefitDetails: scheme.benefitDetails,
    applicationWindow: scheme.applicationWindow,
    requiredCertificates: scheme.requiredCertificates,
    estimatedIssuanceDays: scheme.estimatedIssuanceDays ?? {},
    isDemo: scheme.isDemo,
    version: scheme.version
  };

  const applicationUrl =
    ((scheme as unknown as Record<string, unknown>)?.['applicationUrl'] as string | undefined) ?? scheme.officialUrl;

  return {
    slug: scheme.id,
    title: scheme.title,
    shortDescription: scheme.shortDescription,
    fullDescription: scheme.shortDescription,
    type: scheme.schemeType.toLowerCase(),
    scope,
    state: scheme.state ?? null,
    authority: scheme.offeringAuthority,
    category: extractCategory(scheme),
    financialBenefit,
    deadline,
    isActive: true,
    officialUrl: scheme.officialUrl,
    applicationUrl,
    details,
    rules: scheme.rules,
    requiredDocuments,
    sources,
    trustData
  };
}

const UPSERT_SCHEME_SQL = `
  INSERT INTO schemes (
    slug,
    title,
    short_description,
    full_description,
    type,
    scope,
    state,
    authority,
    category,
    financial_benefit,
    deadline,
    is_active,
    official_url,
    application_url,
    details,
    rules,
    required_documents,
    sources,
    trust_data,
    updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    full_description = EXCLUDED.full_description,
    type = EXCLUDED.type,
    scope = EXCLUDED.scope,
    state = EXCLUDED.state,
    authority = EXCLUDED.authority,
    category = EXCLUDED.category,
    financial_benefit = EXCLUDED.financial_benefit,
    deadline = EXCLUDED.deadline,
    is_active = EXCLUDED.is_active,
    official_url = EXCLUDED.official_url,
    application_url = EXCLUDED.application_url,
    details = EXCLUDED.details,
    rules = EXCLUDED.rules,
    required_documents = EXCLUDED.required_documents,
    sources = EXCLUDED.sources,
    trust_data = EXCLUDED.trust_data,
    updated_at = NOW()
  RETURNING id, slug;
`;

/**
 * Validates and seeds scholarship schemes into the PostgreSQL database.
 */
export async function seedSchemes(options: SeedOptions = {}): Promise<SeedReport> {
  const dryRun = Boolean(options.dryRun || process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1');
  const silent = Boolean(options.silent);
  const schemesDir = options.schemesDir ?? path.resolve(__dirname, '../../../data/schemes');

  const log = (msg: string) => {
    if (!silent) console.log(msg);
  };
  const logErr = (msg: string) => {
    if (!silent) console.error(msg);
  };

  log(`[Scheme Seeder] Reading scheme datasets from ${schemesDir}...`);

  if (!fs.existsSync(schemesDir)) {
    throw new Error(`[Scheme Seeder] Directory not found: ${schemesDir}`);
  }

  const files = fs
    .readdirSync(schemesDir)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`[Scheme Seeder] No scheme JSON files found in ${schemesDir}`);
  }

  log(`[Scheme Seeder] Found ${files.length} scheme dataset file(s). Validating records...`);

  const validRecords: Array<{ file: string; record: DbSchemeRecord }> = [];
  const results: SeedRecordResult[] = [];
  let invalidCount = 0;

  for (const file of files) {
    const filePath = path.join(schemesDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);
      const validation = validateScheme(json);

      if (!validation.success || !validation.data) {
        invalidCount++;
        const errMsg = validation.errors?.join('; ') ?? 'Validation failed against schema';
        logErr(`[Scheme Seeder] Validation error in ${file}: ${errMsg}`);
        results.push({
          file,
          slug: json.id || json.slug || file,
          title: json.title || 'Unknown Title',
          status: 'failed',
          error: errMsg
        });
        continue;
      }

      const dbRecord = mapSchemeToDbRecord(validation.data);
      validRecords.push({ file, record: dbRecord });
    } catch (err) {
      invalidCount++;
      const errMsg = err instanceof Error ? err.message : String(err);
      logErr(`[Scheme Seeder] Syntax / Read error in ${file}: ${errMsg}`);
      results.push({
        file,
        slug: file,
        title: 'Unknown Title',
        status: 'failed',
        error: errMsg
      });
    }
  }

  if (invalidCount > 0 && !dryRun) {
    throw new Error(
      `[Scheme Seeder] Aborted seeding: ${invalidCount} dataset file(s) failed validation. Fix validation errors before writing to database.`
    );
  }

  // Obtain client
  let client: PoolClient;
  let shouldReleaseClient = false;

  if (options.client) {
    client = options.client;
  } else {
    try {
      client = await pool.connect();
      shouldReleaseClient = true;
    } catch (connErr) {
      const msg = connErr instanceof Error ? connErr.message : String(connErr);
      if (dryRun) {
        log(`[Scheme Seeder] Notice: Database unreachable in dry-run mode (${msg || 'offline'}). Proceeding with dataset validation report.`);
        log('[Scheme Seeder] DRY-RUN MODE: No database changes will be written.');
        for (const item of validRecords) {
          log(`[Scheme Seeder] [DRY-RUN] WOULD_INSERT: ${item.record.slug} ("${item.record.title}")`);
          results.push({
            file: item.file,
            slug: item.record.slug,
            title: item.record.title,
            status: 'would_insert'
          });
        }
        log(`[Scheme Seeder] DRY-RUN Summary: Valid=${validRecords.length}, WouldInsert=${validRecords.length}, WouldUpdate=0, Failed=${invalidCount}`);
        return {
          totalFiles: files.length,
          validCount: validRecords.length,
          invalidCount,
          insertedCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          failedCount: invalidCount,
          dryRun: true,
          results
        };
      }
      throw new Error(`[Scheme Seeder] Database connection failed: ${msg}`);
    }
  }

  try {
    // Check if schemes table exists
    const checkTableSql = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'schemes'
      ) AS table_exists;
    `;
    const tableRes = await client.query<{ table_exists: boolean }>(checkTableSql);
    const tableExists = Boolean(tableRes.rows[0]?.table_exists);

    if (!tableExists) {
      throw new Error(
        "[Scheme Seeder] Database schema is not migrated. Table 'schemes' does not exist. Please run migrations first (npm run migrate)."
      );
    }

    // Inspect existing slugs for idempotency accounting
    const slugs = validRecords.map((r) => r.record.slug);
    const existingRes = await client.query<{ slug: string }>(
      'SELECT slug FROM schemes WHERE slug = ANY($1::varchar[])',
      [slugs]
    );
    const existingSlugs = new Set(existingRes.rows.map((r) => r.slug));

    if (dryRun) {
      log('[Scheme Seeder] DRY-RUN MODE: No database changes will be written.');
      for (const item of validRecords) {
        const isExisting = existingSlugs.has(item.record.slug);
        const status = isExisting ? 'would_update' : 'would_insert';
        log(`[Scheme Seeder] [DRY-RUN] ${status.toUpperCase()}: ${item.record.slug} ("${item.record.title}")`);
        results.push({
          file: item.file,
          slug: item.record.slug,
          title: item.record.title,
          status
        });
      }

      const wouldInsert = results.filter((r) => r.status === 'would_insert').length;
      const wouldUpdate = results.filter((r) => r.status === 'would_update').length;

      log(`[Scheme Seeder] DRY-RUN Summary: Valid=${validRecords.length}, WouldInsert=${wouldInsert}, WouldUpdate=${wouldUpdate}, Failed=${invalidCount}`);

      return {
        totalFiles: files.length,
        validCount: validRecords.length,
        invalidCount,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: invalidCount,
        dryRun: true,
        results
      };
    }

    // Execute atomic upsert transaction
    await client.query('BEGIN');
    let insertedCount = 0;
    let updatedCount = 0;

    try {
      for (const item of validRecords) {
        const rec = item.record;
        const isExisting = existingSlugs.has(rec.slug);

        const params = [
          rec.slug,
          rec.title,
          rec.shortDescription,
          rec.fullDescription,
          rec.type,
          rec.scope,
          rec.state,
          rec.authority,
          rec.category,
          rec.financialBenefit,
          rec.deadline,
          rec.isActive,
          rec.officialUrl,
          rec.applicationUrl,
          JSON.stringify(rec.details),
          JSON.stringify(rec.rules),
          JSON.stringify(rec.requiredDocuments),
          JSON.stringify(rec.sources),
          JSON.stringify(rec.trustData)
        ];

        await client.query(UPSERT_SCHEME_SQL, params);

        if (isExisting) {
          updatedCount++;
          results.push({
            file: item.file,
            slug: rec.slug,
            title: rec.title,
            status: 'updated'
          });
          log(`[Scheme Seeder] UPDATED: ${rec.slug} ("${rec.title}")`);
        } else {
          insertedCount++;
          results.push({
            file: item.file,
            slug: rec.slug,
            title: rec.title,
            status: 'inserted'
          });
          log(`[Scheme Seeder] INSERTED: ${rec.slug} ("${rec.title}")`);
        }
      }

      await client.query('COMMIT');
      log(`[Scheme Seeder] Seeding successful! Inserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${invalidCount}`);

      return {
        totalFiles: files.length,
        validCount: validRecords.length,
        invalidCount,
        insertedCount,
        updatedCount,
        skippedCount: 0,
        failedCount: invalidCount,
        dryRun: false,
        results
      };
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }
  } finally {
    if (shouldReleaseClient) {
      client.release();
    }
  }
}

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const dirIndex = args.indexOf('--dir');
  const customDir = dirIndex !== -1 && args[dirIndex + 1] ? args[dirIndex + 1] : undefined;

  seedSchemes({ dryRun, schemesDir: customDir })
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Scheme Seeder] Fatal error:', err instanceof Error ? err.message : err);
      await pool.end();
      process.exit(1);
    });
}
