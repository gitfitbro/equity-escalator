import { randomUUID } from 'crypto';
import type { AwardType, ClassificationResult, EquityRecord, RiskLevel } from './types.js';

const VALID_AWARD_TYPES: AwardType[] = ['RSU', 'PSU', 'OPTION', 'CASH'];

function normalizeAwardType(raw: string): AwardType {
  const upper = raw.trim().toUpperCase();
  if (VALID_AWARD_TYPES.includes(upper as AwardType)) {
    return upper as AwardType;
  }
  if (upper.includes('RESTRICTED') || upper.includes('RSU')) return 'RSU';
  if (upper.includes('PERFORMANCE') || upper.includes('PSU')) return 'PSU';
  if (upper.includes('OPTION')) return 'OPTION';
  if (upper.includes('CASH')) return 'CASH';
  return 'UNKNOWN';
}

function assessRisk(record: EquityRecord, label: AwardType): RiskLevel {
  if (record.fairValue >= 500_000) return 'high';
  if (label === 'UNKNOWN' || record.units <= 0 || record.fairValue < 0) return 'high';
  if (record.fairValue >= 100_000 || label === 'PSU') return 'medium';
  return 'low';
}

function computeConfidence(record: EquityRecord, label: AwardType): number {
  let confidence = 0.92;

  const declared = normalizeAwardType(record.awardType);
  if (declared === label && declared !== 'UNKNOWN') {
    confidence = 0.97;
  } else if (declared !== 'UNKNOWN' && declared !== label) {
    confidence = 0.55;
  } else if (label === 'UNKNOWN') {
    confidence = 0.42;
  }

  if (!record.employeeId || !record.grantDate) confidence -= 0.15;
  if (record.fairValue > 1_000_000) confidence -= 0.08;
  if (record.units === 0) confidence -= 0.2;

  return Math.max(0, Math.min(1, Number(confidence.toFixed(3))));
}

/**
 * Stub classifier — production would be a Bedrock agent call.
 * Returns label, confidence, risk, and a provenance reference for audit.
 */
export function classifyRecord(record: EquityRecord): ClassificationResult {
  const label = normalizeAwardType(record.awardType);
  const confidence = computeConfidence(record, label);
  const risk = assessRisk(record, label);
  const provenanceRef = `cls-${randomUUID()}`;

  const rationale =
    label === 'UNKNOWN'
      ? 'Award type could not be mapped to a known category'
      : `Mapped "${record.awardType}" → ${label} (confidence ${confidence}, risk ${risk})`;

  return { label, confidence, risk, rationale, provenanceRef };
}