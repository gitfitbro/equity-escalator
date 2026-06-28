import express from 'express';
import cors from 'cors';
import type { EquityRecord, ReviewRequest } from './types.js';
import { getAuditLog } from './audit.js';
import { getGateConfig } from './gate.js';
import {
  getAllItems,
  getItem,
  getQueue,
  ingestRecord,
  reviewItem,
} from './store.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'equity-escalator-hitl' });
});

app.get('/config', (_req, res) => {
  res.json({ gate: getGateConfig() });
});

/** POST /ingest — accept structured equity record, classify, route */
app.post('/ingest', (req, res) => {
  const record = req.body as EquityRecord;

  if (!record?.employeeId || !record?.awardType) {
    res.status(400).json({ error: 'employeeId and awardType are required' });
    return;
  }

  const item = ingestRecord(record);
  const routing =
    item.status === 'auto_approved' ? 'auto_approved' : 'needs_review';

  res.status(201).json({ item, routing });
});

/** GET /queue — pending human review items */
app.get('/queue', (_req, res) => {
  res.json({ items: getQueue(), count: getQueue().length });
});

/** GET /items — all items (for demo / debugging) */
app.get('/items', (_req, res) => {
  res.json({ items: getAllItems() });
});

/** GET /items/:id */
app.get('/items/:id', (req, res) => {
  const item = getItem(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(item);
});

/** POST /review/:id — consultant approves, overrides, or rejects */
app.post('/review/:id', (req, res) => {
  const body = req.body as ReviewRequest;

  if (!body?.action || !body?.reviewer) {
    res.status(400).json({ error: 'action and reviewer are required' });
    return;
  }

  if (body.action === 'override' && !body.overrideLabel) {
    res.status(400).json({ error: 'overrideLabel required for override action' });
    return;
  }

  const updated = reviewItem(
    req.params.id,
    body.action,
    body.reviewer,
    body.overrideLabel,
    body.notes,
  );

  if (!updated) {
    res.status(404).json({ error: 'Item not found or not pending review' });
    return;
  }

  res.json(updated);
});

/** GET /audit — append-only audit log */
app.get('/audit', (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  res.json({ entries: getAuditLog(limit) });
});

app.listen(PORT, () => {
  console.log(`🛗 Equity Escalator HITL server → http://localhost:${PORT}`);
  console.log(`   Gate: confidence < 0.85 OR risk=high → human queue`);
});