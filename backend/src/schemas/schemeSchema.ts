import { z } from 'zod';

export const schemeQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  scope: z.enum(['state', 'central']).optional(),
  state: z.string().optional(),
  authority: z.string().optional(),
  category: z.string().optional(),
  deadline: z.enum(['active_only', 'upcoming']).optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
  sortBy: z.enum(['deadline', 'title', 'created_at']).optional().default('title'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

export type SchemeQueryInput = z.infer<typeof schemeQuerySchema>;
