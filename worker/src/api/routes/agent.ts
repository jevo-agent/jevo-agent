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

    // 3. Count completed cycles for cycle number
    const completedCycles = await db
      .select({ id: agentCycles.id })
      .from(agentCycles)
      .where(eq(agentCycles.status, "COMPLETED"));

    const cycleNumber = Math.max(1, completedCycles.length);

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

    if (latestEvents.length === 0) {
      latestEvents.push({
        id: "evt-init-runtime",
        timestamp: new Date().toISOString(),
        type: "OBSERVE",
        subject: "SYSTEM",
        summary: "SYSTEM_INITIALIZED",
      });
    }

    const lastScanTime = latestCycle?.completedAt ?? latestCycle?.startedAt ?? new Date();
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
      activeCycle: cycleNumber,
      scanProgress: latestCycle?.status === "RUNNING" ? 50 : 100,
      assetsScanned: latestCycle?.assetsScanned ?? activeAssets.length,
      assetsInUniverse: Math.max(1, activeAssets.length),
      signalsProcessed: latestCycle?.signalsProcessed ?? 29,
      narrativesDetected: 14,
      materiallyChangedNarratives: 4,
      decisionsProcessed: decisionsCount,
      qualifiedCandidates: proposedPairings.length,
      highConvictionCandidates: highConvictionCount,
      dataFreshness: "REALTIME_STREAM",
      lastScanAt: lastScanTime.toISOString(),
      lastDecisionAgeSeconds,
      nextCycleInSeconds: 300,
      networkLabel: "Robinhood Chain Testnet",
      latestEvents,
    };

    return reply.send(formatResponse(runtimeStatus));
  });
};
