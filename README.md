# 🛗 Equity Escalator

**HITL review loop + Equity Methods coding challenges** — the hands-on companion for interview prep.

When agent confidence is low or risk is high, items **escalate** to a human consultant. Everything else auto-proceeds. Every decision lands in an append-only audit trail.

> *"Where you set the confidence/risk threshold is a business decision, not a technical one."*

**Repo:** https://github.com/gitfitbro/equity-escalator

---

## What's Inside

| Piece | Description |
|-------|-------------|
| **HITL Review Loop** | Express API + React consultant UI — ingest → classify → gate → review → audit |
| **5 Coding Challenges** | TypeScript implementations with Vitest + narration guide |
| **Monte Carlo TSR** | Optional ~40-line PSU valuation script |
| **Interview Docs** | Real Bedrock/N8N HITL patterns + talk tracks |

---

## Quick Start

```bash
npm install
npm run dev          # server :3001 + client :5173
npm test             # coding challenges
npm run tsr          # Monte Carlo TSR demo
```

Open http://localhost:5173 → click **Issue SpaceX SPCX grants** → review the queue.

### SpaceX SPCX Demo

**SPCX** = illustrative SpaceX common-share unit (private company, no public ticker). Grants are valued at 409A FMV × units, then run through the HITL gate. See `docs/SPCX-MODEL.md`.

---

## HITL Review Loop

### Flow

```
POST /ingest → classify (stub LLM) → confidence/risk gate → auto OR human queue
                                                      ↓
                              React UI: Approve / Override / Reject
                                                      ↓
                              Append-only audit log (JSONL + GET /audit)
```

### The Gate

```
IF confidence < 0.85 OR risk = high → human queue
ELSE                                → auto-proceed
```

### API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/ingest` | Accept equity award record |
| `GET` | `/queue` | Pending human review items |
| `POST` | `/review/:id` | Approve, override, or reject |
| `GET` | `/audit` | Append-only audit log |
| `GET` | `/config` | Current gate thresholds |
| `GET` | `/spcx` | 409A valuation model for SPCX |
| `POST` | `/spcx/issue` | Issue SPCX units to an employee |
| `POST` | `/spcx/seed` | Load 4 illustrative SpaceX grants |

### Sample Ingest

```bash
curl -X POST http://localhost:3001/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "employeeId": "E-1042",
    "employeeName": "Jordan Chen",
    "awardType": "RSU",
    "grantDate": "2025-03-15",
    "units": 5000,
    "fairValue": 42500
  }'
```

### Deliberately Out of Scope

Real Bedrock, vector DB, auth, production deploy. Stubbed classifier + in-memory store keep the loop tight. In production: Bedrock agent with user-confirmation on writes, Postgres/DynamoDB for state/audit, React page as HITL surface.

---

## Coding Challenges

Located in `challenges/src/`. See `docs/CODING-CHALLENGES.md` for narration scripts.

| # | Challenge | Interview hook |
|---|-----------|----------------|
| 1 | Group & summarize awards | Warmup, on-domain |
| 2 | **Threshold router** ⭐ | Mirrors the HITL gate |
| 3 | **Validate & normalize** ⭐ | Accuracy-critical edge |
| 4 | Reconcile two sources | Financial data analog |
| 5 | Reference formatter | Capital Rx sequencing story |

**Tonight:** rehearse #2 and #3 out loud.

---

## Interview Talking Points

Read `docs/HITL-PATTERNS.md` for full language. Key phrases:

- **Bedrock:** user confirmation vs return-of-control; per-tool risk gating
- **N8N:** human review on flagged tools; start conservative, widen auto-lane with evidence
- **The gate:** `IF (risk > threshold) OR (confidence < threshold) → human`
- **Audit trail:** not nice-to-have — how you defend a number to an auditor

### The Sentence

> "I built a small HITL review loop this weekend to make the design tradeoffs concrete. An agent classifies each item with a confidence score, a risk/confidence gate decides what auto-proceeds versus what routes to a human queue, a consultant approves or overrides in a React view, and every decision is captured in an append-only audit trail with provenance."

---

## Project Structure

```
equity-escalator/
├── server/          # Express API — ingest, queue, review, audit
├── client/          # Vite React — consultant review UI
├── challenges/      # 5 coding challenges + tests
├── scripts/         # Monte Carlo TSR
└── docs/            # HITL patterns + challenge narration
```

---

## License

MIT — built for Equity Methods interview prep, June 2025.