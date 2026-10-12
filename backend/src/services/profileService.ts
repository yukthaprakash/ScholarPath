import { query, checkDatabaseHealth } from '../db';
import { UpdateProfileInput } from '../schemas/profileSchema';

export interface ProfileRecord {
  id?: string;
  userId: string;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  category?: string | null;
  religion?: string | null;
  domicileState?: string | null;
  isDifferentlyAbled?: boolean;
  disabilityPercentage?: number | null;
  annualFamilyIncome?: number | null;
  educationLevel?: string | null;
  currentCourse?: string | null;
  courseYear?: number | null;
  academicPercentage?: number | null;
  instituteName?: string | null;
  instituteState?: string | null;
  isSingleGirlChild?: boolean;
  parentOccupation?: string | null;
  extraAttributes?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

const inMemoryProfiles = new Map<string, ProfileRecord>();

export async function getProfileByUserId(userId: string): Promise<ProfileRecord | null> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    return inMemoryProfiles.get(userId) ?? null;
  }

  const sql = `
    SELECT
      id,
      user_id AS "userId",
      full_name AS "fullName",
      date_of_birth::text AS "dateOfBirth",
      gender,
      category,
      religion,
      domicile_state AS "domicileState",
      is_differently_abled AS "isDifferentlyAbled",
      disability_percentage AS "disabilityPercentage",
      annual_family_income AS "annualFamilyIncome",
      education_level AS "educationLevel",
      current_course AS "currentCourse",
      course_year AS "courseYear",
      academic_percentage AS "academicPercentage",
      institute_name AS "instituteName",
      institute_state AS "instituteState",
      is_single_girl_child AS "isSingleGirlChild",
      parent_occupation AS "parentOccupation",
      extra_attributes AS "extraAttributes",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM profiles
    WHERE user_id = $1
  `;

  const res = await query<ProfileRecord>(sql, [userId]);
  return res.rows[0] ?? null;
}

export async function upsertProfile(userId: string, input: UpdateProfileInput): Promise<ProfileRecord> {
  const isDbHealthy = await checkDatabaseHealth();

  if (!isDbHealthy) {
    const existing = inMemoryProfiles.get(userId) ?? { userId };
    const updated: ProfileRecord = {
      ...existing,
      ...input,
      userId,
      updatedAt: new Date().toISOString()
    };
    inMemoryProfiles.set(userId, updated);
    return updated;
  }

  const sql = `
    INSERT INTO profiles (
      user_id, full_name, date_of_birth, gender, category, religion,
      domicile_state, is_differently_abled, disability_percentage,
      annual_family_income, education_level, current_course, course_year,
      academic_percentage, institute_name, institute_state, is_single_girl_child,
      parent_occupation, extra_attributes, updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
      gender = COALESCE(EXCLUDED.gender, profiles.gender),
      category = COALESCE(EXCLUDED.category, profiles.category),
      religion = COALESCE(EXCLUDED.religion, profiles.religion),
      domicile_state = COALESCE(EXCLUDED.domicile_state, profiles.domicile_state),
      is_differently_abled = COALESCE(EXCLUDED.is_differently_abled, profiles.is_differently_abled),
      disability_percentage = COALESCE(EXCLUDED.disability_percentage, profiles.disability_percentage),
      annual_family_income = COALESCE(EXCLUDED.annual_family_income, profiles.annual_family_income),
      education_level = COALESCE(EXCLUDED.education_level, profiles.education_level),
      current_course = COALESCE(EXCLUDED.current_course, profiles.current_course),
      course_year = COALESCE(EXCLUDED.course_year, profiles.course_year),
      academic_percentage = COALESCE(EXCLUDED.academic_percentage, profiles.academic_percentage),
      institute_name = COALESCE(EXCLUDED.institute_name, profiles.institute_name),
      institute_state = COALESCE(EXCLUDED.institute_state, profiles.institute_state),
      is_single_girl_child = COALESCE(EXCLUDED.is_single_girl_child, profiles.is_single_girl_child),
      parent_occupation = COALESCE(EXCLUDED.parent_occupation, profiles.parent_occupation),
      extra_attributes = COALESCE(EXCLUDED.extra_attributes, profiles.extra_attributes),
      updated_at = NOW()
    RETURNING
      id,
      user_id AS "userId",
      full_name AS "fullName",
      date_of_birth::text AS "dateOfBirth",
      gender,
      category,
      religion,
      domicile_state AS "domicileState",
      is_differently_abled AS "isDifferentlyAbled",
      disability_percentage AS "disabilityPercentage",
      annual_family_income AS "annualFamilyIncome",
      education_level AS "educationLevel",
      current_course AS "currentCourse",
      course_year AS "courseYear",
      academic_percentage AS "academicPercentage",
      institute_name AS "instituteName",
      institute_state AS "instituteState",
      is_single_girl_child AS "isSingleGirlChild",
      parent_occupation AS "parentOccupation",
      extra_attributes AS "extraAttributes",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const params = [
    userId,
    input.fullName ?? null,
    input.dateOfBirth ?? null,
    input.gender ?? null,
    input.category ?? null,
    input.religion ?? null,
    input.domicileState ?? null,
    input.isDifferentlyAbled ?? false,
    input.disabilityPercentage ?? null,
    input.annualFamilyIncome ?? null,
    input.educationLevel ?? null,
    input.currentCourse ?? null,
    input.courseYear ?? null,
    input.academicPercentage ?? null,
    input.instituteName ?? null,
    input.instituteState ?? null,
    input.isSingleGirlChild ?? false,
    input.parentOccupation ?? null,
    input.extraAttributes ? JSON.stringify(input.extraAttributes) : '{}'
  ];

  const res = await query<ProfileRecord>(sql, params);
  if (!res.rows[0]) {
    throw new Error('Failed to create or update profile record in database');
  }
  return res.rows[0];
}
