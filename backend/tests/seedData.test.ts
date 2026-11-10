import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { PoolClient } from 'pg';
import {
  seedSchemes,
  mapSchemeToDbRecord,
  extractCategory
} from '../src/cli/seedData';
import { pool } from '../src/db';
import { Scheme } from '@scholarpath/engine';

describe('Scheme Database Seeder (seedData.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const schemesDir = path.resolve(__dirname, '../../data/schemes');

  describe('Dataset Reading and Record Mapping', () => {
    it('validates and maps all canonical schemes in data/schemes', () => {
      const files = fs.readdirSync(schemesDir).filter((f) => f.endsWith('.json'));
      expect(files.length).toBe(6);

      for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(path.join(schemesDir, file), 'utf-8'));
        const dbRecord = mapSchemeToDbRecord(raw as Scheme);

        expect(dbRecord.slug).toBe(raw.id);
        expect(dbRecord.title).toBe(raw.title);
        expect(dbRecord.shortDescription).toBe(raw.shortDescription);
        expect(dbRecord.type).toBe(raw.schemeType.toLowerCase());
        expect(['state', 'central']).toContain(dbRecord.scope);
        expect(dbRecord.authority).toBe(raw.offeringAuthority);
        expect(dbRecord.isActive).toBe(true);
        expect(dbRecord.officialUrl).toBe(raw.officialUrl);
        expect(dbRecord.applicationUrl).toBe(raw.applicationUrl || raw.officialUrl);
        expect(dbRecord.details).toBeDefined();
        expect(Array.isArray(dbRecord.rules)).toBe(true);
        expect(Array.isArray(dbRecord.requiredDocuments)).toBe(true);
        expect(Array.isArray(dbRecord.sources)).toBe(true);
        expect(dbRecord.trustData).toBeDefined();
      }
    });

    it('correctly maps state scope for state schemes', () => {
      const rawKarnataka = JSON.parse(
        fs.readFileSync(path.join(schemesDir, 'karnataka-ssp-post-matric.json'), 'utf-8')
      );
      const record = mapSchemeToDbRecord(rawKarnataka as Scheme);

      expect(record.scope).toBe('state');
      expect(record.state).toBe('KARNATAKA');
    });

    it('correctly maps central scope for national schemes', () => {
      const rawNsp = JSON.parse(
        fs.readFileSync(path.join(schemesDir, 'nsp-central-sector-ug.json'), 'utf-8')
      );
      const record = mapSchemeToDbRecord(rawNsp as Scheme);

      expect(record.scope).toBe('central');
      expect(record.state).toBeNull();
    });

    it('extracts categories from rules and attributes', () => {
      const mockScheme = (rules: Array<{ key: string; expectedValue: unknown }>, extra: Record<string, unknown> = {}): Scheme =>
        ({
          id: 'test-scheme',
          title: 'Test Scheme',
          shortDescription: 'Desc',
          offeringAuthority: 'Auth',
          authorityType: 'CENTRAL_GOVT',
          schemeType: 'SCHOLARSHIP',
          benefitDetails: { description: 'Rs 10,000' },
          applicationWindow: { startDate: '2026-01-01', endDate: '2026-12-31', academicYear: '2026-27' },
          officialUrl: 'https://example.com',
          sourceCitation: { portalName: 'P', url: 'https://example.com', tier: 1, clauseRef: 'C1', verifiedDate: '2026-01-01' },
          rules,
          requiredCertificates: [],
          isDemo: false,
          version: '1.0',
          ...extra
        } as unknown as Scheme);

      expect(extractCategory(mockScheme([{ key: 'personal.casteCategory', expectedValue: 'SC' }]))).toBe('SC');
      expect(extractCategory(mockScheme([{ key: 'personal.isSingleGirlChild', expectedValue: true }]))).toBe('SINGLE_GIRL_CHILD');
      expect(extractCategory(mockScheme([{ key: 'personal.gender', expectedValue: 'FEMALE' }]))).toBe('FEMALE');
      expect(extractCategory(mockScheme([], { category: 'OBC' }))).toBe('OBC');
    });
  });

  describe('Dry-Run Mode', () => {
    it('validates datasets and reports would_insert without executing any SQL writes', async () => {
      const executedQueries: string[] = [];
      const mockClient = {
        query: vi.fn().mockImplementation((queryText: string) => {
          executedQueries.push(queryText);
          if (queryText.includes('information_schema.tables')) {
            return Promise.resolve({ rows: [{ table_exists: true }] });
          }
          if (queryText.includes('SELECT slug FROM schemes')) {
            return Promise.resolve({ rows: [] }); // None exist yet
          }
          return Promise.resolve({ rows: [] });
        }),
        release: vi.fn()
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

      const report = await seedSchemes({ dryRun: true, silent: true });

      expect(report.dryRun).toBe(true);
      expect(report.validCount).toBe(6);
      expect(report.invalidCount).toBe(0);
      expect(report.insertedCount).toBe(0);
      expect(report.updatedCount).toBe(0);
      expect(report.results.every((r) => r.status === 'would_insert')).toBe(true);

      // Verify no transaction or write statements occurred
      expect(executedQueries.some((q) => q.includes('BEGIN'))).toBe(false);
      expect(executedQueries.some((q) => q.includes('INSERT INTO schemes'))).toBe(false);
      expect(executedQueries.some((q) => q.includes('COMMIT'))).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('reports would_update in dry-run mode when slugs already exist in database', async () => {
      const mockClient = {
        query: vi.fn().mockImplementation((queryText: string) => {
          if (queryText.includes('information_schema.tables')) {
            return Promise.resolve({ rows: [{ table_exists: true }] });
          }
          if (queryText.includes('SELECT slug FROM schemes')) {
            return Promise.resolve({
              rows: [{ slug: 'aicte-pragati-degree' }, { slug: 'karnataka-ssp-post-matric' }]
            });
          }
          return Promise.resolve({ rows: [] });
        }),
        release: vi.fn()
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

      const report = await seedSchemes({ dryRun: true, silent: true });

      const wouldUpdate = report.results.filter((r) => r.status === 'would_update');
      const wouldInsert = report.results.filter((r) => r.status === 'would_insert');

      expect(wouldUpdate.length).toBe(2);
      expect(wouldInsert.length).toBe(4);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('handles database unreachable in dry-run mode gracefully', async () => {
      vi.spyOn(pool, 'connect').mockRejectedValue(new Error('Connection refused'));

      const report = await seedSchemes({ dryRun: true, silent: true });

      expect(report.dryRun).toBe(true);
      expect(report.validCount).toBe(6);
      expect(report.invalidCount).toBe(0);
      expect(report.results.every((r) => r.status === 'would_insert')).toBe(true);
    });
  });

  describe('Database Seeding Execution and Idempotency', () => {
    it('inserts all schemes in an atomic transaction when table is empty', async () => {
      const executedQueries: Array<{ sql: string; params?: unknown[] }> = [];
      const mockClient = {
        query: vi.fn().mockImplementation((queryText: string, params?: unknown[]) => {
          executedQueries.push({ sql: queryText, params });
          if (queryText.includes('information_schema.tables')) {
            return Promise.resolve({ rows: [{ table_exists: true }] });
          }
          if (queryText.includes('SELECT slug FROM schemes')) {
            return Promise.resolve({ rows: [] });
          }
          return Promise.resolve({ rows: [{ id: 'mock-uuid', slug: params?.[0] }] });
        }),
        release: vi.fn()
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

      const report = await seedSchemes({ dryRun: false, silent: true });

      expect(report.dryRun).toBe(false);
      expect(report.insertedCount).toBe(6);
      expect(report.updatedCount).toBe(0);
      expect(report.failedCount).toBe(0);

      // Verify BEGIN -> 6 INSERTs -> COMMIT sequence
      const sqlList = executedQueries.map((q) => q.sql.trim());
      expect(sqlList.includes('BEGIN')).toBe(true);
      expect(sqlList.includes('COMMIT')).toBe(true);

      const insertCalls = executedQueries.filter((q) => q.sql.includes('INSERT INTO schemes'));
      expect(insertCalls.length).toBe(6);

      // Verify parameterized queries (no string concatenation of values)
      for (const call of insertCalls) {
        expect(call.params).toBeDefined();
        expect(call.params!.length).toBe(19);
      }

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('updates existing schemes idempotently without duplication', async () => {
      const mockClient = {
        query: vi.fn().mockImplementation((queryText: string, params?: unknown[]) => {
          if (queryText.includes('information_schema.tables')) {
            return Promise.resolve({ rows: [{ table_exists: true }] });
          }
          if (queryText.includes('SELECT slug FROM schemes')) {
            // All 6 already exist in database
            return Promise.resolve({
              rows: [
                { slug: 'aicte-pragati-degree' },
                { slug: 'karnataka-ssp-post-matric' },
                { slug: 'nsp-central-sector-ug' },
                { slug: 'nsp-post-matric-sc' },
                { slug: 'nsp-post-matric-st' },
                { slug: 'ugc-single-girl-child-pg' }
              ]
            });
          }
          return Promise.resolve({ rows: [{ id: 'mock-uuid', slug: params?.[0] }] });
        }),
        release: vi.fn()
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

      const report = await seedSchemes({ dryRun: false, silent: true });

      expect(report.dryRun).toBe(false);
      expect(report.insertedCount).toBe(0);
      expect(report.updatedCount).toBe(6);
      expect(report.failedCount).toBe(0);
      expect(report.results.every((r) => r.status === 'updated')).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('rolls back transaction on SQL execution error', async () => {
      const executedQueries: string[] = [];
      const mockClient = {
        query: vi.fn().mockImplementation((queryText: string) => {
          executedQueries.push(queryText.trim());
          if (queryText.includes('information_schema.tables')) {
            return Promise.resolve({ rows: [{ table_exists: true }] });
          }
          if (queryText.includes('SELECT slug FROM schemes')) {
            return Promise.resolve({ rows: [] });
          }
          if (queryText.includes('INSERT INTO schemes')) {
            return Promise.reject(new Error('Simulated DB constraint error'));
          }
          return Promise.resolve({ rows: [] });
        }),
        release: vi.fn()
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

      await expect(seedSchemes({ dryRun: false, silent: true })).rejects.toThrow(
        'Simulated DB constraint error'
      );

      expect(executedQueries.includes('BEGIN')).toBe(true);
      expect(executedQueries.includes('ROLLBACK')).toBe(true);
      expect(executedQueries.includes('COMMIT')).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Error Conditions and Safety Guards', () => {
    it('fails with descriptive error if schemes table is not migrated', async () => {
      const mockClient = {
        query: vi.fn().mockImplementation((queryText: string) => {
          if (queryText.includes('information_schema.tables')) {
            return Promise.resolve({ rows: [{ table_exists: false }] });
          }
          return Promise.resolve({ rows: [] });
        }),
        release: vi.fn()
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

      await expect(seedSchemes({ dryRun: false, silent: true })).rejects.toThrow(
        /Database schema is not migrated.*Table 'schemes' does not exist/
      );

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('fails with clear error if database connection cannot be established', async () => {
      vi.spyOn(pool, 'connect').mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

      await expect(seedSchemes({ dryRun: false, silent: true })).rejects.toThrow(
        /Database connection failed/
      );
    });

    it('aborts without writing when invalid dataset file is encountered in non-dry-run mode', async () => {
      const tempDir = path.resolve(__dirname, '../../data/temp_test_invalid_schemes');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'invalid.json'), '{ "bad": "data" }');

      try {
        await expect(
          seedSchemes({ dryRun: false, schemesDir: tempDir, silent: true })
        ).rejects.toThrow(/Aborted seeding: 1 dataset file\(s\) failed validation/);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
