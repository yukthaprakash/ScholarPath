import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z
      .string()
      .default('3001')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
        message: 'PORT must be a valid port number between 1 and 65535'
      }),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    DATABASE_URL: z
      .string()
      .default('postgresql://postgres:postgres@localhost:5432/scholarpath_dev'),
    DATABASE_POOL_MIN: z
      .string()
      .default('2')
      .transform((val) => parseInt(val, 10)),
    DATABASE_POOL_MAX: z
      .string()
      .default('10')
      .transform((val) => parseInt(val, 10)),
    AUTH_MODE: z.enum(['demo', 'production']).default('demo'),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .default('900000')
      .transform((val) => parseInt(val, 10)),
    RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .default('100')
      .transform((val) => parseInt(val, 10)),
    GEMINI_API_KEY: z.string().optional()
  })
  .superRefine((data, ctx) => {
    // In production mode, Firebase credentials are required
    if (data.AUTH_MODE === 'production') {
      if (!data.FIREBASE_PROJECT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FIREBASE_PROJECT_ID is required when AUTH_MODE=production',
          path: ['FIREBASE_PROJECT_ID']
        });
      }
      if (!data.FIREBASE_CLIENT_EMAIL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FIREBASE_CLIENT_EMAIL is required when AUTH_MODE=production',
          path: ['FIREBASE_CLIENT_EMAIL']
        });
      }
      if (!data.FIREBASE_PRIVATE_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FIREBASE_PRIVATE_KEY is required when AUTH_MODE=production',
          path: ['FIREBASE_PRIVATE_KEY']
        });
      }
    }

    // In production environment, disallow wildcard CORS
    if (data.NODE_ENV === 'production' && data.CORS_ORIGIN === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wildcard CORS_ORIGIN is not permitted in production',
        path: ['CORS_ORIGIN']
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  const source = customEnv ?? process.env;
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Environment validation failed: ${errorDetails}`);
  }

  return result.data;
}

// Global cached validated environment
export const env = validateEnv();
