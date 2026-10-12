import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { createDocumentSchema } from '../schemas/documentSchema';
import { getDocumentsByUserId, createDocument, deleteDocument } from '../services/documentService';
import { AuthenticationError, NotFoundError } from '../errors/AppError';

export const documentRouter = Router();

/**
 * GET /documents
 * Retrieves document metadata for the authenticated user.
 */
documentRouter.get('/documents', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to access document metadata');
    }

    const documents = await getDocumentsByUserId(req.user.uid);

    res.status(200).json({
      documents
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /documents
 * Creates a new document metadata record.
 * Rejects raw files or binary content payloads.
 */
documentRouter.post('/documents', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to create document metadata');
    }

    const validatedInput = createDocumentSchema.parse(req.body);
    const document = await createDocument(req.user.uid, validatedInput);

    res.status(201).json({
      document
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /documents/:id
 * Deletes document metadata by ID.
 * Enforces ownership: only the owner can delete their document.
 */
documentRouter.delete('/documents/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to delete document metadata');
    }

    const documentId = req.params.id;
    if (!documentId) {
      throw new NotFoundError('Document ID parameter is required');
    }
    await deleteDocument(req.user.uid, documentId);

    res.status(200).json({
      success: true,
      message: 'Document metadata deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});
