import type { ClassificationResult, GateConfig } from './types.js';

export interface RoutingDecision {
  autoProceed: boolean;
  reason: string;
}

const DEFAULT_GATE: GateConfig = {
  confidenceThreshold: 0.85,
  highRiskRequiresReview: true,
};

/**
 * Canonical HITL gate:
 * IF (risk/severity > threshold) OR (agent confidence < threshold) → route to human
 * ELSE → auto-proceed
 *
 * Threshold is a BUSINESS dial — calibrate with consultants, start conservative.
 */
export function applyConfidenceRiskGate(
  classification: ClassificationResult,
  config: GateConfig = DEFAULT_GATE,
): RoutingDecision {
  const { confidence, risk, confidence: agentConfidence } = classification;
  const { confidenceThreshold, highRiskRequiresReview } = config;

  const lowConfidence = agentConfidence < confidenceThreshold;
  const highRisk = highRiskRequiresReview && risk === 'high';

  if (lowConfidence || highRisk) {
    const reasons: string[] = [];
    if (lowConfidence) {
      reasons.push(
        `confidence ${confidence} below threshold ${confidenceThreshold}`,
      );
    }
    if (highRisk) {
      reasons.push(`risk level "${risk}" requires human review`);
    }
    return { autoProceed: false, reason: reasons.join('; ') };
  }

  return {
    autoProceed: true,
    reason: `confidence ${confidence} ≥ ${confidenceThreshold} and risk "${risk}" is acceptable`,
  };
}

export function getGateConfig(): GateConfig {
  return { ...DEFAULT_GATE };
}