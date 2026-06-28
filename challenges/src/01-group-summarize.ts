export interface AwardRow {
  employee: string;
  awardType: string;
  value: number;
}

export interface GroupSummary {
  totalsByAwardType: Record<string, number>;
  topEmployee: { employee: string; totalValue: number } | null;
}

/**
 * Challenge 1: Group & summarize equity awards.
 * Edge cases: empty array, ties (first max wins), negatives.
 */
export function groupAndSummarize(rows: AwardRow[]): GroupSummary {
  if (rows.length === 0) {
    return { totalsByAwardType: {}, topEmployee: null };
  }

  const totalsByAwardType: Record<string, number> = {};
  const employeeTotals = new Map<string, number>();

  for (const row of rows) {
    totalsByAwardType[row.awardType] =
      (totalsByAwardType[row.awardType] ?? 0) + row.value;

    employeeTotals.set(
      row.employee,
      (employeeTotals.get(row.employee) ?? 0) + row.value,
    );
  }

  let topEmployee: GroupSummary['topEmployee'] = null;
  let maxValue = -Infinity;

  for (const [employee, totalValue] of employeeTotals) {
    if (totalValue > maxValue) {
      maxValue = totalValue;
      topEmployee = { employee, totalValue };
    }
  }

  return { totalsByAwardType, topEmployee };
}