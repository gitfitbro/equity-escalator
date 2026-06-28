export type RiskLevel = 'low' | 'med' | 'high';
export type ItemStatus =
  | 'pending_consultant'
  | 'pending_reviewer'
  | 'finalized'
  | 'sent_back';

export interface BatchItem {
  id: string;
  employee: string;
  empId: string;
  dept: string;
  rawType: string;
  predType: string;
  units: number;
  conf: number;
  risk: RiskLevel;
  mech?: string;
  esc?: string;
  status: ItemStatus;
  auto: boolean;
  disp: 'approved' | 'overridden' | null;
  returned: boolean;
  leaving?: boolean;
}

export interface AuditEvent {
  ts: string;
  type: 'routing_decision' | 'batch_ingested' | 'consultant_review' | 'reviewer_signoff';
  item: string;
  detail: string;
}

export const FMV_PER_SHARE = 112;

export const SEED_GRANTS: Omit<
  BatchItem,
  'status' | 'auto' | 'disp' | 'returned'
>[] = [
  {
    id: 'GRT-26-0418',
    employee: 'Maya Chen',
    empId: 'EMP-4471',
    dept: 'Engineering',
    rawType: 'RSU',
    predType: 'RSU',
    units: 8500,
    conf: 94,
    risk: 'low',
    mech: 'Standard RSU · straight-line over stated service period · mechanical recognition',
  },
  {
    id: 'GRT-26-0419',
    employee: 'Liam Foster',
    empId: 'EMP-2884',
    dept: 'Engineering',
    rawType: 'NSO',
    predType: 'NSO',
    units: 6000,
    conf: 91,
    risk: 'low',
    mech: 'Vanilla option · four Black-Scholes-Merton inputs assembled · within confidence band',
  },
  {
    id: 'GRT-26-0420',
    employee: 'David Okonkwo',
    empId: 'EMP-3920',
    dept: 'Sales',
    rawType: 'RSU',
    predType: 'RSU',
    units: 3200,
    conf: 88,
    risk: 'low',
    mech: 'Standard RSU · straight-line recognition · within confidence band',
  },
  {
    id: 'GRT-26-0421',
    employee: 'Noah Kim',
    empId: 'EMP-3345',
    dept: 'Product',
    rawType: 'ISO',
    predType: 'ISO',
    units: 4500,
    conf: 86,
    risk: 'low',
    mech: 'Vanilla option · Black-Scholes-Merton inputs assembled · mechanical journal entries',
  },
  {
    id: 'GRT-26-0422',
    employee: 'Elena Petrova',
    empId: 'EMP-7788',
    dept: 'Executive',
    rawType: 'PSU',
    predType: 'PSU',
    units: 95000,
    conf: 64,
    risk: 'high',
    esc: 'Market condition present (relative TSR) — requires Monte Carlo, not Black-Scholes-Merton; valuation assumptions need human review',
  },
  {
    id: 'GRT-26-0423',
    employee: 'Priya Nair',
    empId: 'EMP-5102',
    dept: 'Finance',
    rawType: 'RSU',
    predType: 'SAR',
    units: 45000,
    conf: 58,
    risk: 'high',
    esc: 'Possible liability classification: cash-settlement feature flagged — equity vs. liability is a consequential human judgment',
  },
  {
    id: 'GRT-26-0424',
    employee: 'Sofia Alvarez',
    empId: 'EMP-6210',
    dept: 'Operations',
    rawType: 'PSU',
    predType: 'PSU',
    units: 27500,
    conf: 72,
    risk: 'med',
    esc: 'Performance condition — probability-of-achievement assessment required before expense recognition',
  },
  {
    id: 'GRT-26-0425',
    employee: 'Marcus Webb',
    empId: 'EMP-6677',
    dept: 'Engineering',
    rawType: 'ISO',
    predType: 'NSO',
    units: 18000,
    conf: 76,
    risk: 'med',
    esc: 'Expected volatility assumption outside confidence band · agent reclassified ISO→NSO — defend or adjust',
  },
];