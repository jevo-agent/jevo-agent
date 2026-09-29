import { randomUUID } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/client";
import {
  launchCandidates,
  launchCycles,
  pairingCandidates,
  pairingHistory,
} from "../../../db/schema";
import { formatResponse } from "../../envelope";
import { recordOperatorProtocolEvent } from "./common";

const scheduleLaunchBodySchema = z.object({
  pairingCandidateId: z.string().min(1),
});

export const LAUNCH_CHECKLIST_STAGES = [
  {
    stageLabel: "T-30H",
    description: "Opportunity and pair thesis were locked for launch review.",
    status: "COMPLETE" as const,
  },
  {
    stageLabel: "T-22H30",
    description: "Narrative pressure and the why-now context remained above the launch threshold.",
    status: "PENDING" as const,
  },
  {
    stageLabel: "T-15H",
    description: "Pairing score, metadata, Stock Token identity, and policy constraints are being validated.",
    status: "PENDING" as const,
  },
  {
    stageLabel: "T-07H30",
    description: "Approved launch parameters will be assembled for the Launch Executor and Pons adapter.",
    status: "PENDING" as const,
  },
  {
    stageLabel: "T-01H15",
    description: "Permissions, transaction simulation, launch limits, and guardian requirements will be reviewed.",
    status: "PENDING" as const,
  },
  {
    stageLabel: "T-00",
    description: "The approved action may be submitted through the restricted Launch Executor.",
    status: "PENDING" as const,
  },
];

export const adminLaunchRoutes: FastifyPluginAsync = async (fastify) => {
  // 5. POST /api/v1/admin/launches/schedule
  fastify.post("/launches/schedule", async (request, reply) => {
    const parsed = scheduleLaunchBodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid body. 'pairingCandidateId' is required",
        issues: parsed.error.issues,
      };
    }

    const { pairingCandidateId } = parsed.data;

    // Verify candidate exists
    const [candidate] = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.id, pairingCandidateId))
      .limit(1);

    if (!candidate) {
      reply.status(404);
      return {
        statusCode: 404,
        error: "Not Found",
        message: `Pairing candidate ${pairingCandidateId} not found`,
      };
    }

    // Must be in CURATED state, otherwise return 409 Conflict
    if (candidate.lifecycleState !== "CURATED") {
      reply.status(409);
      return {
        statusCode: 409,
        error: "Conflict",
        message: `Pairing candidate ${pairingCandidateId} must be in CURATED state to schedule launch (current: ${candidate.lifecycleState})`,
      };
    }

    // Check if launch candidate already exists
    const [existingLaunch] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.pairingCandidateId, pairingCandidateId))
      .limit(1);

    if (existingLaunch) {
      reply.status(409);
      return {
        statusCode: 409,
        error: "Conflict",
        message: `Launch candidate already scheduled for pairing ${pairingCandidateId} (id: ${existingLaunch.id})`,
      };
    }

    const launchId = `LC-${randomUUID().slice(0, 6).toUpperCase()}`;
    const now = new Date();
    const stageDeadlineAt = new Date(now.getTime() + 7.5 * 60 * 60 * 1000); // T-22H30 checkpoint: +7.5 hours

    // 1. Insert 1 row into launch_candidates
    await db.insert(launchCandidates).values({
      id: launchId,
      pairingCandidateId,
      stage: "CANDIDATE_SELECTED",
      readiness: "PREPARING",
      checksPassed: 0,
      checksTotal: 8,
      stageDeadlineAt,
      transactionStatus: "NOT_SUBMITTED",
    });

    // 2. Insert 6 rows into launch_cycles (T-30H COMPLETE, rest PENDING)
    await db.insert(launchCycles).values(
      LAUNCH_CHECKLIST_STAGES.map((s, idx) => ({
        id: `lc-stage-${launchId}-${idx + 1}`,
        launchCandidateId: launchId,
        stageLabel: s.stageLabel,
        description: s.description,
        status: s.status,
        completedAt: s.status === "COMPLETE" ? now : null,
      })),
    );

    // 3. Update pairing_candidates lifecycleState CURATED -> LAUNCH_CANDIDATE
    await db
      .update(pairingCandidates)
      .set({ lifecycleState: "LAUNCH_CANDIDATE" })
      .where(eq(pairingCandidates.id, pairingCandidateId));

    // 4. Record transition in pairing_history (actor: OPERATOR)
    await db.insert(pairingHistory).values({
      id: `ph-${randomUUID().slice(0, 8)}`,
      pairingCandidateId,
      fromState: "CURATED",
      toState: "LAUNCH_CANDIDATE",
      actor: "OPERATOR",
      transitionedAt: now,
    });

    // 5. Publish LAUNCH_SELECTED then COUNTDOWN_STARTED (two events, in this order)
    await recordOperatorProtocolEvent("LAUNCH_SELECTED", {
      subjectType: "launch",
      subjectId: launchId,
      payload: {
        launchCandidateId: launchId,
        pairingCandidateId,
        symbol: candidate.symbol,
        memeSymbol: candidate.memeSymbol,
      },
    });

    await recordOperatorProtocolEvent("COUNTDOWN_STARTED", {
      subjectType: "launch",
      subjectId: launchId,
      payload: {
        launchCandidateId: launchId,
        stage: "CANDIDATE_SELECTED",
        deadlineAt: stageDeadlineAt.toISOString(),
      },
    });

    reply.status(201);
    return formatResponse({
      id: launchId,
      pairingCandidateId,
      stage: "CANDIDATE_SELECTED",
      readiness: "PREPARING",
      stageDeadlineAt: stageDeadlineAt.toISOString(),
      checksPassed: 0,
      checksTotal: 8,
    });
  });

  // 7. POST /api/v1/admin/launches/:id/emergency-pause
  fastify.post("/launches/:id/emergency-pause", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [candidate] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, id))
      .limit(1);

    if (!candidate) {
      reply.status(404);
      return {
        statusCode: 404,
        error: "Not Found",
        message: `Launch candidate ${id} not found`,
      };
    }

    // Set readiness='PAUSED'
    await db
      .update(launchCandidates)
      .set({ readiness: "PAUSED" })
      .where(eq(launchCandidates.id, id));

    // Record operator audit event
    await recordOperatorProtocolEvent("LAUNCH_EMERGENCY_PAUSED", {
      subjectType: "launch",
      subjectId: id,
      payload: {
        launchCandidateId: id,
        previousReadiness: candidate.readiness,
        readiness: "PAUSED",
      },
    });

    reply.status(200);
    return formatResponse({
      id,
      stage: candidate.stage,
      readiness: "PAUSED",
      emergencyPaused: true,
    });
  });
};
