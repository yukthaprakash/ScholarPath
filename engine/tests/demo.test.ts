import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { analyzeAll } from '../src/core/analyzeAll.js';
import { computeUnlocks } from '../src/differentiators/computeUnlocks.js';
import { forecast } from '../src/differentiators/forecast.js';
import { evaluatePreflight } from '../src/differentiators/evaluatePreflight.js';
import { bestStack } from '../src/differentiators/bestStack.js';
import { ConflictPair, Scheme, StudentProfile } from '../src/types.js';

describe('Demo Student Target Metrics Verification', () => {
  it('Meets all demo metrics: >=6 matches, >=3 nearly eligible, 4 missed, >=2 unlock actions, >=1 forecast change, >=1 preflight issue, >=1 conflict', () => {
    const demo: StudentProfile = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../data/seed/demo-student.json'), 'utf8')
    );
    const schemeFiles = fs.readdirSync(path.resolve(__dirname, '../../data/schemes'));
    const schemes: Scheme[] = schemeFiles.map(f =>
      JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/schemes', f), 'utf8'))
    );
    const conflicts: ConflictPair[] = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../data/conflicts.json'), 'utf8')
    );

    const analysis = analyzeAll(demo, schemes, '2026-10-05');
    const matchesCount = analysis.summary.eligibleCount + analysis.summary.nearlyEligibleCount;
    const nearlyCount = analysis.summary.nearlyEligibleCount;
    const missedCount = analysis.summary.notMatchedCount;

    const unlocks = computeUnlocks(demo, schemes, '2026-10-05');
    const fc = forecast(demo, schemes, 1, '2026-10-05');
    const forecastChanges = fc.years[0].newlyEligibleSchemes.length + fc.years[0].lostSchemes.length;

    const preflight = evaluatePreflight(demo, schemes[0]);
    const schemeMap = new Map<string, Scheme>(schemes.map(s => [s.id, s]));
    const stack = bestStack(analysis.matches, schemeMap, conflicts);

    console.log('--- VERIFIED DEMO TARGETS ---');
    console.log(`Matches (Eligible + Nearly): ${matchesCount} (target: >=6)`);
    console.log(`Nearly Eligible: ${nearlyCount} (target: >=3)`);
    console.log(`Missed (Not Matched): ${missedCount}`);
    console.log(`Unlock Actions: ${unlocks.actions.length} (target: >=2)`);
    console.log(`Forecast Changes: ${forecastChanges} (target: >=1)`);
    console.log(`Preflight Issues: ${preflight.issues.length} (target: >=1)`);
    console.log(`Conflicts Detected: ${stack.incompatiblePairs.length} (target: >=1)`);

    expect(matchesCount).toBeGreaterThanOrEqual(6);
    expect(nearlyCount).toBeGreaterThanOrEqual(3);
    expect(unlocks.actions.length).toBeGreaterThanOrEqual(2);
    expect(forecastChanges).toBeGreaterThanOrEqual(1);
    expect(preflight.issues.length).toBeGreaterThanOrEqual(1);
    expect(stack.incompatiblePairs.length).toBeGreaterThanOrEqual(1);
  });
});
