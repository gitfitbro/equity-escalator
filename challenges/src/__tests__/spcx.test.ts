import { describe, expect, it } from 'vitest';

// Mirror server valuation logic for testability
function valueSpcxGrant(units: number, fmv = 97.5) {
  return { spcxUnits: units, fmvPerShare: fmv, fairValue: units * fmv };
}

describe('SPCX grant valuation', () => {
  it('values grants as units × 409A FMV', () => {
    expect(valueSpcxGrant(2500)).toEqual({
      spcxUnits: 2500,
      fmvPerShare: 97.5,
      fairValue: 243750,
    });
  });

  it('high-value executive PSU exceeds review threshold', () => {
    const grant = valueSpcxGrant(8500);
    expect(grant.fairValue).toBeGreaterThan(500_000);
  });
});