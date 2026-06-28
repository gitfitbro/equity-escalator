# Coding Challenges — Narration Guide

Practice **thinking out loud**, not algorithms. For each: (1) restate, (2) approach + tradeoff, (3) implement, (4) edge cases, (5) how you'd test.

**Tonight:** rehearse #2 and #3 out loud. That's enough.

---

## 1. Group & Summarize (warmup)

**Input:** `Array<{ employee, awardType, value }>`  
**Output:** totals by awardType, top employee by total value

**Narration:**
> "I'll do two passes — one to bucket by awardType, one to aggregate per employee. Map for employee totals, plain object for award types. O(n) time, O(unique keys) space."

**Edge cases:** empty array → empty totals, null top employee; ties → first max wins (state that); negatives → include them, don't filter unless spec says so.

**Test:** empty, single row, tie between two employees, negative values.

---

## 2. Threshold Router ⭐ NAIL THIS ONE

**Input:** `Array<{ id, prediction, confidence }>`, threshold  
**Output:** `{ autoApproved, needsReview, counts }`

**Narration:**
> "This mirrors my weekend HITL project. Confidence at or above threshold auto-proceeds; below routes to human review. I'd use `>=` for threshold so exactly-at-threshold is trusted — that's a product call you'd calibrate with consultants. Invalid or NaN confidence routes conservative — needs review, never auto-approve garbage."

**Connect to role:**
> "The threshold isn't something I pick in a vacuum — in production we'd start at 0.95, review almost everything, then widen the auto-lane as we build evidence per award type."

**Edge cases:** `confidence === threshold`, NaN, missing confidence, empty list.

**Test:** boundary at threshold, NaN item, empty array, all auto vs all review.

---

## 3. Validate & Normalize ⭐ DO THIS ONE TONIGHT

**Input:** raw records with missing fields, wrong types, out-of-range values  
**Output:** `{ clean, rejected: [{ record, reason }] }`

**Narration:**
> "Accuracy-critical domain — I reject with explicit reasons, never silently coerce. Check required fields first, then types, then business rules. Each rejection is auditable. The edge case IS the system."

**Edge cases:** partial records, wrong enum, negative units, bad date format, empty array.

**Test:** one valid + three invalid, assert rejection reasons are specific.

---

## 4. Reconcile Two Sources

**Input:** two arrays keyed by id  
**Output:** matches, mismatches, only-in-A, only-in-B

**Narration:**
> "Two maps, one pass each. First pass: for every id in A, check B — match, mismatch, or only-in-A. Second pass: ids in B not in A. Clean output shape for downstream reporting."

**Edge cases:** empty either source, duplicate ids (state: last wins or reject — pick one).

**Test:** full overlap with one mismatch, disjoint sets, empty A.

---

## 5. Reference Formatter

**Input:** prefix, pad length, reset rules  
**Output:** `ACH-000001`, `ACH-000002`, ...

**Narration:**
> "I did exactly this in production for check/ACH/VCC sequencing. Stateful counter per prefix, pad to fixed width, optional daily reset. Separate state per prefix so ACH and VCC don't collide."

**Edge cases:** pad overflow (counter > 10^padLength), daily reset at midnight, first call returns 1 not 0.

**Test:** sequential calls, independent prefixes, reset behavior.