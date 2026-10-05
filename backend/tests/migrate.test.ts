import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoolClient } from 'pg';
import { runMigrations } from '../src/db/migrate';
import { pool } from '../src/db';

describe('Database Migration Runner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs cleanly when no .sql files are present in migrations directory', async () => {
    // Mock client to verify tracking table check
    const mockClient = {
      query: vi.fn().mockImplementation((queryText: string) => {
        if (queryText.includes('CREATE TABLE IF NOT EXISTS _schema_migrations')) {
          return Promise.resolve({ rows: [] });
        }
        if (queryText.includes('SELECT name FROM _schema_migrations')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }),
      release: vi.fn()
    };

    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

    const result = await runMigrations();

    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(mockClient.release).toHaveBeenCalled();
  });
});
