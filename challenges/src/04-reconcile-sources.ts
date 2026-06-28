export interface SourceRecord {
  id: string;
  value: number;
}

export interface ReconcileResult {
  matches: Array<{ id: string; value: number }>;
  mismatches: Array<{ id: string; valueA: number; valueB: number }>;
  onlyInA: SourceRecord[];
  onlyInB: SourceRecord[];
}

/**
 * Challenge 4: Reconcile two financial data sources by id.
 * Two-pass with maps — O(n + m).
 */
export function reconcileSources(
  sourceA: SourceRecord[],
  sourceB: SourceRecord[],
): ReconcileResult {
  const mapA = new Map(sourceA.map((r) => [r.id, r.value]));
  const mapB = new Map(sourceB.map((r) => [r.id, r.value]));

  const matches: ReconcileResult['matches'] = [];
  const mismatches: ReconcileResult['mismatches'] = [];
  const onlyInA: SourceRecord[] = [];
  const onlyInB: SourceRecord[] = [];

  for (const [id, valueA] of mapA) {
    if (!mapB.has(id)) {
      onlyInA.push({ id, value: valueA });
    } else {
      const valueB = mapB.get(id)!;
      if (valueA === valueB) {
        matches.push({ id, value: valueA });
      } else {
        mismatches.push({ id, valueA, valueB });
      }
    }
  }

  for (const [id, valueB] of mapB) {
    if (!mapA.has(id)) {
      onlyInB.push({ id, value: valueB });
    }
  }

  return { matches, mismatches, onlyInA, onlyInB };
}