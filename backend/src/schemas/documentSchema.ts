import { z } from 'zod';

export const createDocumentSchema = z
  .object({
    type: z.string().trim().min(1, 'Document type is required').max(100),
    issuer: z.string().trim().min(1, 'Issuer is required').max(255),
    issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'issuedOn must be YYYY-MM-DD format'),
    validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validUntil must be YYYY-MM-DD format').optional().nullable(),
    notes: z.string().max(1000).optional().nullable()
  })
  .passthrough()
  .superRefine((data, ctx) => {
    const rawKeys = ['file', 'fileContent', 'base64', 'content', 'buffer'];
    for (const key of rawKeys) {
      if (key in data && data[key as keyof typeof data] !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Raw certificate files/payloads are strictly forbidden. Only document metadata is accepted.',
          path: [key]
        });
      }
    }
  });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
