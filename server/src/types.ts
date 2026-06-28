export type AwardType = 'RSU' | 'PSU' | 'OPTION' | 'CASH' | 'UNKNOWN';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ItemStatus =
  | 'auto_approved'
  | 'pending_review'
  | 'approved'
  | 'overridden'
  | 'rejected';

export interface EquityRecord {
  employeeId: string;
  employeeName: string;
  awardType: string;
  grantDate: string;
  units: number;
  fairValue: number;
  vestingSchedule?: string;
  /** Issuer — e.g. SpaceX in SPCX demo grants */
  issuer?: string;
  /** Share-class symbol — SPCX = illustrative SpaceX common unit */
  ticker?: string;
  spcxUnits?: number;
  fmvPerShare?: number;
  department?: string;
}

export interface ClassificationResult {
  label: AwardType;
  confidence: number;
  risk: RiskLevel;
  rationale: string;
  provenanceRef: string;
}

export interface ReviewItem {
  id: string;
  record: EquityRecord;
  classification: ClassificationResult;
  status: ItemStatus;
  routingReason: string;
  finalLabel?: AwardType;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface GateConfig {
  confidenceThreshold: number;
  highRiskRequiresReview: boolean;
}

export type AuditEventType =
  | 'ingest_received'
  | 'classification_complete'
  | 'routing_decision'
  | 'human_review'
  | 'final_outcome';

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  itemId: string;
  provenanceRef: string;
  payload: Record<string, unknown>;
}

export interface IngestResponse {
  item: ReviewItem;
  routing: 'auto_approved' | 'needs_review';
}

export interface ReviewRequest {
  action: 'approve' | 'override' | 'reject';
  reviewer: string;
  overrideLabel?: AwardType;
  notes?: string;
}