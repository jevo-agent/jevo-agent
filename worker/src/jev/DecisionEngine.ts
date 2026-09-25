import { randomUUID } from "node:crypto";
import type { JevDecisionAction, JevDecisionRecord } from "@jevo/protocol-types";
import { db } from "../db/client";
import { jevDecisions } from "../db/schema";
import { logger } from "../observability/logger";
import type { JevProvider } from "./JevProvider";
import { rawJevChoiceResultSchema, rawJevScoreResultSchema } from "./schemas";

export class DecisionEngine {
  constructor(public readonly jev: JevProvider) {}

  /**
   * Calls Jev to evaluate an asset classification (PROMOTE, HOLD, DEMOTE).
   * Validates and strips free-text reasoning, then writes/upserts into `jev_decisions`.
   */
  async decideForAsset(
    cycleId: string | number,
    symbol: string,
    context: Record<string, unknown> = {},
  ): Promise<JevDecisionRecord> {
    const cycleIdStr = String(cycleId);
    const uppercaseSymbol = symbol.toUpperCase();
    const cycleLogger = logger.child({ cycleId: cycleIdStr, symbol: uppercaseSymbol });

    cycleLogger.debug("Evaluating Jev asset decision");

    // 1. Call Jev for structured choice
    const raw = await this.jev.evaluateChoice({
      context: {
        symbol: uppercaseSymbol,
        ...context,
      },
      options: ["PROMOTE", "HOLD", "DEMOTE"],
    });

    // 2. Validate and strip any chain-of-thought/reasoning fields
    const parsed = rawJevChoiceResultSchema.parse(raw);

    const now = new Date();
    const decisionRecord: JevDecisionRecord = {
      id: `jd-${uppercaseSymbol.toLowerCase()}-${cycleIdStr}-${randomUUID().slice(0, 8)}`,
      cycleId: cycleIdStr,
      symbol: uppercaseSymbol,
      decision: parsed.choice as JevDecisionAction,
      confidence: parsed.confidence,
      signals: parsed.signals,
      modelVersion: this.jev.version,
      createdAt: now.toISOString(),
    };

    // 3. Upsert into database: ON CONFLICT (cycle_id, symbol) DO UPDATE
    await db
      .insert(jevDecisions)
      .values({
        id: decisionRecord.id,
        cycleId: cycleIdStr,
        symbol: uppercaseSymbol,
        decision: decisionRecord.decision,
        confidence: decisionRecord.confidence,
        signals: decisionRecord.signals,
        modelVersion: decisionRecord.modelVersion,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [jevDecisions.cycleId, jevDecisions.symbol],
        set: {
          decision: decisionRecord.decision,
          confidence: decisionRecord.confidence,
          signals: decisionRecord.signals,
          modelVersion: decisionRecord.modelVersion,
          createdAt: now,
        },
      });

    cycleLogger.info(
      {
        decision: decisionRecord.decision,
        confidence: decisionRecord.confidence,
        signalsCount: decisionRecord.signals.length,
      },
      "Jev decision recorded successfully",
    );

    return decisionRecord;
  }

  /**
   * Calls Jev to evaluate qualitative score dimensions
   * (narrativeMomentum, culturalRelevance, memeCompatibility, cryptoAdjacency, pairCompatibility).
   */
  async evaluateQualitativeScores(
    symbol: string,
    context: Record<string, unknown> = {},
  ): Promise<Record<string, number>> {
    const raw = await this.jev.evaluateScore({
      context: { symbol: symbol.toUpperCase(), ...context },
      dimensions: [
        "narrativeMomentum",
        "culturalRelevance",
        "memeCompatibility",
        "cryptoAdjacency",
        "pairCompatibility",
      ],
    });

    const parsed = rawJevScoreResultSchema.parse(raw);
    return parsed.scores;
  }
}
