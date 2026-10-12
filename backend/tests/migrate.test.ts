import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoolClient } from 'pg';
import fs from 'fs';
import { runMigrations } from '../src/db/migrate';
import { pool } from '../src/db';

describe('Database Migration Runner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs cleanly when no pending migrations remain', async () => {
    // Mock client to return migration already applied
    const mockClient = {
      query: vi.fn().mockImplementation((queryText: string) => {
        if (queryText.includes('CREATE TABLE IF NOT EXISTS _schema_migrations')) {
          return Promise.resolve({ rows: [] });
        }
        if (queryText.includes('SELECT name FROM _schema_migrations')) {
          return Promise.resolve({ rows: [{ name: '001_initial_schema.sql' }] });
        }
        return Promise.resolve({ rows: [] });
      }),
      release: vi.fn()
    };

    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as unknown as PoolClient);

    const result = await runMigrations();

    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual(['001_initial_schema.sql']);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('applies pending migration files when not yet in tracking table', async () => {
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
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['001_initial_schema.sql'] as unknown as fs.Dirent[]);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('-- Mock SQL');

    const result = await runMigrations();

    expect(result.applied).toEqual(['001_initial_schema.sql']);
    expect(result.skipped).toEqual([]);
    expect(mockClient.release).toHaveBeenCalled();
  });
});
