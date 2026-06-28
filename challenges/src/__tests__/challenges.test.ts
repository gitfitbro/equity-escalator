import { describe, expect, it, beforeEach } from 'vitest';
import { groupAndSummarize } from '../01-group-summarize.js';
import { thresholdRouter } from '../02-threshold-router.js';
import { validateAndNormalize } from '../03-validate-normalize.js';
import { reconcileSources } from '../04-reconcile-sources.js';
import { nextReference, resetFormatterState } from '../05-reference-formatter.js';

describe('Challenge 1: groupAndSummarize', () => {
  it('returns empty for empty input', () => {
    expect(groupAndSummarize([])).toEqual({
      totalsByAwardType: {},
      topEmployee: null,
    });
  });

  it('totals by awardType and finds top employee', () => {
    const result = groupAndSummarize([
      { employee: 'Alice', awardType: 'RSU', value: 100 },
      { employee: 'Bob', awardType: 'PSU', value: 200 },
      { employee: 'Alice', awardType: 'OPTION', value: 50 },
    ]);
    expect(result.totalsByAwardType).toEqual({ RSU: 100, PSU: 200, OPTION: 50 });
    expect(result.topEmployee).toEqual({ employee: 'Bob', totalValue: 200 });
  });

  it('handles negatives', () => {
    const result = groupAndSummarize([
      { employee: 'A', awardType: 'RSU', value: -10 },
      { employee: 'B', awardType: 'RSU', value: 5 },
    ]);
    expect(result.totalsByAwardType.RSU).toBe(-5);
    expect(result.topEmployee?.employee).toBe('B');
  });
});

describe('Challenge 2: thresholdRouter', () => {
  const items = [
    { id: '1', prediction: 'RSU', confidence: 0.95 },
    { id: '2', prediction: 'PSU', confidence: 0.7 },
    { id: '3', prediction: 'OPTION', confidence: 0.85 },
    { id: '4', prediction: 'UNKNOWN', confidence: NaN },
  ];

  it('routes by confidence threshold', () => {
    const result = thresholdRouter(items, 0.85);
    expect(result.autoApproved.map((i) => i.id)).toEqual(['1', '3']);
    expect(result.needsReview.map((i) => i.id)).toEqual(['2', '4']);
    expect(result.counts).toEqual({
      autoApproved: 2,
      needsReview: 2,
      total: 4,
    });
  });

  it('confidence == threshold auto-approves', () => {
    const result = thresholdRouter(
      [{ id: 'x', prediction: 'RSU', confidence: 0.85 }],
      0.85,
    );
    expect(result.autoApproved).toHaveLength(1);
  });

  it('empty list returns zero counts', () => {
    const result = thresholdRouter([], 0.85);
    expect(result.counts.total).toBe(0);
  });
});

describe('Challenge 3: validateAndNormalize', () => {
  it('accepts valid records', () => {
    const result = validateAndNormalize([
      {
        employeeId: 'E1',
        awardType: 'rsu',
        units: 100,
        fairValue: 5000,
        grantDate: '2025-01-15',
      },
    ]);
    expect(result.clean).toHaveLength(1);
    expect(result.clean[0].awardType).toBe('RSU');
    expect(result.rejected).toHaveLength(0);
  });

  it('rejects invalid records with reasons', () => {
    const result = validateAndNormalize([
      { awardType: 'RSU' },
      { employeeId: 'E2', awardType: 'BONUS', units: 1, fairValue: 1, grantDate: '2025-01-01' },
      { employeeId: 'E3', awardType: 'RSU', units: -1, fairValue: 1, grantDate: '2025-01-01' },
    ]);
    expect(result.rejected).toHaveLength(3);
    expect(result.rejected[0].reason).toContain('employeeId');
  });
});

describe('Challenge 4: reconcileSources', () => {
  const a = [
    { id: '1', value: 100 },
    { id: '2', value: 200 },
    { id: '3', value: 300 },
  ];
  const b = [
    { id: '1', value: 100 },
    { id: '2', value: 250 },
    { id: '4', value: 400 },
  ];

  it('finds matches, mismatches, and orphans', () => {
    const result = reconcileSources(a, b);
    expect(result.matches).toEqual([{ id: '1', value: 100 }]);
    expect(result.mismatches).toEqual([{ id: '2', valueA: 200, valueB: 250 }]);
    expect(result.onlyInA).toEqual([{ id: '3', value: 300 }]);
    expect(result.onlyInB).toEqual([{ id: '4', value: 400 }]);
  });
});

describe('Challenge 5: nextReference', () => {
  beforeEach(() => resetFormatterState());

  it('generates padded sequential references', () => {
    const config = { prefix: 'ACH', padLength: 6, resetDaily: false };
    expect(nextReference(config)).toBe('ACH-000001');
    expect(nextReference(config)).toBe('ACH-000002');
    expect(nextReference(config)).toBe('ACH-000003');
  });

  it('separate prefixes have independent counters', () => {
    expect(nextReference({ prefix: 'CHK', padLength: 4, resetDaily: false })).toBe(
      'CHK-0001',
    );
    expect(nextReference({ prefix: 'VCC', padLength: 4, resetDaily: false })).toBe(
      'VCC-0001',
    );
  });
});