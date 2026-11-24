import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { upsertProfile } from '../src/services/profileService';
import { createDocument } from '../src/services/documentService';
import * as envModule from '../src/config/env';

describe('POST /eligibility/explain Endpoint', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      GEMINI_API_KEY: 'test-gemini-api-key'
    });
  });

  const setupEligibleStudent = async (userId: string) => {
    await upsertProfile(userId, {
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

    await createDocument(userId, {
      type: 'INCOME_CERTIFICATE',
      issuer: 'Revenue Department',
      issuedOn: '2026-05-01',
      validUntil: '2027-05-01'
    });
    await createDocument(userId, {
      type: 'MARKSHEET',
      issuer: 'PUC Board',
      issuedOn: '2025-06-01'
    });
  };

  const setupNearlyEligibleStudent = async (userId: string) => {
    // SC student missing income certificate for PMS-SC
    await upsertProfile(userId, {
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

    await createDocument(userId, {
      type: 'CASTE_CERTIFICATE',
      issuer: 'Tahsildar',
      issuedOn: '2026-01-01',
      validUntil: '2030-01-01'
    });
    await createDocument(userId, {
      type: 'MARKSHEET',
      issuer: 'Board',
      issuedOn: '2025-05-01'
    });
  };

  describe('1. Authentication and Authorization', () => {
    it('returns 401 when request is unauthenticated in production mode', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'production',
        GEMINI_API_KEY: 'test-gemini-api-key'
      });

      const response = await request(app)
        .post('/eligibility/explain')
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('returns 404 when student has no profile', async () => {
      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', 'non-existent-user-without-profile')
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Student profile not found');
    });
  });

  describe('2. Input Validation', () => {
    it('returns 400 for invalid language option', async () => {
      const userId = 'input-val-user-001';
      await setupEligibleStudent(userId);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ language: 'fr' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid date format in today field', async () => {
      const userId = 'input-val-user-002';
      await setupEligibleStudent(userId);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ today: '05-10-2026' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when requesting explanation for non-existent scheme', async () => {
      const userId = 'input-val-user-003';
      await setupEligibleStudent(userId);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'non-existent-scheme-slug-1234' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('3. AI Explanation Success (Grounded Output)', () => {
    it('generates a successful explanation for an eligible match using AI', async () => {
      const userId = 'ai-success-user-001';
      await setupEligibleStudent(userId);

      // Mock Gemini API with grounded valid response
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'You satisfy all verified criteria for the Central Sector Scheme of Scholarships with Rs 12000 per annum. Apply before 2026-10-31 on https://scholarships.gov.in'
                  }
                ]
              }
            }
          ]
        })
      } as unknown as Response);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({
          schemeSlug: 'nsp-central-sector-ug',
          language: 'en'
        });

      expect(response.status).toBe(200);
      expect(response.body.schemeId).toBe('nsp-central-sector-ug');
      expect(response.body.state).toBe('ELIGIBLE');
      expect(response.body.isEligible).toBe(true);
      expect(response.body.isFallback).toBe(false);
      expect(response.body.explanation).toContain('Central Sector Scheme of Scholarships');
      expect(response.body.explanation).toContain('12000');
      expect(response.body.financialBenefit).toBe(12000);
      expect(response.body.deadline).toBe('2026-10-31');
      expect(response.body.officialUrl).toBe('https://scholarships.gov.in');

      // Verify requirement details
      expect(response.body.details).toBeDefined();
      expect(response.body.details.satisfiedRequirements.length).toBeGreaterThan(0);
      expect(response.body.details.failedRequirements.length).toBe(0);
      expect(response.body.details.nextSteps.length).toBeGreaterThan(0);
    });

    it('generates explanations for all evaluated schemes when schemeSlug is omitted', async () => {
      const userId = 'ai-success-portfolio-001';
      await setupEligibleStudent(userId);

      // Mock Gemini API for portfolio evaluation
      vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Your profile has been assessed against verified criteria.'
                    }
                  ]
                }
              }
            ]
          })
        } as unknown as Response)
      );

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ language: 'en' });

      expect(response.status).toBe(200);
      expect(response.body.studentId).toBe(userId);
      expect(response.body.summary).toBeDefined();
      expect(response.body.explanations).toBeInstanceOf(Array);
      expect(response.body.explanations.length).toBeGreaterThanOrEqual(6);

      for (const item of response.body.explanations) {
        expect(item.schemeId).toBeDefined();
        expect(item.state).toBeDefined();
        expect(item.explanation).toBeDefined();
        expect(item.details).toBeDefined();
        expect(Array.isArray(item.details.nextSteps)).toBe(true);
      }
    });
  });

  describe('4. AI Failures and Fallback Mechanism', () => {
    it('uses deterministic fallback when GEMINI_API_KEY is not configured', async () => {
      const userId = 'ai-no-key-user-001';
      await setupEligibleStudent(userId);

      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        GEMINI_API_KEY: undefined
      });

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(200);
      expect(response.body.isFallback).toBe(true);
      expect(response.body.reason).toContain('GEMINI_API_KEY not configured');
      expect(response.body.explanation).toContain('Central Sector Scheme');
      expect(response.body.explanation).toContain('12000');
      expect(response.body.details.nextSteps.length).toBeGreaterThan(0);
    });

    it('falls back gracefully when Gemini API returns HTTP 500 error', async () => {
      const userId = 'ai-http-error-user-001';
      await setupEligibleStudent(userId);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500
      } as unknown as Response);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(200);
      expect(response.body.isFallback).toBe(true);
      expect(response.body.reason).toContain('Gemini API HTTP Error 500');
      expect(response.body.explanation).toContain('Central Sector Scheme');
    });

    it('falls back gracefully when Gemini request times out or aborts', async () => {
      const userId = 'ai-timeout-user-001';
      await setupEligibleStudent(userId);

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(200);
      expect(response.body.isFallback).toBe(true);
      expect(response.body.reason).toContain('AI request timed out');
      expect(response.body.explanation).toContain('Central Sector Scheme');
    });

    it('rejects hallucinated approval claims via Answer Guard and falls back safely', async () => {
      const userId = 'ai-guard-user-001';
      await setupEligibleStudent(userId);

      // LLM tries to make a prohibited guarantee
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Congratulations! You are approved and 100% guaranteed to definitely get the money sanction approved.'
                  }
                ]
              }
            }
          ]
        })
      } as unknown as Response);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(200);
      expect(response.body.isFallback).toBe(true);
      expect(response.body.reason).toContain('Answer Guard Rejection');
      expect(response.body.reason).toContain('Prohibited claim detected');
      // Must not contain the prohibited claim in final response
      expect(response.body.explanation).not.toContain('100% guaranteed');
      expect(response.body.explanation).toContain('Central Sector Scheme');
    });

    it('rejects hallucinated URLs via Answer Guard and falls back safely', async () => {
      const userId = 'ai-guard-url-001';
      await setupEligibleStudent(userId);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Please visit http://phishing-scam-scholarships.org/apply to submit your form.'
                  }
                ]
              }
            }
          ]
        })
      } as unknown as Response);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'nsp-central-sector-ug' });

      expect(response.status).toBe(200);
      expect(response.body.isFallback).toBe(true);
      expect(response.body.reason).toContain('Answer Guard Rejection');
      expect(response.body.reason).toContain('Ungrounded URL');
      expect(response.body.explanation).not.toContain('phishing-scam-scholarships.org');
    });
  });

  describe('5. Authoritative Engine Decision and Consistency Guards', () => {
    it('accurately explains NEARLY_ELIGIBLE state with missing actionable requirements', async () => {
      const userId = 'ai-nearly-user-001';
      await setupNearlyEligibleStudent(userId);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'nsp-post-matric-sc' });

      expect(response.status).toBe(200);
      expect(response.body.schemeId).toBe('nsp-post-matric-sc');
      expect(response.body.state).toBe('NEARLY_ELIGIBLE');
      expect(response.body.isEligible).toBe(false);
      expect(response.body.explanation).toContain('Nearly Eligible');
      expect(response.body.details.missingActionableDocuments.length).toBeGreaterThan(0);
      expect(response.body.details.nextSteps.some((s: string) => s.includes('Income Certificate'))).toBe(true);
    });

    it('overrides AI response if it contradicts engine state by claiming eligibility for NOT_MATCHED scheme', async () => {
      const userId = 'ai-contradict-user-001';
      // General category male student does NOT match girl child scholarship
      await setupEligibleStudent(userId);

      // Student is Male, attempting to explain ugc-single-girl-child-pg (which requires female single girl child)
      // Mock AI trying to contradict the engine:
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Great news! You are eligible for this scholarship and satisfy all criteria.'
                  }
                ]
              }
            }
          ]
        })
      } as unknown as Response);

      const response = await request(app)
        .post('/eligibility/explain')
        .set('x-demo-user-id', userId)
        .send({ schemeSlug: 'ugc-single-girl-child-pg' });

      expect(response.status).toBe(200);
      expect(response.body.state).toBe('NOT_MATCHED');
      expect(response.body.isEligible).toBe(false);
      // Engine consistency guard must have kicked in
      expect(response.body.isFallback).toBe(true);
      expect(response.body.reason).toContain('AI output claimed eligibility for a non-eligible match');
      expect(response.body.explanation).not.toContain('Great news! You are eligible');
      expect(response.body.explanation).toContain('does not currently match the published criteria');
    });
  });
});
