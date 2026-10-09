import { query, checkDatabaseHealth } from '../db';

export interface UserRecord {
  id: string;
  email?: string;
  authMode: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback for test environment when Postgres is not running
const inMemoryUsers = new Map<string, UserRecord>();

export async function upsertUser(id: string, email?: string, authMode = 'demo'): Promise<UserRecord> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    const existing = inMemoryUsers.get(id);
    const now = new Date().toISOString();
    const record: UserRecord = {
      id,
      email: email ?? existing?.email,
      authMode,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    inMemoryUsers.set(id, record);
    return record;
  }

  const sql = `
    INSERT INTO users (id, email, auth_mode, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, auth_mode = EXCLUDED.auth_mode, updated_at = NOW()
    RETURNING id, email, auth_mode AS "authMode", created_at AS "createdAt", updated_at AS "updatedAt"
  `;

  const res = await query<UserRecord>(sql, [id, email ?? null, authMode]);
  if (!res.rows[0]) {
    throw new Error('Failed to create or update user record in database');
  }
  return res.rows[0];
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    return inMemoryUsers.get(id) ?? null;
  }

  const sql = `
    SELECT id, email, auth_mode AS "authMode", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM users
    WHERE id = $1
  `;

  const res = await query<UserRecord>(sql, [id]);
  return res.rows[0] ?? null;
}
