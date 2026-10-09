import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(255).optional().nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS']).optional().nullable(),
  religion: z.enum(['HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER']).optional().nullable(),
  domicileState: z.string().trim().min(1).optional().nullable(),
  isDifferentlyAbled: z.boolean().optional(),
  disabilityPercentage: z.number().min(0).max(100).optional().nullable(),
  annualFamilyIncome: z.number().min(0).optional().nullable(),
  educationLevel: z.enum(['class_10', 'class_12', 'undergraduate', 'postgraduate', 'diploma', 'phd']).optional().nullable(),
  currentCourse: z.string().trim().optional().nullable(),
  courseYear: z.number().int().min(1).max(10).optional().nullable(),
  academicPercentage: z.number().min(0).max(100).optional().nullable(),
  instituteName: z.string().trim().optional().nullable(),
  instituteState: z.string().trim().optional().nullable(),
  isSingleGirlChild: z.boolean().optional(),
  parentOccupation: z.string().trim().optional().nullable(),
  extraAttributes: z.record(z.unknown()).optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
