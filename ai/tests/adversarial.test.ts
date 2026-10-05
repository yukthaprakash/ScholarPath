import { describe, it, expect } from 'vitest';
import { checkAnswerGuard } from '../src/answerGuard.js';
import { getDeterministicFallback } from '../src/fallback.js';
import { SchemeMatch } from '../../engine/src/types.js';

const mockMatch: SchemeMatch = {
  schemeId: 'nsp-central-sector-ug',
  schemeTitle: 'Central Sector Scheme of Scholarships',
  schemeType: 'SCHOLARSHIP',
  state: 'ELIGIBLE',
  ruleTrace: [],
  failedRules: [],
  unknownRules: [],
  missingActionableRules: [],
  trustScore: { freshnessDays: 2, sourceTier: 1, coveragePercentage: 100, trustLevel: 'HIGH', bannerMessage: '' },
  financialBenefit: 12000,
  deadline: '2026-10-31',
  officialUrl: 'https://scholarships.gov.in',
};

const contextJson = JSON.stringify({
  schemeTitle: 'Central Sector Scheme of Scholarships',
  financialBenefit: 12000,
  deadline: '2026-10-31',
  officialUrl: 'https://scholarships.gov.in',
});

describe('AI Layer Adversarial & Safety Unit Tests', () => {
  it('1. Rejects prohibited approval guarantee claims', () => {
    const maliciousOutput = 'Congratulations! You are approved and will definitely get the money from the government.';
    const res = checkAnswerGuard(maliciousOutput, contextJson);
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Prohibited claim detected');
  });

  it('2. Rejects ungrounded fake URLs in AI response', () => {
    const fakeUrlOutput = 'Apply now on fake-scholarship-phishing-site.com to claim your money.';
    const res = checkAnswerGuard(fakeUrlOutput, contextJson);
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Ungrounded URL');
  });

  it('3. Rejects ungrounded fake dates in AI response', () => {
    const fakeDateOutput = 'The deadline is 2029-12-31 so you have plenty of time.';
    const res = checkAnswerGuard(fakeDateOutput, contextJson);
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Ungrounded Date detected');
  });

  it('4. Accepts grounded response using verified context URL and deadline', () => {
    const validOutput = 'You match the Central Sector Scheme of Scholarships with a benefit of 12000. Apply before 2026-10-31 at https://scholarships.gov.in';
    const res = checkAnswerGuard(validOutput, contextJson);
    expect(res.isValid).toBe(true);
  });

  it('5. Fallback provides deterministic output for ELIGIBLE match', () => {
    const fallbackText = getDeterministicFallback(mockMatch);
    expect(fallbackText).toContain('Central Sector Scheme of Scholarships');
    expect(fallbackText).toContain('12000');
    expect(fallbackText).toContain('2026-10-31');
  });

  it('6. Fallback provides deterministic output for NEARLY_ELIGIBLE match', () => {
    const nearMatch: SchemeMatch = {
      ...mockMatch,
      state: 'NEARLY_ELIGIBLE',
      missingActionableRules: [
        {
          ruleKey: 'certificates.INCOME_CERTIFICATE',
          ruleLabel: 'Valid Income Certificate Available',
          ruleVersion: '1.0',
          studentValue: false,
          expectedValue: true,
          outcome: 'FAIL',
          isActionable: true,
          isRequired: true,
        },
      ],
    };
    const fallbackText = getDeterministicFallback(nearMatch);
    expect(fallbackText).toContain('Nearly Eligible');
    expect(fallbackText).toContain('Valid Income Certificate Available');
  });
});
