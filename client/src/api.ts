const API = '/api';

export interface ReviewItem {
  id: string;
  record: {
    employeeId: string;
    employeeName: string;
    awardType: string;
    grantDate: string;
    units: number;
    fairValue: number;
  };
  classification: {
    label: string;
    confidence: number;
    risk: string;
    rationale: string;
  };
  status: string;
  routingReason: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  itemId: string;
  payload: Record<string, unknown>;
}

export async function fetchQueue(): Promise<ReviewItem[]> {
  const res = await fetch(`${API}/queue`);
  const data = await res.json();
  return data.items;
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const res = await fetch(`${API}/audit?limit=50`);
  const data = await res.json();
  return data.entries;
}

export async function submitReview(
  id: string,
  action: 'approve' | 'override' | 'reject',
  reviewer: string,
  overrideLabel?: string,
): Promise<ReviewItem> {
  const res = await fetch(`${API}/review/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reviewer, overrideLabel }),
  });
  if (!res.ok) throw new Error('Review failed');
  return res.json();
}

export async function ingestSample(record: Record<string, unknown>): Promise<void> {
  await fetch(`${API}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}