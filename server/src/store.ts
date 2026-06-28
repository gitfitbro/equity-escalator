import { randomUUID } from 'crypto';
import type { EquityRecord, ItemStatus, ReviewItem } from './types.js';
import { classifyRecord } from './classifier.js';
import { applyConfidenceRiskGate } from './gate.js';
import { appendAudit } from './audit.js';

const items = new Map<string, ReviewItem>();

export function ingestRecord(record: EquityRecord): ReviewItem {
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  appendAudit('ingest_received', id, `ingest-${id}`, { record });

  const classification = classifyRecord(record);

  appendAudit('classification_complete', id, classification.provenanceRef, {
    label: classification.label,
    confidence: classification.confidence,
    risk: classification.risk,
    rationale: classification.rationale,
  });

  const routing = applyConfidenceRiskGate(classification);

  appendAudit('routing_decision', id, classification.provenanceRef, {
    autoProceed: routing.autoProceed,
    reason: routing.reason,
    confidence: classification.confidence,
    risk: classification.risk,
  });

  const status: ItemStatus = routing.autoProceed ? 'auto_approved' : 'pending_review';

  const item: ReviewItem = {
    id,
    record,
    classification,
    status,
    routingReason: routing.reason,
    finalLabel: routing.autoProceed ? classification.label : undefined,
    createdAt,
  };

  items.set(id, item);

  if (routing.autoProceed) {
    appendAudit('final_outcome', id, classification.provenanceRef, {
      status: 'auto_approved',
      finalLabel: classification.label,
    });
  }

  return item;
}

export function getQueue(): ReviewItem[] {
  return Array.from(items.values())
    .filter((item) => item.status === 'pending_review')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getItem(id: string): ReviewItem | undefined {
  return items.get(id);
}

export function getAllItems(): ReviewItem[] {
  return Array.from(items.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function reviewItem(
  id: string,
  action: 'approve' | 'override' | 'reject',
  reviewer: string,
  overrideLabel?: string,
  notes?: string,
): ReviewItem | null {
  const item = items.get(id);
  if (!item || item.status !== 'pending_review') return null;

  const reviewedAt = new Date().toISOString();
  let status: ItemStatus;
  let finalLabel: string | undefined;

  switch (action) {
    case 'approve':
      status = 'approved';
      finalLabel = item.classification.label;
      break;
    case 'override':
      status = 'overridden';
      finalLabel = overrideLabel ?? item.classification.label;
      break;
    case 'reject':
      status = 'rejected';
      finalLabel = undefined;
      break;
  }

  appendAudit('human_review', id, item.classification.provenanceRef, {
    action,
    reviewer,
    notes,
    overrideLabel,
    priorClassification: item.classification,
  });

  const updated: ReviewItem = {
    ...item,
    status,
    finalLabel: finalLabel as ReviewItem['finalLabel'],
    reviewedBy: reviewer,
    reviewedAt,
  };

  items.set(id, updated);

  appendAudit('final_outcome', id, item.classification.provenanceRef, {
    status,
    finalLabel,
    reviewer,
  });

  return updated;
}