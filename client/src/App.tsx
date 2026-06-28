import { useCallback, useEffect, useState } from 'react';
import {
  fetchAudit,
  fetchQueue,
  fetchSpcxModel,
  seedSpaceXGrants,
  submitReview,
  type AuditEntry,
  type ReviewItem,
  type SpcxValuation,
} from './api';

function confidenceClass(c: number): string {
  if (c < 0.7) return 'low';
  if (c < 0.9) return 'mid';
  return 'high';
}

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

export default function App() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [spcx, setSpcx] = useState<SpcxValuation | null>(null);
  const [reviewer, setReviewer] = useState('consultant@equitymethods.com');
  const [loading, setLoading] = useState(true);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [q, a, model] = await Promise.all([
      fetchQueue(),
      fetchAudit(),
      fetchSpcxModel(),
    ]);
    setQueue(q);
    setAudit(a);
    setSpcx(model);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleReview(
    id: string,
    action: 'approve' | 'override' | 'reject',
    overrideLabel?: string,
  ) {
    await submitReview(id, action, reviewer, overrideLabel);
    await refresh();
  }

  async function handleSeedSpaceX() {
    const result = await seedSpaceXGrants();
    setSeedStatus(
      `Issued 4 SPCX grants — ${result.autoApproved} auto-approved, ${result.needsReview} escalated`,
    );
    await refresh();
  }

  return (
    <div className="app">
      <header>
        <h1>
          <span>Equity Escalator</span> — SpaceX SPCX Review
        </h1>
        <p className="subtitle">
          Issue SPCX units at 409A FMV → agent classifies grant → confidence/risk
          gate → consultant approves → audit trail
        </p>
        <div className="gate-banner">
          <span>
            IF <code>confidence &lt; 0.85</code> OR <code>risk = high</code> →
            human queue
          </span>
          <span>ELSE → auto-proceed</span>
        </div>
      </header>

      {spcx && (
        <section className="spcx-panel">
          <div className="spcx-header">
            <div>
              <span className="spcx-ticker">{spcx.ticker}</span>
              <span className="spcx-issuer">{spcx.issuer} Common</span>
            </div>
            <span className="spcx-badge">{spcx.method} · {spcx.valuationDate}</span>
          </div>
          <div className="spcx-stats">
            <div className="spcx-stat">
              <span className="label">FMV / share</span>
              <span className="value">${spcx.fmvPerShare.toFixed(2)}</span>
            </div>
            <div className="spcx-stat">
              <span className="label">Outstanding</span>
              <span className="value">{(spcx.totalOutstandingShares / 1e6).toFixed(0)}M sh</span>
            </div>
            <div className="spcx-stat">
              <span className="label">Implied equity</span>
              <span className="value">{formatMoney(spcx.impliedEquityValue)}</span>
            </div>
          </div>
          <p className="spcx-note">{spcx.note}</p>
        </section>
      )}

      <div className="reviewer-input">
        <label htmlFor="reviewer">Reviewer</label>
        <input
          id="reviewer"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="consultant@equitymethods.com"
        />
      </div>

      <div className="toolbar">
        <button className="primary" onClick={handleSeedSpaceX}>
          Issue SpaceX SPCX grants
        </button>
        <button onClick={refresh}>Refresh</button>
      </div>
      {seedStatus && <p className="seed-status">{seedStatus}</p>}

      <div className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Review Queue</h2>
            <span className="badge warning">{queue.length} pending</span>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : queue.length === 0 ? (
            <div className="empty">
              Queue empty — click &quot;Issue SpaceX SPCX grants&quot; to demo
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Grant</th>
                  <th>SPCX Units</th>
                  <th>Fair Value</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.record.employeeName}</div>
                      <div className="meta">
                        {item.record.employeeId}
                        {item.record.department && ` · ${item.record.department}`}
                      </div>
                    </td>
                    <td>{item.record.awardType}</td>
                    <td className="mono">
                      {(item.record.spcxUnits ?? item.record.units).toLocaleString()}
                    </td>
                    <td>${item.record.fairValue.toLocaleString()}</td>
                    <td>{item.classification.label}</td>
                    <td>
                      <span
                        className={`confidence ${confidenceClass(item.classification.confidence)}`}
                      >
                        {(item.classification.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`risk ${item.classification.risk}`}>
                        {item.classification.risk}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="primary"
                          onClick={() => handleReview(item.id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleReview(item.id, 'override', 'RSU')
                          }
                        >
                          Override→RSU
                        </button>
                        <button
                          className="danger"
                          onClick={() => handleReview(item.id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Audit Log</h2>
            <span className="badge">{audit.length} events</span>
          </div>
          <div className="audit-list">
            {audit.length === 0 ? (
              <div className="empty">No events yet</div>
            ) : (
              [...audit].reverse().map((entry) => (
                <div key={entry.id} className="audit-entry">
                  <div className="time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="event">{entry.eventType}</div>
                  <div className="detail">item {entry.itemId.slice(0, 8)}…</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}