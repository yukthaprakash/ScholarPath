import { z } from 'zod';

export const createSessionSchema = z.object({
  idToken: z.string().optional()
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
