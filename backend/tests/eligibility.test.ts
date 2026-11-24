import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { upsertProfile } from '../src/services/profileService';
import { createDocument } from '../src/services/documentService';
import * as envModule from '../src/config/env';

describe('POST /eligibility/evaluate Endpoint', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('evaluates all schemes successfully for authenticated demo user with complete profile', async () => {
    const demoUserId = 'eval-test-user-001';

    // Seed profile in in-memory store
    await upsertProfile(demoUserId, {
      fullName: 'Sunita Sharma',
      dateOfBirth: '2005-08-10',
      gender: 'FEMALE',
      category: 'GENERAL',
      domicileState: 'KARNATAKA',
      annualFamilyIncome: 200000,
      educationLevel: 'UNDERGRADUATE',
      currentCourse: 'BSc Physics',
      courseYear: 1,
      academicPercentage: 88,
      instituteState: 'KARNATAKA'
    });

    // Seed required documents
    await createDocument(demoUserId, {
      type: 'INCOME_CERTIFICATE',
      issuer: 'Revenue Department',
      issuedOn: '2026-05-01',
      validUntil: '2027-05-01'
    });
    await createDocument(demoUserId, {
      type: 'MARKSHEET',
      issuer: 'PUC Board',
      issuedOn: '2025-06-01'
    });

    const response = await request(app)
      .post('/eligibility/evaluate')
      .set('x-demo-user-id', demoUserId)
      .send({
        today: '2026-10-05'
      });

    expect(response.status).toBe(200);
    expect(response.body.studentId).toBe(demoUserId);
    expect(response.body.summary).toBeDefined();
    expect(response.body.summary.eligibleCount).toBeGreaterThanOrEqual(1);
    expect(response.body.matches).toBeInstanceOf(Array);
    expect(response.body.matches.length).toBeGreaterThanOrEqual(6);

    // NSP Central Sector UG should be ELIGIBLE for this student
    const centralSectorMatch = response.body.matches.find(
      (m: { schemeId: string }) => m.schemeId === 'nsp-central-sector-ug'
    );
    expect(centralSectorMatch).toBeDefined();
    expect(centralSectorMatch.state).toBe('ELIGIBLE');
    expect(centralSectorMatch.trustScore).toBeDefined();
  });

  it('evaluates a single scheme when schemeSlug is provided and reflects NEARLY_ELIGIBLE when income cert is missing', async () => {
    const demoUserId = 'eval-test-sc-nearmiss';

    // SC student eligible for PMS-SC, but missing income certificate
    await upsertProfile(demoUserId, {
      fullName: 'Anil Kumar',
      dateOfBirth: '2006-02-14',
      gender: 'MALE',
      category: 'SC',
      domicileState: 'KARNATAKA',
      annualFamilyIncome: 150000,
      educationLevel: 'UNDERGRADUATE',
      currentCourse: 'BA History',
      courseYear: 2,
      academicPercentage: 72,
      instituteState: 'KARNATAKA'
    });

    // Only Caste certificate provided (Income certificate missing)
    await createDocument(demoUserId, {
      type: 'CASTE_CERTIFICATE',
      issuer: 'Tahsildar',
      issuedOn: '2026-01-01',
      validUntil: '2030-01-01'
    });
    await createDocument(demoUserId, {
      type: 'MARKSHEET',
      issuer: 'Board',
      issuedOn: '2025-05-01'
    });

    const response = await request(app)
      .post('/eligibility/evaluate')
      .set('x-demo-user-id', demoUserId)
      .send({
        schemeSlug: 'nsp-post-matric-sc',
        today: '2026-10-05'
      });

    expect(response.status).toBe(200);
    expect(response.body.matches.length).toBe(1);
    expect(response.body.matches[0].schemeId).toBe('nsp-post-matric-sc');
    expect(response.body.matches[0].state).toBe('NEARLY_ELIGIBLE');
    expect(response.body.summary.nearlyEligibleCount).toBe(1);
    expect(response.body.matches[0].missingActionableRules.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 404 NOT_FOUND when student profile does not exist', async () => {
    const unknownUserId = 'non-existent-user-999';

    const response = await request(app)
      .post('/eligibility/evaluate')
      .set('x-demo-user-id', unknownUserId)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toContain('Student profile not found');
  });

  it('returns 404 NOT_FOUND when requested schemeSlug does not exist', async () => {
    const demoUserId = 'user-valid-profile';

    await upsertProfile(demoUserId, {
      fullName: 'Test User',
      educationLevel: 'UNDERGRADUATE'
    });

    const response = await request(app)
      .post('/eligibility/evaluate')
      .set('x-demo-user-id', demoUserId)
      .send({
        schemeSlug: 'non-existent-scheme-999'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toContain("Scheme with slug 'non-existent-scheme-999' not found");
  });

  it('returns 400 VALIDATION_ERROR when input payload is malformed', async () => {
    const demoUserId = 'user-malformed-test';

    await upsertProfile(demoUserId, {
      fullName: 'Test User',
      educationLevel: 'UNDERGRADUATE'
    });

    const response = await request(app)
      .post('/eligibility/evaluate')
      .set('x-demo-user-id', demoUserId)
      .send({
        today: 'not-a-valid-date' // Fails YYYY-MM-DD regex
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests in production mode with 401', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'production'
    });

    const response = await request(app)
      .post('/eligibility/evaluate')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
