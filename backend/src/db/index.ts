import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Pool error listener to avoid unhandled process crashes
pool.on('error', (err) => {
  // Log message only, never log connection strings or credentials
  console.error('[DB] Unexpected error on idle client:', err.message);
});

/**
 * Safe query execution helper using parameterized queries.
 * Note: Query parameters are strictly NOT logged to prevent PII exposure.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'trace') {
    // Only log query structure and execution duration in debug mode. Never log params.
    console.debug(`[DB] Executed query in ${duration}ms (rows: ${res.rowCount})`);
  }

  return res;
}

/**
 * Database health check helper.
 * Executes a simple query to verify active connectivity.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1 AS alive');
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Graceful connection pool shutdown.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
