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

export async function upsertUser(id: string, email?: string, authMode?: string): Promise<UserRecord> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    const existing = inMemoryUsers.get(id);
    const now = new Date().toISOString();
    const record: UserRecord = {
      id,
      email: email ?? existing?.email,
      authMode: authMode ?? existing?.authMode ?? 'demo',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    inMemoryUsers.set(id, record);
    return record;
  }

  const sql = `
    INSERT INTO users (id, email, auth_mode, updated_at)
    VALUES ($1, $2, COALESCE($3, 'demo'), NOW())
    ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, users.email),
        auth_mode = COALESCE($3, users.auth_mode),
        updated_at = NOW()
    RETURNING id, email, auth_mode AS "authMode", created_at AS "createdAt", updated_at AS "updatedAt"
  `;

  const res = await query<UserRecord>(sql, [id, email ?? null, authMode ?? null]);
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
