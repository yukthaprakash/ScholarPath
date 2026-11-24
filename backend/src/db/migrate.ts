import fs from 'fs';
import path from 'path';
import { pool } from './index';

export async function runMigrations(): Promise<{ applied: string[]; skipped: string[] }> {
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const applied: string[] = [];
  const skipped: string[] = [];

  const client = await pool.connect();

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const { rows } = await client.query<{ name: string }>(
      'SELECT name FROM _schema_migrations ORDER BY id ASC'
    );
    const appliedSet = new Set(rows.map((r) => r.name));

    // 3. Read migration files in deterministic alphabetical order
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrate] No migrations directory found. Skipping.');
      return { applied, skipped };
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.log('[Migrate] No .sql migration files found in migrations directory.');
      return { applied, skipped };
    }

    // 4. Apply pending migrations sequentially within individual transactions
    for (const file of files) {
      if (appliedSet.has(file)) {
        skipped.push(file);
        continue;
      }

      console.log(`[Migrate] Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
        console.log(`[Migrate] Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migrate] Failed applying migration ${file}:`, err instanceof Error ? err.message : err);
        throw err;
      }
    }

    console.log(`[Migrate] Migration complete. Applied: ${applied.length}, Skipped: ${skipped.length}`);
    return { applied, skipped };
  } finally {
    client.release();
  }
}

// Allow CLI execution via `tsx src/db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migrate] Fatal migration error:', err);
      await pool.end();
      process.exit(1);
    });
}
