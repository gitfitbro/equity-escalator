# Real HITL Patterns (Interview Language)

Use these names in the Todd CTO interview. They signal you've done the homework.

## Amazon Bedrock Agents

Two built-in HITL mechanisms:

1. **User confirmation** — agent pauses, shows function + parameters, human approves/denies before execution. Boolean gate.
2. **Return of Control (ROC)** — agent hands action back to YOUR code. You validate, add context, modify parameters. More control, more responsibility.

**Key design idea:** decide per-tool which actions auto-execute vs require confirmation. Reading data (low risk) runs automatically; writing/modifying/deleting (high risk, irreversible) requires human confirmation.

## N8N Human Review

Workflow pauses on flagged tool calls → approval request to Slack/Telegram/n8n chat → human approves/denies → agent proceeds or is rejected.

**When to require review:** irreversible actions (delete, send, purchase), compliance in regulated industries, high-value decisions. Start with review on, reduce oversight as confidence grows.

## The Canonical Gate (memorize this)

```
IF (risk/severity > threshold) OR (agent confidence < threshold)
  → route to human
ELSE
  → auto-proceed
```

This is what `equity-escalator` implements. Draw this if Todd asks how you'd design a HITL workflow.

## The Business Insight (say out loud)

> "Where you set the confidence/risk threshold is a **business decision**, not a technical one. In an accuracy-critical domain you calibrate it WITH the consultants, start conservative, review almost everything, then widen the auto-lane as you build evidence the agent is trustworthy on that step. That's also how you earn adoption: experts trust a system that defers to them early."

## Production vs This Prototype

**In scope here:** pattern demonstration, audit trail, consultant UI.

**Out of scope (say so — shows judgment):**
- Real Bedrock, vector DB, auth, deploy
- "I stubbed the model and store to keep the loop tight; in production this is a Bedrock agent with user-confirmation on write actions, Postgres/DynamoDB for state and audit, and the React page is the HITL surface."

## The Sentence That Earns You

> "I built a small HITL review loop this weekend to make the design tradeoffs concrete. An agent classifies each item with a confidence score, a risk/confidence gate decides what auto-proceeds versus what routes to a human queue, a consultant approves or overrides in a React view, and every decision is captured in an append-only audit trail with provenance. Building it clarified that the threshold is really a business-risk dial you calibrate with the consultants, and that the audit trail isn't a nice-to-have in this domain — it's how you defend a number to an auditor."