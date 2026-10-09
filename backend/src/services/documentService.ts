import { query, checkDatabaseHealth } from '../db';
import { CreateDocumentInput } from '../schemas/documentSchema';
import { NotFoundError, AuthorizationError } from '../errors/AppError';

export interface DocumentRecord {
  id: string;
  userId: string;
  type: string;
  issuer: string;
  issuedOn: string;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const inMemoryDocuments = new Map<string, DocumentRecord>();

export async function getDocumentsByUserId(userId: string): Promise<DocumentRecord[]> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    return Array.from(inMemoryDocuments.values()).filter((doc) => doc.userId === userId);
  }

  const sql = `
    SELECT
      id,
      user_id AS "userId",
      type,
      issuer,
      issued_on::text AS "issuedOn",
      valid_until::text AS "validUntil",
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM documents
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const res = await query<DocumentRecord>(sql, [userId]);
  return res.rows;
}

export async function createDocument(userId: string, input: CreateDocumentInput): Promise<DocumentRecord> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const doc: DocumentRecord = {
      id,
      userId,
      type: input.type,
      issuer: input.issuer,
      issuedOn: input.issuedOn,
      validUntil: input.validUntil ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    inMemoryDocuments.set(id, doc);
    return doc;
  }

  const sql = `
    INSERT INTO documents (user_id, type, issuer, issued_on, valid_until, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      user_id AS "userId",
      type,
      issuer,
      issued_on::text AS "issuedOn",
      valid_until::text AS "validUntil",
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const params = [
    userId,
    input.type,
    input.issuer,
    input.issuedOn,
    input.validUntil ?? null,
    input.notes ?? null
  ];

  const res = await query<DocumentRecord>(sql, params);
  if (!res.rows[0]) {
    throw new Error('Failed to create document record in database');
  }
  return res.rows[0];
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    const existing = inMemoryDocuments.get(documentId);
    if (!existing) {
      throw new NotFoundError(`Document with ID '${documentId}' not found`);
    }
    if (existing.userId !== userId) {
      throw new AuthorizationError('You do not have permission to delete this document');
    }
    inMemoryDocuments.delete(documentId);
    return;
  }

  // 1. Check existence and owner
  const checkSql = `SELECT user_id AS "userId" FROM documents WHERE id = $1`;
  const checkRes = await query<{ userId: string }>(checkSql, [documentId]);

  if (!checkRes.rows[0] || checkRes.rows.length === 0) {
    throw new NotFoundError(`Document with ID '${documentId}' not found`);
  }

  if (checkRes.rows[0].userId !== userId) {
    throw new AuthorizationError('You do not have permission to delete this document');
  }

  // 2. Delete document
  const deleteSql = `DELETE FROM documents WHERE id = $1 AND user_id = $2`;
  await query(deleteSql, [documentId, userId]);
}
