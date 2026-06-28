import { useCallback, useEffect, useState } from 'react';
import {
  fetchAudit,
  fetchQueue,
  ingestSample,
  submitReview,
  type AuditEntry,
  type ReviewItem,
} from './api';

const SAMPLE_RECORDS = [
  {
    employeeId: 'E-1042',
    employeeName: 'Jordan Chen',
    awardType: 'RSU',
    grantDate: '2025-03-15',
    units: 5000,
    fairValue: 42500,
  },
  {
    employeeId: 'E-2088',
    employeeName: 'Morgan Patel',
    awardType: 'performance stock unit',
    grantDate: '2025-01-10',
    units: 12000,
    fairValue: 580000,
  },
  {
    employeeId: 'E-3011',
    employeeName: 'Alex Rivera',
    awardType: 'weird_grant_type',
    grantDate: '2024-11-01',
    units: 800,
    fairValue: 22000,
  },
];

function confidenceClass(c: number): string {
  if (c < 0.7) return 'low';
  if (c < 0.9) return 'mid';
  return 'high';
}

export default function App() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [reviewer, setReviewer] = useState('consultant@equitymethods.com');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [q, a] = await Promise.all([fetchQueue(), fetchAudit()]);
    setQueue(q);
    setAudit(a);
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

  async function seedSamples() {
    for (const record of SAMPLE_RECORDS) {
      await ingestSample(record);
    }
    await refresh();
  }

  return (
    <div className="app">
      <header>
        <h1>
          <span>Equity Escalator</span> — HITL Review Loop
        </h1>
        <p className="subtitle">
          Agent classifies → confidence/risk gate routes → consultant approves or
          overrides → append-only audit trail
        </p>
        <div className="gate-banner">
          <span>
            IF <code>confidence &lt; 0.85</code> OR <code>risk = high</code> →
            human queue
          </span>
          <span>ELSE → auto-proceed</span>
        </div>
      </header>

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
        <button className="primary" onClick={seedSamples}>
          Seed sample awards
        </button>
        <button onClick={refresh}>Refresh</button>
      </div>

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
              Queue empty — seed samples or POST to /ingest
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Award</th>
                  <th>Value</th>
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
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                        {item.record.employeeId}
                      </div>
                    </td>
                    <td>{item.record.awardType}</td>
                    <td>
                      ${item.record.fairValue.toLocaleString()}
                    </td>
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
                  <div className="detail">
                    item {entry.itemId.slice(0, 8)}…
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}