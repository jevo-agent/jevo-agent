import type { MemeConcept } from "@jevo/protocol-types";
import { db } from "../db/client";
import { memeConcepts } from "../db/schema";

/**
 * Extracts searchable lowercase keyword tags from an asset symbol and narrative signals.
 */
export function extractTagsFromSignals(symbol: string, signals: string[]): string[] {
  const tagSet = new Set<string>();

  // Add asset symbol as a tag
  tagSet.add(symbol.toLowerCase().trim());

  // Tokenize signal labels
  for (const signal of signals) {
    const words = signal
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    for (const word of words) {
      tagSet.add(word);
    }
  }

  return Array.from(tagSet);
}

/**
 * Queries the curated `meme_concepts` table and ranks matching concepts by tag overlap.
 * Section 10: "Meme concepts are retrieved, not freely invented by Jev.
 * A small curated meme_concepts table is queried for candidates whose tags overlap
 * the stock's current top narrative signals (top 2-4 candidates)."
 *
 * If the table is empty or no candidates match, cleanly returns an empty array.
 */
export async function findMemeConceptsByTagOverlap(
  queryTags: string[],
  client = db,
  limit = 4,
): Promise<MemeConcept[]> {
  const normalizedQueryTags = new Set(queryTags.map((t) => t.toLowerCase().trim()));

  if (normalizedQueryTags.size === 0) {
    return [];
  }

  // Retrieve all curated concepts from team-maintained table
  const allConcepts = await client.select().from(memeConcepts);

  if (allConcepts.length === 0) {
    return [];
  }

  const scoredConcepts: Array<{ concept: MemeConcept; overlap: number }> = [];

  for (const row of allConcepts) {
    const conceptTags = Array.isArray(row.tags) ? row.tags : [];
    let overlap = 0;

    for (const tag of conceptTags) {
      if (normalizedQueryTags.has(tag.toLowerCase().trim())) {
        overlap++;
      }
    }

    if (overlap > 0) {
      scoredConcepts.push({
        concept: {
          id: row.id,
          name: row.name,
          tags: conceptTags,
          notes: row.notes ?? undefined,
          createdAt: row.createdAt.toISOString(),
        },
        overlap,
      });
    }
  }

  // Sort by tag overlap DESC, tie-breaker: concept name ASC
  scoredConcepts.sort((a, b) => {
    if (b.overlap !== a.overlap) {
      return b.overlap - a.overlap;
    }
    return a.concept.name.localeCompare(b.concept.name);
  });

  return scoredConcepts.slice(0, limit).map((sc) => sc.concept);
}
