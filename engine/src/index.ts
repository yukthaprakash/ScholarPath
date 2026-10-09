import { z } from 'zod';
import { schemeSchema } from './schema.js';
import { Scheme } from './types.js';

export * from './types.js';
export * from './schema.js';

export { evaluateRule, calculateDistance as distance } from './core/evaluateRule.js';
export { matchScheme } from './core/matchScheme.js';
export { quickCheck } from './core/quickCheck.js';
export { analyzeAll } from './core/analyzeAll.js';

export { computeUnlocks } from './differentiators/computeUnlocks.js';
export { forecast } from './differentiators/forecast.js';
export { pairConflict } from './differentiators/pairConflict.js';
export { bestStack } from './differentiators/bestStack.js';
export { planBackwards } from './differentiators/planBackwards.js';
export { evaluatePreflight } from './differentiators/evaluatePreflight.js';
export { trustLevel } from './differentiators/trustLevel.js';
export { mergeHousehold } from './differentiators/mergeHousehold.js';

export function validateScheme(data: any): { success: boolean; data?: Scheme; errors?: string[] } {
  const result = schemeSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as Scheme };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
}
