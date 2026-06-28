import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FMV_PER_SHARE,
  SEED_GRANTS,
  type AuditEvent,
  type BatchItem,
  type RiskLevel,
} from './hitl-data';
import './hitl-console.css';

const ACCENT = '#3b82f6';

type Role = 'consultant' | 'reviewer';

interface QueueRow {
  id: string;
  employee: string;
  meta: string;
  rawType: string;
  predType: string;
  changed: boolean;
  units: string;
  fair: string;
  confPct: string;
  confWidth: string;
  confColor: string;
  riskLabel: string;
  riskColor: string;
  riskBg: string;
  hasBadge: boolean;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  reasonPrimary: string;
  hasSecondary: boolean;
  reasonSecondary: string;
  leaving: boolean;
  actions: Array<{
    label: string;
    bg: string;
    color: string;
    border: string;
    weight: number;
    onClick: () => void;
  }>;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

function money(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

function gate(item: { conf: number; risk: RiskLevel }, threshold: number): boolean {
  return item.conf < threshold || item.risk === 'high';
}

const riskMap: Record<RiskLevel, { l: string; c: string; bg: string }> = {
  low: { l: 'Low', c: '#3fb950', bg: 'rgba(63,185,80,0.13)' },
  med: { l: 'Medium', c: '#d29922', bg: 'rgba(210,153,34,0.13)' },
  high: { l: 'High', c: '#f85149', bg: 'rgba(248,81,73,0.13)' },
};

const typeColor: Record<AuditEvent['type'], string> = {
  routing_decision: '#5b87c4',
  batch_ingested: '#7d8896',
  consultant_review: '#e0a13a',
  reviewer_signoff: '#3fb950',
};

export default function HitlReviewConsole() {
  const [reviewer, setReviewer] = useState('consultant@equitymethods.com');
  const [threshold, setThreshold] = useState(80);
  const [role, setRole] = useState<Role>('consultant');
  const [seeded, setSeeded] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [lastSync, setLastSync] = useState('—');
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setLastSync(nowTime());
    const interval = setInterval(() => setLastSync(nowTime()), 5000);
    return () => clearInterval(interval);
  }, []);

  const who = useCallback(
    () => (reviewer || 'reviewer').split('@')[0],
    [reviewer],
  );

  const animateOut = useCallback((id: string, finalize: () => void) => {
    if (timersRef.current[id]) return;
    setBatch((prev) =>
      prev.map((it) => (it.id === id ? { ...it, leaving: true } : it)),
    );
    timersRef.current[id] = setTimeout(() => {
      finalize();
      delete timersRef.current[id];
    }, 300);
  }, []);

  const handleSeed = () => {
    const items: BatchItem[] = SEED_GRANTS.map((it) => ({ ...it })) as BatchItem[];
    const events: AuditEvent[] = [];

    items.forEach((it) => {
      const esc = gate(it, threshold);
      it.status = esc ? 'pending_consultant' : 'pending_reviewer';
      it.auto = !esc;
      it.disp = null;
      it.returned = false;
      events.push({
        ts: nowTime(),
        type: 'routing_decision',
        item: it.id,
        detail: esc
          ? `→ consultant · conf ${it.conf}%${it.risk === 'high' ? ' · high-risk' : ''}`
          : `auto-approved → manager spot-check · conf ${it.conf}%`,
      });
    });

    const escCount = items.filter((it) => it.status === 'pending_consultant').length;
    const autoCount = items.length - escCount;
    events.push({
      ts: nowTime(),
      type: 'batch_ingested',
      item: 'SPCX-BATCH-0426',
      detail: `${items.length} SPCX grants classified by agent`,
    });

    setSeeded(true);
    setBatch(items);
    setAudit(events.reverse());
    setSeedStatus(`${autoCount} auto-approved · ${escCount} escalated to consultant`);
  };

  const handleThreshold = (t: number) => {
    setThreshold(t);
    setBatch((prev) =>
      prev.map((it) => {
        const untouched =
          it.disp == null &&
          (it.status === 'pending_consultant' || it.status === 'pending_reviewer');
        if (untouched) {
          const esc = gate(it, t);
          return {
            ...it,
            status: esc ? 'pending_consultant' : 'pending_reviewer',
            auto: !esc,
          };
        }
        return it;
      }),
    );
  };

  const consultantAct = useCallback(
    (id: string, kind: 'approved' | 'overridden' | 'sent_back') => {
      animateOut(id, () => {
        const w = who();
        setBatch((prev) => {
          const item = prev.find((it) => it.id === id);
          if (!item) return prev;

          let status: BatchItem['status'];
          let disp = item.disp;
          let detail: string;

          if (kind === 'approved') {
            status = 'pending_reviewer';
            disp = 'approved';
            detail = `approved (${item.predType}) by ${w}`;
          } else if (kind === 'overridden') {
            status = 'pending_reviewer';
            disp = 'overridden';
            detail = `override · classification / assumption corrected by ${w}`;
          } else {
            status = 'sent_back';
            detail = `sent back to client for more info by ${w}`;
          }

          setAudit((a) => [
            { ts: nowTime(), type: 'consultant_review', item: id, detail },
            ...a,
          ]);

          return prev.map((it) =>
            it.id === id
              ? { ...it, status, disp, auto: false, leaving: false }
              : it,
          );
        });
      });
    },
    [animateOut, who],
  );

  const reviewerAct = useCallback(
    (id: string, kind: 'finalized' | 'returned') => {
      animateOut(id, () => {
        const w = who();
        setBatch((prev) => {
          const item = prev.find((it) => it.id === id);
          if (!item) return prev;

          let status: BatchItem['status'];
          let detail: string;

          if (kind === 'finalized') {
            status = 'finalized';
            detail =
              `finalized & locked by ${w}` +
              (item.auto && item.disp == null
                ? ' (spot-check of agent auto-approval)'
                : '');
          } else {
            status = 'pending_consultant';
            detail = `returned to consultant by ${w}`;
          }

          setAudit((a) => [
            { ts: nowTime(), type: 'reviewer_signoff', item: id, detail },
            ...a,
          ]);

          return prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status,
                  returned: kind === 'returned' ? true : it.returned,
                  disp: kind === 'returned' ? null : it.disp,
                  leaving: false,
                }
              : it,
          );
        });
      });
    },
    [animateOut, who],
  );

  const counts = useMemo(() => {
    const escalateCount = batch.filter((it) => gate(it, threshold)).length;
    return {
      autoCount: batch.length - escalateCount,
      escalateCount,
      consultantCount: batch.filter((it) => it.status === 'pending_consultant').length,
      reviewerCount: batch.filter((it) => it.status === 'pending_reviewer').length,
      finalizedCount: batch.filter((it) => it.status === 'finalized').length,
    };
  }, [batch, threshold]);

  const { queueItems, queueCount } = useMemo(() => {
    const band = (c: number) =>
      c >= 80 ? '#3fb950' : c >= 60 ? '#d29922' : '#f85149';

    const A = {
      primary: { bg: ACCENT, color: '#fff', border: 'none', weight: 600 },
      neutral: {
        bg: 'transparent',
        color: '#9aa7b5',
        border: '1px solid #2f3a48',
        weight: 500,
      },
      warn: {
        bg: 'transparent',
        color: '#cf6b63',
        border: '1px solid rgba(248,81,73,0.32)',
        weight: 500,
      },
    };

    const base = (it: BatchItem): Omit<QueueRow, 'actions' | 'hasBadge' | 'badgeLabel' | 'badgeColor' | 'badgeBg' | 'badgeBorder' | 'reasonPrimary' | 'hasSecondary' | 'reasonSecondary'> => {
      const rk = riskMap[it.risk] ?? riskMap.low;
      return {
        id: it.id,
        employee: it.employee,
        meta: `${it.empId} · ${it.dept}`,
        rawType: it.rawType,
        predType: it.predType,
        changed: it.rawType !== it.predType,
        units: it.units.toLocaleString('en-US'),
        fair: money(it.units * FMV_PER_SHARE),
        confPct: `${it.conf}%`,
        confWidth: `${it.conf}%`,
        confColor: band(it.conf),
        riskLabel: rk.l,
        riskColor: rk.c,
        riskBg: rk.bg,
        leaving: !!it.leaving,
      };
    };

    if (role === 'consultant') {
      const raw = batch
        .filter((it) => it.status === 'pending_consultant')
        .sort((a, b) => a.conf - b.conf);
      const items: QueueRow[] = raw.map((it) => {
        const reasons: string[] = [];
        if (it.risk === 'high') reasons.push('risk: high');
        if (it.conf < threshold) reasons.push(`conf ${it.conf}% < ${threshold}%`);
        return {
          ...base(it),
          hasBadge: !!it.returned,
          badgeLabel: 'RETURNED BY REVIEWER',
          badgeColor: '#e0a13a',
          badgeBg: 'rgba(224,161,58,0.12)',
          badgeBorder: 'rgba(224,161,58,0.3)',
          reasonPrimary: it.esc || 'Manual hold',
          hasSecondary: reasons.length > 0,
          reasonSecondary: 'gate: ' + reasons.join(' · '),
          actions: [
            {
              label: 'Approve',
              ...A.primary,
              onClick: () => consultantAct(it.id, 'approved'),
            },
            {
              label: 'Override',
              ...A.neutral,
              onClick: () => consultantAct(it.id, 'overridden'),
            },
            {
              label: 'Send back',
              ...A.warn,
              onClick: () => consultantAct(it.id, 'sent_back'),
            },
          ],
        };
      });
      return { queueItems: items, queueCount: raw.length };
    }

    const raw = batch
      .filter((it) => it.status === 'pending_reviewer')
      .sort((a, b) => (a.auto === b.auto ? a.conf - b.conf : a.auto ? -1 : 1));

    const items: QueueRow[] = raw.map((it) => {
      let badge: { l: string; c: string; bg: string; b: string };
      let primary: string;
      if (it.auto && it.disp == null) {
        badge = {
          l: 'AUTO · NO HUMAN TOUCH',
          c: '#f0883e',
          bg: 'rgba(240,136,62,0.12)',
          b: 'rgba(240,136,62,0.32)',
        };
        primary = it.mech || 'Mechanical recognition · agent auto-approved';
      } else if (it.disp === 'overridden') {
        badge = {
          l: 'CONSULTANT · OVERRIDDEN',
          c: '#7fa8e6',
          bg: 'rgba(91,135,196,0.14)',
          b: 'rgba(91,135,196,0.34)',
        };
        primary = it.esc || 'Judgment item · consultant corrected and approved';
      } else {
        badge = {
          l: 'CONSULTANT · APPROVED',
          c: '#5fbf78',
          bg: 'rgba(63,185,80,0.12)',
          b: 'rgba(63,185,80,0.3)',
        };
        primary = it.esc || 'Judgment item · consultant approved';
      }
      return {
        ...base(it),
        hasBadge: true,
        badgeLabel: badge.l,
        badgeColor: badge.c,
        badgeBg: badge.bg,
        badgeBorder: badge.b,
        reasonPrimary: primary,
        hasSecondary: false,
        reasonSecondary: '',
        actions: [
          {
            label: 'Finalize',
            ...A.primary,
            onClick: () => reviewerAct(it.id, 'finalized'),
          },
          {
            label: 'Return',
            ...A.neutral,
            onClick: () => reviewerAct(it.id, 'returned'),
          },
        ],
      };
    });
    return { queueItems: items, queueCount: raw.length };
  }, [batch, role, threshold, consultantAct, reviewerAct]);

  const isConsultant = role === 'consultant';
  const hasQueue = queueItems.length > 0;
  const emptyMsg = !seeded
    ? 'Queue empty — click "Issue SpaceX SPCX grants" to load the demo batch.'
    : isConsultant
      ? 'Consultant queue clear — all escalations handled. Switch to Reviewer to sign off.'
      : 'Reviewer queue clear — every item finalized or returned. Audit trail retained.';

  const activeTab = {
    background: ACCENT,
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12.5px',
    padding: '7px 14px',
    fontFamily: 'DM Sans',
    whiteSpace: 'nowrap' as const,
  };
  const idleTab = {
    background: 'transparent',
    color: '#9aa7b5',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12.5px',
    padding: '7px 14px',
    fontFamily: 'DM Sans',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div className="hitl-root">
      <div className="hitl-shell">
        {/* ORIENTATION */}
        <div className="hitl-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: ACCENT,
                  boxShadow: '0 0 0 4px rgba(59,130,246,0.16)',
                }}
              />
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                HITL Review Console
              </h1>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#6b7785',
                  border: '1px solid #283341',
                  borderRadius: 5,
                  padding: '2px 7px',
                  marginLeft: 2,
                }}
              >
                v0.2 · two-tier
              </span>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                color: '#8b98a8',
                fontSize: 12,
                maxWidth: 560,
              }}
            >
              ASC 718 → gate → consultant → reviewer · SPCX 409A batch
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                background: '#0f1620',
                border: '1px solid #283341',
                borderRadius: 10,
                padding: 3,
                gap: 3,
              }}
            >
              <button
                type="button"
                onClick={() => setRole('consultant')}
                style={isConsultant ? activeTab : idleTab}
              >
                Consultant <span style={{ opacity: 0.65, fontWeight: 500 }}>·</span>{' '}
                {counts.consultantCount}
              </button>
              <button
                type="button"
                onClick={() => setRole('reviewer')}
                style={!isConsultant ? activeTab : idleTab}
              >
                Reviewer <span style={{ opacity: 0.65, fontWeight: 500 }}>·</span>{' '}
                {counts.reviewerCount}
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#6b7785',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#3fb950',
                  boxShadow: '0 0 6px #3fb950',
                }}
              />
              synced {lastSync}
            </div>
          </div>
        </div>

        <div className="hitl-context-row">
        {/* GATE BANNER */}
        <div className="hitl-gate">
          <div className="hitl-gate-label">HITL routing gate</div>
          <div className="hitl-gate-flow">
            <div className="hitl-gate-row">
              <span className="hitl-gate-pill hitl-gate-pill--keyword">IF</span>
              <span className="hitl-gate-pill hitl-gate-pill--risk">risk: high</span>
              <span className="hitl-gate-pill hitl-gate-pill--logic">OR</span>
              <span className="hitl-gate-pill hitl-gate-pill--risk">$ value: high</span>
              <span className="hitl-gate-pill hitl-gate-pill--logic">OR</span>
              <span className="hitl-gate-pill hitl-gate-pill--conf">
                confidence &lt; {threshold}%
              </span>
              <span className="hitl-gate-arrow">→</span>
              <span className="hitl-gate-pill hitl-gate-pill--escalate">
                route to consultant
              </span>
            </div>
            <div className="hitl-gate-row">
              <span className="hitl-gate-pill hitl-gate-pill--keyword">ELSE</span>
              <span className="hitl-gate-arrow">→</span>
              <span className="hitl-gate-pill hitl-gate-pill--approve">auto-approve</span>
              <span className="hitl-gate-arrow">→</span>
              <span className="hitl-gate-pill hitl-gate-pill--review">
                manager spot-check
              </span>
            </div>
          </div>
        </div>

        {/* VALUATION PANEL — compact */}
        <div
          style={{
            background: 'linear-gradient(135deg,#161e29 0%,#131922 60%,#141b25 100%)',
            border: '1px solid #232c38',
            borderRadius: 8,
            padding: '8px 12px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  background: '#0f1419',
                  border: '1px solid #2b3644',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 12,
                  color: ACCENT,
                }}
              >
                SPCX
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>SpaceX Common</div>
                <div style={{ color: '#5c6775', fontSize: 10.5 }}>409A illustrative · not a valuation opinion</div>
              </div>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#3fb950',
                background: 'rgba(63,185,80,0.1)',
                border: '1px solid rgba(63,185,80,0.25)',
                borderRadius: 5,
                padding: '3px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              eff. Mar 31 2026
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              ['FMV / sh', '$112.00'],
              ['Outstanding', '1.74B'],
              ['Implied', '$194.9B'],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: '#0f1620',
                  border: '1px solid #222c38',
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
              >
                <div style={{ color: '#6b7785', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 15,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* CONTROLS */}
        <div
          className="hitl-controls"
          style={{
            background: '#141a22',
            border: '1px solid #232c38',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#6b7785', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Reviewer identity
            </label>
            <input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              style={{
                background: '#0f1620',
                border: '1px solid #2b3644',
                borderRadius: 7,
                color: '#e6edf3',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12.5,
                padding: '6px 10px',
                width: 210,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 300, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label style={{ fontSize: 11, color: '#6b7785', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Confidence threshold
              </label>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  fontWeight: 600,
                  color: ACCENT,
                }}
              >
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={1}
              value={threshold}
              onChange={(e) => handleThreshold(+e.target.value)}
              style={{ width: '100%', accentColor: ACCENT }}
            />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#8b98a8' }}>
              <span style={{ color: '#3fb950' }}>{counts.autoCount}</span> would auto-approve ·{' '}
              <span style={{ color: '#f0883e' }}>{counts.escalateCount}</span> would escalate
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                type="button"
                onClick={handleSeed}
                style={{
                  background: ACCENT,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Issue SpaceX SPCX grants
              </button>
              <button
                type="button"
                onClick={() => setLastSync(nowTime())}
                style={{
                  background: 'transparent',
                  color: '#9aa7b5',
                  border: '1px solid #2b3644',
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 13,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>
            {seeded && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11.5,
                  color: '#3fb950',
                  background: 'rgba(63,185,80,0.1)',
                  border: '1px solid rgba(63,185,80,0.22)',
                  borderRadius: 6,
                  padding: '5px 10px',
                }}
              >
                ✓ {seedStatus}
              </div>
            )}
          </div>
        </div>

        {/* WORK SURFACE */}
        <div className="hitl-work-surface">
          {/* QUEUE */}
          <div className="hitl-queue-panel">
            <div
              className="hitl-queue-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: '1px solid #222c38',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {isConsultant ? 'Consultant queue' : 'Reviewer queue'}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    color: isConsultant ? '#f0883e' : '#7fa8e6',
                    background: isConsultant
                      ? 'rgba(240,136,62,0.12)'
                      : 'rgba(91,135,196,0.14)',
                    borderRadius: 11,
                    padding: '2px 9px',
                  }}
                >
                  {queueCount} {isConsultant ? 'escalated' : 'awaiting sign-off'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5, color: '#6b7785' }}>
                <span>
                  {isConsultant
                    ? 'checkpoint 1 · preparer review'
                    : 'checkpoint 2 · manager sign-off'}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#3fb950' }}>
                  ✓ {counts.finalizedCount} finalized
                </span>
              </div>
            </div>

            {hasQueue ? (
              <div className="hitl-queue-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr
                      style={{
                        color: '#6b7785',
                        fontSize: 10,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        textAlign: 'left',
                        position: 'sticky',
                        top: 0,
                        background: '#141a22',
                        zIndex: 1,
                      }}
                    >
                      <th style={{ padding: '8px 12px', fontWeight: 500 }}>Employee</th>
                      <th style={{ padding: '8px 8px', fontWeight: 500 }}>Grant (raw → agent)</th>
                      <th style={{ padding: '8px 8px', fontWeight: 500, textAlign: 'right' }}>
                        SPCX / FV
                      </th>
                      <th style={{ padding: '8px 8px', fontWeight: 500 }}>Conf</th>
                      <th style={{ padding: '8px 8px', fontWeight: 500 }}>Risk</th>
                      <th style={{ padding: '8px 8px', fontWeight: 500 }}>
                        {isConsultant ? 'Why escalated' : 'Provenance'}
                      </th>
                      <th style={{ padding: '8px 12px', fontWeight: 500, textAlign: 'right' }}>
                        Decision
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hitl-queue-row"
                        style={{
                          opacity: item.leaving ? 0 : 1,
                          transform: item.leaving ? 'translateX(14px)' : 'none',
                        }}
                      >
                        <td style={{ padding: '10px 12px', borderTop: '1px solid #1d2630', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: '#e6edf3' }}>{item.employee}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7785', marginTop: 2 }}>
                            {item.meta}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderTop: '1px solid #1d2630',
                            verticalAlign: 'top',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12.5,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.changed && (
                            <>
                              <span style={{ color: '#6b7785', textDecoration: 'line-through', textDecorationColor: '#3a4654' }}>
                                {item.rawType}
                              </span>
                              <span style={{ color: '#5c6775' }}> → </span>
                            </>
                          )}
                          <span style={{ color: '#e6edf3', fontWeight: 600 }}>{item.predType}</span>
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderTop: '1px solid #1d2630',
                            verticalAlign: 'top',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono', monospace",
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div style={{ color: '#c9d4df' }}>{item.units}</div>
                          <div style={{ color: '#7d8896', fontSize: 11.5, marginTop: 2 }}>{item.fair}</div>
                        </td>
                        <td style={{ padding: '10px 8px', borderTop: '1px solid #1d2630', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 44,
                                height: 6,
                                borderRadius: 3,
                                background: '#222c38',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: item.confWidth,
                                  background: item.confColor,
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: item.confColor,
                              }}
                            >
                              {item.confPct}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', borderTop: '1px solid #1d2630', verticalAlign: 'top' }}>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              fontWeight: 600,
                              color: item.riskColor,
                              background: item.riskBg,
                              borderRadius: 5,
                              padding: '3px 8px',
                            }}
                          >
                            {item.riskLabel}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderTop: '1px solid #1d2630',
                            verticalAlign: 'top',
                            minWidth: 196,
                            maxWidth: 230,
                          }}
                        >
                          {item.hasBadge && (
                            <span
                              style={{
                                display: 'inline-block',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 9.5,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                color: item.badgeColor,
                                background: item.badgeBg,
                                border: `1px solid ${item.badgeBorder}`,
                                borderRadius: 4,
                                padding: '2px 6px',
                                marginBottom: 5,
                              }}
                            >
                              {item.badgeLabel}
                            </span>
                          )}
                          <div style={{ fontSize: 11.5, color: '#aab6c2', lineHeight: 1.45 }}>
                            {item.reasonPrimary}
                          </div>
                          {item.hasSecondary && (
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10.5,
                                color: '#6b7785',
                                marginTop: 3,
                              }}
                            >
                              {item.reasonSecondary}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            borderTop: '1px solid #1d2630',
                            verticalAlign: 'top',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div style={{ display: 'inline-flex', gap: 5 }}>
                            {item.actions.map((act) => (
                              <button
                                key={act.label}
                                type="button"
                                onClick={act.onClick}
                                style={{
                                  background: act.bg,
                                  color: act.color,
                                  border: act.border,
                                  borderRadius: 6,
                                  fontFamily: 'DM Sans, sans-serif',
                                  fontWeight: act.weight,
                                  fontSize: 12,
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="hitl-empty-state hitl-queue-scroll">
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 28,
                    color: '#2b3644',
                    marginBottom: 10,
                  }}
                >
                  {'{ }'}
                </div>
                <div style={{ color: '#8b98a8', fontSize: 12.5, maxWidth: 360, margin: '0 auto' }}>
                  {emptyMsg}
                </div>
              </div>
            )}
          </div>

          {/* AUDIT SIDEBAR */}
          <div className="hitl-audit-panel">
            <div
              className="hitl-audit-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: '1px solid #222c38',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>Audit trail</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  color: '#6b7785',
                  border: '1px solid #283341',
                  borderRadius: 5,
                  padding: '2px 7px',
                }}
              >
                chain of custody
              </span>
            </div>
            <div className="hitl-audit-scroll">
              {audit.length > 0 ? (
                audit.map((ev, i) => (
                  <div
                    key={`${ev.item}-${ev.ts}-${i}`}
                    className="hitl-audit-entry"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 7,
                      border: '1px solid transparent',
                      borderLeft: `2px solid ${typeColor[ev.type] ?? '#8b98a8'}`,
                      marginBottom: 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: typeColor[ev.type] ?? '#8b98a8',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {ev.type}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5c6775' }}>
                        {ev.ts}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#aab6c2', marginTop: 4, lineHeight: 1.45 }}>
                      {ev.detail}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5c6775', marginTop: 3 }}>
                      {ev.item}
                    </div>
                  </div>
                ))
              ) : (
                <div className="hitl-empty-state">
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 28,
                      color: '#2b3644',
                      marginBottom: 10,
                    }}
                  >
                    {'{ }'}
                  </div>
                  <div style={{ color: '#8b98a8', fontSize: 12, maxWidth: 200, lineHeight: 1.5, margin: '0 auto' }}>
                    No events yet. Issue a batch to populate the chain of custody.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}