/**
 * Engine Adapter Stub (Phase 1)
 *
 * ARCHITECTURAL MANDATE:
 * The backend API MUST NOT decide scholarship eligibility or contain business rules.
 * Evaluation logic belongs exclusively to the pure TypeScript engine package (@scholarpath/engine).
 *
 * Current State:
 * @scholarpath/engine is not yet available in the repository.
 * This adapter provides a clean typed abstraction barrier. Real eligibility evaluation
 * will be delegated to the engine in Phase 2 once interfaces are delivered.
 */

// Temporary structural integration types (to be replaced by @scholarpath/engine exports)
export interface TemporaryStudentProfileStub {
  userId: string;
  academicLevel?: string;
  category?: string;
  annualIncome?: number;
  stateOfDomicile?: string;
  metadata?: Record<string, unknown>;
}

export interface TemporaryEligibilityReceiptStub {
  ruleCode: string;
  clauseDescription: string;
  passed: boolean;
  sourceCitation: string;
  ruleVersion: string;
}

export interface TemporaryEvaluationResultStub {
  status: 'PENDING_ENGINE_IMPLEMENTATION';
  evaluatedAt: string;
  matchedCount: number;
  notice: string;
  receipts: TemporaryEligibilityReceiptStub[];
}

export interface EngineAdapter {
  evaluateEligibility(profile: TemporaryStudentProfileStub): Promise<TemporaryEvaluationResultStub>;
}

/**
 * Default stub engine adapter implementation.
 * Performs NO business calculations; returns a deterministic integration placeholder.
 */
class EngineAdapterStub implements EngineAdapter {
  async evaluateEligibility(
    _profile: TemporaryStudentProfileStub
  ): Promise<TemporaryEvaluationResultStub> {
    return {
      status: 'PENDING_ENGINE_IMPLEMENTATION',
      evaluatedAt: new Date().toISOString(),
      matchedCount: 0,
      notice: 'Evaluation engine is pending implementation in @scholarpath/engine',
      receipts: []
    };
  }
}

export const engineAdapter: EngineAdapter = new EngineAdapterStub();
