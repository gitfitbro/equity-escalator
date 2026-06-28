# SpaceX SPCX Model (Illustrative Demo)

## What SPCX Means Here

**SPCX** = fictional internal symbol for **SpaceX common stock units** in this sandbox.

SpaceX is a **private company** — there is no public SPCX ticker. Equity Methods consultants model grants exactly this way: share units × 409A fair market value = grant fair value. We use SPCX as shorthand so the demo tells a concrete story in the interview.

> "I modeled private-company equity as SPCX units — SpaceX common at the latest 409A — then ran each grant through the HITL confidence gate."

## The Math

```
grantFairValue = spcxUnits × fmvPerShare
```

Demo 409A (stub):
- **FMV:** $97.50 / share
- **Valuation date:** 2025-03-31
- **Outstanding:** 280M shares (illustrative)
- **Implied equity:** ~$27.3B at 409A

## Sample Grants

| Employee | Dept | Type | SPCX Units | Fair Value | Routing |
|----------|------|------|------------|------------|---------|
| Elena Vasquez | Propulsion | RSU | 2,500 | $243,750 | Auto ✓ |
| Marcus Okonkwo | Executive | PSU | 8,500 | $828,750 | Human (high value + PSU) |
| Priya Nair | Starlink | Phantom equity | 1,200 | $117,000 | Human (unknown type) |
| James Holt | Avionics | Option | 10,000 | $975,000 | Human (high value) |

## API

```bash
# Current 409A model
curl http://localhost:3001/spcx

# Issue a single SPCX grant
curl -X POST http://localhost:3001/spcx/issue \
  -H 'Content-Type: application/json' \
  -d '{
    "employeeId": "SX-9999",
    "employeeName": "Demo Engineer",
    "awardType": "RSU",
    "grantDate": "2025-06-01",
    "spcxUnits": 1000,
    "department": "R&D"
  }'

# Seed all 4 SpaceX sample grants
curl -X POST http://localhost:3001/spcx/seed
```

## Interview Bridge

Private-company equity comp is Equity Methods' bread and butter:

1. **409A sets the number** — FMV per share is the anchor everything hangs on
2. **Grant types differ** — RSU vs PSU vs options have different tax/vesting treatment; classification matters
3. **Ambiguous grants escalate** — phantom equity, spin-off units, novel structures → human review
4. **Audit trail defends the FMV** — every routing decision logged with provenance

Say it cleanly:

> "SpaceX doesn't have a public ticker, so we model common as SPCX units at 409A. I issue grants, multiply units by FMV, classify the award type, and let the confidence gate decide what auto-books versus what a consultant has to sign off on. High-value PSUs and ambiguous Starlink phantom grants escalate — exactly what you'd want before defending a number to an auditor."