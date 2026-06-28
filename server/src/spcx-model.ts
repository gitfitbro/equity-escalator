/**
 * SPCX — illustrative SpaceX common-share unit for demo purposes.
 *
 * SpaceX is private (no public ticker). Consultants model grants as share
 * units × 409A fair market value. "SPCX" here = fictional internal symbol
 * for SpaceX common stock in this sandbox — NOT a real listed security.
 */

export interface SpcxValuation {
  ticker: 'SPCX';
  issuer: 'SpaceX';
  fmvPerShare: number;
  valuationDate: string;
  method: '409A';
  totalOutstandingShares: number;
  impliedEquityValue: number;
  note: string;
}

export interface SpcxGrantInput {
  employeeId: string;
  employeeName: string;
  awardType: string;
  grantDate: string;
  spcxUnits: number;
  vestingSchedule?: string;
  department?: string;
}

/** Latest stub 409A — production would pull from cap-table / valuation system */
const SPCX_409A: SpcxValuation = {
  ticker: 'SPCX',
  issuer: 'SpaceX',
  fmvPerShare: 97.5,
  valuationDate: '2025-03-31',
  method: '409A',
  totalOutstandingShares: 280_000_000,
  impliedEquityValue: 280_000_000 * 97.5,
  note:
    'Illustrative 409A FMV for demo. Real SpaceX valuations are private and differ.',
};

export function getSpcxValuation(): SpcxValuation {
  return { ...SPCX_409A };
}

export function valueSpcxGrant(units: number): {
  spcxUnits: number;
  fmvPerShare: number;
  fairValue: number;
} {
  const fmv = SPCX_409A.fmvPerShare;
  return {
    spcxUnits: units,
    fmvPerShare: fmv,
    fairValue: Number((units * fmv).toFixed(2)),
  };
}

/** Convert an SPCX grant request into an EquityRecord for the HITL pipeline */
export function spcxGrantToRecord(input: SpcxGrantInput) {
  const valued = valueSpcxGrant(input.spcxUnits);
  return {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    awardType: input.awardType,
    grantDate: input.grantDate,
    units: input.spcxUnits,
    fairValue: valued.fairValue,
    vestingSchedule: input.vestingSchedule,
    issuer: SPCX_409A.issuer,
    ticker: SPCX_409A.ticker,
    spcxUnits: input.spcxUnits,
    fmvPerShare: valued.fmvPerShare,
    department: input.department,
  };
}

/** SpaceX sample grants — mix of clean auto-approve and messy human-review cases */
export const SPACEX_SAMPLE_GRANTS: SpcxGrantInput[] = [
  {
    employeeId: 'SX-4401',
    employeeName: 'Elena Vasquez',
    department: 'Propulsion',
    awardType: 'RSU',
    grantDate: '2025-04-01',
    spcxUnits: 2_500,
    vestingSchedule: '4yr monthly, 1yr cliff',
  },
  {
    employeeId: 'SX-1102',
    employeeName: 'Marcus Okonkwo',
    department: 'Executive',
    awardType: 'performance stock unit',
    grantDate: '2025-01-15',
    spcxUnits: 8_500,
    vestingSchedule: '3yr performance, Starship milestone',
  },
  {
    employeeId: 'SX-7720',
    employeeName: 'Priya Nair',
    department: 'Starlink',
    awardType: 'Starlink division phantom equity',
    grantDate: '2024-12-01',
    spcxUnits: 1_200,
    vestingSchedule: 'unknown — needs counsel review',
  },
  {
    employeeId: 'SX-3308',
    employeeName: 'James Holt',
    department: 'Avionics',
    awardType: 'stock option',
    grantDate: '2025-02-20',
    spcxUnits: 10_000,
    vestingSchedule: '4yr, 25% annual',
  },
];