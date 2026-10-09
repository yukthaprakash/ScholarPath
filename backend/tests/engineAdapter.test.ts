import { describe, it, expect } from 'vitest';
import { engineAdapter } from '../src/services/engineAdapter';

describe('Engine Adapter Stub', () => {
  it('returns a deterministic placeholder without performing eligibility calculations', async () => {
    const stubProfile = {
      userId: 'test-user-001',
      academicLevel: 'undergraduate',
      annualIncome: 150000
    };

    const result = await engineAdapter.evaluateEligibility(stubProfile);

    expect(result.status).toBe('PENDING_ENGINE_IMPLEMENTATION');
    expect(result.matchedCount).toBe(0);
    expect(result.receipts).toEqual([]);
    expect(result.notice).toContain('pending implementation in @scholarpath/engine');
    expect(result.evaluatedAt).toBeDefined();
  });
});
