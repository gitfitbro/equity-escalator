export interface PredictionItem {
  id: string;
  prediction: string;
  confidence: number;
}

export interface ThresholdRouterResult {
  autoApproved: PredictionItem[];
  needsReview: PredictionItem[];
  counts: { autoApproved: number; needsReview: number; total: number };
}

/**
 * Challenge 2: Threshold router — mirrors the HITL confidence gate.
 *
 * Items with confidence >= threshold auto-approve; below routes to review.
 * NaN/missing confidence → needs review (conservative default).
 *
 * The threshold is a BUSINESS decision — calibrate with domain consultants.
 */
export function thresholdRouter(
  items: PredictionItem[],
  threshold: number,
): ThresholdRouterResult {
  const autoApproved: PredictionItem[] = [];
  const needsReview: PredictionItem[] = [];

  for (const item of items) {
    const conf = item.confidence;
    const isValid = typeof conf === 'number' && !Number.isNaN(conf);

    if (isValid && conf >= threshold) {
      autoApproved.push(item);
    } else {
      needsReview.push(item);
    }
  }

  return {
    autoApproved,
    needsReview,
    counts: {
      autoApproved: autoApproved.length,
      needsReview: needsReview.length,
      total: items.length,
    },
  };
}