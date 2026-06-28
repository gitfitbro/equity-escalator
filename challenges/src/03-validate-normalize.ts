export interface RawRecord {
  [key: string]: unknown;
}

export interface CleanAward {
  employeeId: string;
  awardType: string;
  units: number;
  fairValue: number;
  grantDate: string;
}

export interface ValidationResult {
  clean: CleanAward[];
  rejected: Array<{ record: RawRecord; reason: string }>;
}

const VALID_TYPES = new Set(['RSU', 'PSU', 'OPTION', 'CASH']);

function asString(val: unknown): string | null {
  if (typeof val === 'string' && val.trim()) return val.trim();
  if (typeof val === 'number') return String(val);
  return null;
}

function asPositiveNumber(val: unknown): number | null {
  if (typeof val !== 'number' || Number.isNaN(val)) return null;
  if (val < 0) return null;
  return val;
}

/**
 * Challenge 3: Validate & normalize raw equity records.
 * The edge case IS the system — reject with explicit reasons.
 */
export function validateAndNormalize(records: RawRecord[]): ValidationResult {
  const clean: CleanAward[] = [];
  const rejected: ValidationResult['rejected'] = [];

  for (const record of records) {
    const employeeId = asString(record.employeeId);
    if (!employeeId) {
      rejected.push({ record, reason: 'missing or invalid employeeId' });
      continue;
    }

    const awardTypeRaw = asString(record.awardType)?.toUpperCase();
    if (!awardTypeRaw || !VALID_TYPES.has(awardTypeRaw)) {
      rejected.push({
        record,
        reason: `invalid awardType: ${String(record.awardType)}`,
      });
      continue;
    }

    const units = asPositiveNumber(record.units as number);
    if (units === null) {
      rejected.push({ record, reason: 'units must be a non-negative number' });
      continue;
    }

    const fairValue = asPositiveNumber(record.fairValue as number);
    if (fairValue === null) {
      rejected.push({
        record,
        reason: 'fairValue must be a non-negative number',
      });
      continue;
    }

    const grantDate = asString(record.grantDate);
    if (!grantDate || !/^\d{4}-\d{2}-\d{2}$/.test(grantDate)) {
      rejected.push({
        record,
        reason: 'grantDate must be YYYY-MM-DD',
      });
      continue;
    }

    clean.push({
      employeeId,
      awardType: awardTypeRaw,
      units,
      fairValue,
      grantDate,
    });
  }

  return { clean, rejected };
}