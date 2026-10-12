import { z } from 'zod';

export const evaluateEligibilitySchema = z.object({
  schemeSlug: z.string().trim().min(1, 'schemeSlug cannot be empty').optional(),
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'today must be in YYYY-MM-DD format')
    .optional()
});

export type EvaluateEligibilityInput = z.infer<typeof evaluateEligibilitySchema>;

export const explainEligibilitySchema = z.object({
  schemeSlug: z.string().trim().min(1, 'schemeSlug cannot be empty').optional(),
  language: z.enum(['en', 'kn', 'hi']).optional().default('en'),
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'today must be in YYYY-MM-DD format')
    .optional()
});

export type ExplainEligibilityInput = z.infer<typeof explainEligibilitySchema>;

