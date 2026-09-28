import type { Pairing } from "@/types/pairing";

export interface FeaturedPairingResult {
  pairing: Pairing | null;
  tiedCount: number;
  isTied: boolean;
  alternatives: Pairing[];
}

/**
 * Returns numeric priority tier for a pairing lifecycle stage:
 * LAUNCH_CANDIDATE / LAUNCHED (3) > CURATED (2) > PROPOSED / AGENT_PROPOSED (1) > OTHER (0).
 */
export function getLifecycleTier(status?: string | null): number {
  if (!status) return 0;
  const normalized = status.toUpperCase();
  switch (normalized) {
    case "LAUNCHED":
    case "LAUNCH_CANDIDATE":
      return 3;
    case "CURATED":
      return 2;
    case "PROPOSED":
    case "AGENT_PROPOSED":
      return 1;
    default:
      return 0;
  }
}

/**
 * Maps lifecycle state to its expected user-facing next state string:
 * - PROPOSED / AGENT_PROPOSED -> "AWAITING CURATION"
 * - CURATED -> "CURATED · READY TO SCHEDULE"
 * - LAUNCH_CANDIDATE -> "IN LAUNCH QUEUE"
 * - Other states: uppercase as-is without guessing
 */
export function formatNextState(lifecycleState?: string | null): string {
  if (!lifecycleState) return "AWAITING CURATION";
  const normalized = lifecycleState.trim().toUpperCase();
  switch (normalized) {
    case "PROPOSED":
    case "AGENT_PROPOSED":
      return "AWAITING CURATION";
    case "CURATED":
      return "CURATED · READY TO SCHEDULE";
    case "LAUNCH_CANDIDATE":
      return "IN LAUNCH QUEUE";
    default:
      return normalized;
  }
}

/**
 * Deterministically selects the featured pairing and detects ties.
 *
 * Selection rules:
 * a. Ignore ARCHIVED (rejected pairings must never be featured).
 * b. Lifecycle tier: LAUNCH_CANDIDATE / LAUNCHED > CURATED > PROPOSED.
 * c. Asset symbol = topSymbol (top opportunity stock preferred).
 * d. Highest pairScore.
 * e. Alphabetical order of memeSymbol (tie-breaker).
 *
 * If there is a tie in top lifecycle stage and score for the candidate pool,
 * tiedCount > 1 and isTied = true.
 *
 * alternatives: other non-archived candidates for the same stock, sorted deterministically.
 */
export function selectFeaturedPairing(
  pairings?: Pairing[] | null,
  topSymbol?: string | null,
): FeaturedPairingResult {
  const valid = (pairings ?? []).filter((p) => p.status !== "ARCHIVED");
  if (valid.length === 0) {
    return { pairing: null, tiedCount: 0, isTied: false, alternatives: [] };
  }

  // Filter to pairings matching top opportunity symbol if present and available
  const matchingStock = topSymbol
    ? valid.filter((p) => p.stockSymbol === topSymbol)
    : [];
  const candidatePool = matchingStock.length > 0 ? matchingStock : valid;

  const sortedCandidates = [...candidatePool].sort((a, b) => {
    // 1. Lifecycle tier
    const tierDiff = getLifecycleTier(b.status) - getLifecycleTier(a.status);
    if (tierDiff !== 0) return tierDiff;

    // 2. Pair score descending
    const scoreDiff = b.pairScore - a.pairScore;
    if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

    // 3. Alphabetical memeSymbol ascending
    const symA = a.symbol || a.memeName;
    const symB = b.symbol || b.memeName;
    return symA.localeCompare(symB);
  });

  const featured = sortedCandidates[0] ?? null;
  if (!featured) {
    return { pairing: null, tiedCount: 0, isTied: false, alternatives: [] };
  }

  const topTier = getLifecycleTier(featured.status);
  const topScore = featured.pairScore;

  const tiedCandidates = sortedCandidates.filter(
    (p) =>
      getLifecycleTier(p.status) === topTier &&
      Math.abs(p.pairScore - topScore) < 0.001,
  );
  const tiedCount = tiedCandidates.length;
  const isTied = tiedCount > 1;

  // Alternatives: other non-archived candidates for the same featured stock
  const alternatives = valid
    .filter(
      (p) =>
        p.stockSymbol === featured.stockSymbol &&
        p.symbol !== featured.symbol &&
        p.slug !== featured.slug,
    )
    .sort((a, b) => {
      const tierDiff = getLifecycleTier(b.status) - getLifecycleTier(a.status);
      if (tierDiff !== 0) return tierDiff;
      const scoreDiff = b.pairScore - a.pairScore;
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
      return (a.symbol || a.memeName).localeCompare(b.symbol || b.memeName);
    });

  return {
    pairing: featured,
    tiedCount,
    isTied,
    alternatives,
  };
}
