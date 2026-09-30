import type { FastifyPluginAsync } from "fastify";
import type { AgentEvent, AgentRuntime } from "@jevo/protocol-types";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import {
  agentCycles,
  assets,
  jevDecisions,
  pairingCandidates,
  protocolEvents,
} from "../../db/schema";
import { formatResponse } from "../envelope";
import { isAgentCycleQueuePaused } from "../../jobs/scheduler";

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/agent/status", async (request, reply) => {
    // 1. Get latest cycle
    const [latestCycle] = await db
      .select()
      .from(agentCycles)
      .orderBy(desc(agentCycles.startedAt))
      .limit(1);

    // 2. Count active assets in universe
    const activeAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.active, true));

    if (!latestCycle) {
      return reply.status(409).send({
        message: "No canonical agent cycle is available yet",
      });
    }

    // 4. Count decisions and qualified candidates in latest cycle
    let decisionsCount = 0;
    let highConvictionCount = 0;
    if (latestCycle) {
      const decisions = await db
        .select()
        .from(jevDecisions)
        .where(eq(jevDecisions.cycleId, latestCycle.id));
      decisionsCount = decisions.length;
      highConvictionCount = decisions.filter((d) => d.decision === "PROMOTE").length;
    }

    const proposedPairings = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.lifecycleState, "PROPOSED"));

    // 5. Retrieve latest events for decision trace
    const recentProtocolEvents = await db
      .select()
      .from(protocolEvents)
      .orderBy(desc(protocolEvents.createdAt))
      .limit(5);

    const latestEvents: AgentEvent[] = recentProtocolEvents.map((pe) => {
      // Map protocol event type to frontend eventTypeSchema
      let mappedType: AgentEvent["type"] = "ACTION";
      if (pe.eventType.includes("SCAN") || pe.eventType.includes("ANALYZED")) {
        mappedType = "OBSERVE";
      } else if (pe.eventType.includes("JEV")) {
        mappedType = "JEV_DECISION";
      } else if (pe.eventType.includes("PAIRING")) {
        mappedType = "PAIRING";
      } else if (pe.eventType.includes("RANKING")) {
        mappedType = "SIGNAL";
      } else if (pe.eventType.includes("LAUNCH")) {
        mappedType = "LAUNCH";
      }

      return {
        id: pe.eventId,
        timestamp: pe.createdAt.toISOString(),
        type: mappedType,
        subject: pe.subjectId ?? "SYSTEM",
        summary: pe.eventType,
      };
    });

    const lastScanTime = latestCycle.completedAt ?? latestCycle.startedAt;
    const lastDecisionAgeSeconds = Math.max(
      0,
      Math.floor((Date.now() - lastScanTime.getTime()) / 1000),
    );

    const isPaused = await isAgentCycleQueuePaused();

    const runtimeStatus: AgentRuntime = {
      status: isPaused ? "PAUSED" : "ONLINE",
      jevStatus: isPaused ? "PAUSED" : "ACTIVE",
      currentOperation: isPaused
        ? "PAUSED"
        : latestCycle?.status === "RUNNING"
          ? "ANALYZING_MARKET"
          : "STANDBY",
      // Cycle ids are opaque persisted identifiers (for example
      // `cycle-delta-...`), so do not turn them into a synthetic counter.
      activeCycle: latestCycle.id,
      scanProgress: latestCycle?.status === "RUNNING" ? 50 : 100,
      assetsScanned: latestCycle?.assetsScanned ?? activeAssets.length,
      assetsInUniverse: activeAssets.length,
      signalsProcessed: latestCycle?.signalsProcessed ?? 0,
      // Narrative counts are not persisted by the current scanner contract.
      narrativesDetected: null,
      materiallyChangedNarratives: null,
      decisionsProcessed: decisionsCount,
      qualifiedCandidates: proposedPairings.length,
      highConvictionCandidates: highConvictionCount,
      dataFreshness: "REALTIME_STREAM",
      lastScanAt: lastScanTime.toISOString(),
      lastDecisionAgeSeconds,
      // The scheduler does not currently expose a deterministic next-run
      // deadline; zero means unavailable rather than a fabricated countdown.
      nextCycleInSeconds: null,
      // Authoritative network target
      networkLabel: "ROBINHOOD CHAIN",
      latestEvents,
    };

    return reply.send(formatResponse(runtimeStatus));
  });
};
