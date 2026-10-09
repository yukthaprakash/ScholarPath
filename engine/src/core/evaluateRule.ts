import { Rule, RuleTrace, RuleOutcome, StudentProfile } from '../types.js';

export function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Special handler for certificates shortcut, e.g., "certificates.INCOME_CERTIFICATE"
  if (path.startsWith('certificates.')) {
    const certType = path.split('.')[1];
    if (Array.isArray(obj.certificates)) {
      const cert = obj.certificates.find((c: any) => c.type === certType);
      if (!cert) return false;
      return cert.isAvailable && cert.status === 'VALID';
    }
    return undefined;
  }

  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

export function evaluateRule(profile: StudentProfile, rule: Rule, _today: string): RuleTrace {
  const studentValue = getNestedProperty(profile, rule.key);

  if (studentValue === undefined || studentValue === null || studentValue === 'UNSURE') {
    return {
      ruleKey: rule.key,
      ruleLabel: rule.label,
      ruleVersion: rule.version,
      studentValue: studentValue ?? null,
      expectedValue: rule.expectedValue,
      outcome: 'UNKNOWN',
      isActionable: rule.isActionable,
      isRequired: rule.isRequired,
      clauseRef: rule.clauseRef,
    };
  }

  let outcome: RuleOutcome = 'FAIL';
  let distanceInfo: RuleTrace['distance'] = undefined;

  const { operator, expectedValue } = rule;

  switch (operator) {
    case 'EQUALS': {
      if (expectedValue === 'ANY') {
        outcome = 'PASS';
      } else {
        outcome = studentValue === expectedValue ? 'PASS' : 'FAIL';
      }
      break;
    }
    case 'NOT_EQUALS': {
      outcome = studentValue !== expectedValue ? 'PASS' : 'FAIL';
      break;
    }
    case 'LESS_THAN': {
      const val = Number(studentValue);
      const target = Number(expectedValue);
      outcome = val < target ? 'PASS' : 'FAIL';
      distanceInfo = {
        numericDifference: Math.abs(target - val),
        message: val < target 
          ? `${target - val} within limit` 
          : `${val - target} above maximum allowed threshold`
      };
      break;
    }
    case 'LESS_THAN_OR_EQUAL': {
      const val = Number(studentValue);
      const target = Number(expectedValue);
      outcome = val <= target ? 'PASS' : 'FAIL';
      distanceInfo = {
        numericDifference: Math.abs(target - val),
        message: val <= target 
          ? `${target - val} within limit` 
          : `${val - target} above maximum allowed threshold`
      };
      break;
    }
    case 'GREATER_THAN': {
      const val = Number(studentValue);
      const target = Number(expectedValue);
      outcome = val > target ? 'PASS' : 'FAIL';
      distanceInfo = {
        numericDifference: Math.abs(val - target),
        message: val > target 
          ? `${val - target} above minimum threshold` 
          : `${target - val} below required minimum`
      };
      break;
    }
    case 'GREATER_THAN_OR_EQUAL': {
      const val = Number(studentValue);
      const target = Number(expectedValue);
      outcome = val >= target ? 'PASS' : 'FAIL';
      distanceInfo = {
        numericDifference: Math.abs(val - target),
        message: val >= target 
          ? `${val - target} above minimum requirement` 
          : `${target - val}% short of minimum requirement`
      };
      break;
    }
    case 'IN_ARRAY': {
      if (Array.isArray(expectedValue)) {
        outcome = expectedValue.includes(studentValue) || expectedValue.includes('ANY') ? 'PASS' : 'FAIL';
      } else {
        outcome = 'FAIL';
      }
      break;
    }
    case 'NOT_IN_ARRAY': {
      if (Array.isArray(expectedValue)) {
        outcome = !expectedValue.includes(studentValue) ? 'PASS' : 'FAIL';
      } else {
        outcome = 'FAIL';
      }
      break;
    }
    case 'CONTAINS': {
      if (Array.isArray(studentValue)) {
        outcome = studentValue.includes(expectedValue) ? 'PASS' : 'FAIL';
      } else {
        outcome = String(studentValue).includes(String(expectedValue)) ? 'PASS' : 'FAIL';
      }
      break;
    }
    case 'BETWEEN': {
      if (Array.isArray(expectedValue) && expectedValue.length === 2) {
        const val = Number(studentValue);
        const [min, max] = expectedValue.map(Number);
        outcome = val >= min && val <= max ? 'PASS' : 'FAIL';
      }
      break;
    }
    case 'DATE_BEFORE': {
      outcome = String(studentValue) < String(expectedValue) ? 'PASS' : 'FAIL';
      break;
    }
    case 'DATE_AFTER': {
      outcome = String(studentValue) > String(expectedValue) ? 'PASS' : 'FAIL';
      break;
    }
    default:
      outcome = 'FAIL';
  }

  return {
    ruleKey: rule.key,
    ruleLabel: rule.label,
    ruleVersion: rule.version,
    studentValue,
    expectedValue: rule.expectedValue,
    outcome,
    distance: distanceInfo,
    isActionable: rule.isActionable,
    isRequired: rule.isRequired,
    clauseRef: rule.clauseRef,
  };
}

export function calculateDistance(studentValue: any, rule: Rule): RuleTrace['distance'] {
  const dummyProfile: any = { dummy: studentValue };
  const trace = evaluateRule(dummyProfile, { ...rule, key: 'dummy' }, '2026-10-05');
  return trace.distance;
}
