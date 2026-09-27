import type { MemoryRecord } from "@/types/agent";

export interface GroupedAuditEntry {
  id: string;
  isChange: boolean;
  decision: string;
  rank: number | null;
  score: number | null;
  fromRank: number | null;
  toRank: number | null;
  latestTimestamp: string;
  earliestTimestamp: string;
  count: number;
  durationMinutes: number;
  summary: string;
  observedDelta: string | null;
  records: MemoryRecord[];
}

export function parseRankAndScore(rec: MemoryRecord) {
  const currentRankMatch =
    rec.currentState.match(/rank:\s*(\d+)/i) ||
    rec.summary.match(/ranked\s*#0?(\d+)/i);
  const currentScoreMatch =
    rec.currentState.match(/score:\s*([\d.]+)/i) ||
    rec.summary.match(/score\s*([\d.]+)/i);
  const prevRankMatch = rec.previousState.match(/rank:\s*(\d+)/i);
  const prevScoreMatch = rec.previousState.match(/score:\s*([\d.]+)/i);

  const currentRank = currentRankMatch ? parseInt(currentRankMatch[1], 10) : null;
  const previousRank = prevRankMatch ? parseInt(prevRankMatch[1], 10) : null;
  const currentScore = currentScoreMatch ? parseFloat(currentScoreMatch[1]) : null;
  const previousScore = prevScoreMatch ? parseFloat(prevScoreMatch[1]) : null;

  return { currentRank, previousRank, currentScore, previousScore };
}

/**
 * Groups consecutive identical memory cycles to eliminate visual repetition.
 * When multiple cycles share the exact same decision, rank, and score, they
 * are combined into a single consolidated audit interval.
 */
export function groupMemoryRecords(records: MemoryRecord[]): GroupedAuditEntry[] {
  if (!records || records.length === 0) return [];

  const groups: GroupedAuditEntry[] = [];

  for (const rec of records) {
    const { currentRank, previousRank, currentScore } = parseRankAndScore(rec);
    const isChange = Boolean(
      previousRank !== null &&
      currentRank !== null &&
      previousRank !== currentRank
    );

    const last = groups[groups.length - 1];
    const canGroupWithLast =
      last &&
      !isChange &&
      !last.isChange &&
      last.decision.toUpperCase() === rec.decision.toUpperCase() &&
      last.rank === currentRank &&
      (last.score === null || currentScore === null || Math.abs(last.score - currentScore) < 0.05);

    if (canGroupWithLast) {
      last.count += 1;
      last.earliestTimestamp = rec.timestamp;
      const latestTime = new Date(last.latestTimestamp).getTime();
      const earliestTime = new Date(rec.timestamp).getTime();
      last.durationMinutes =
        isNaN(latestTime) || isNaN(earliestTime)
          ? 0
          : Math.max(0, Math.round(Math.abs(latestTime - earliestTime) / 60000));
      last.records.push(rec);
    } else {
      groups.push({
        id: rec.id,
        isChange,
        decision: rec.decision,
        rank: currentRank,
        score: currentScore,
        fromRank: previousRank,
        toRank: currentRank,
        latestTimestamp: rec.timestamp,
        earliestTimestamp: rec.timestamp,
        count: 1,
        durationMinutes: 0,
        summary: rec.summary,
        observedDelta:
          isChange && previousRank && currentRank
            ? `#${String(previousRank).padStart(2, "0")} → #${String(currentRank).padStart(2, "0")}`
            : null,
        records: [rec],
      });
    }
  }

  return groups;
}
