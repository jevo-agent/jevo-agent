import { randomUUID } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/client";
import { pairingCandidates, pairingHistory } from "../../../db/schema";
import { formatResponse } from "../../envelope";
import { recordOperatorProtocolEvent } from "./common";

const editPairingBodySchema = z.object({
  memeSymbol: z.string().min(1).optional(),
  thesis: z
    .object({
      whyStock: z.string().optional(),
      whyMeme: z.string().optional(),
      whyPair: z.string().optional(),
      whyNow: z.string().optional(),
    })
    .optional(),
});

export const adminPairingRoutes: FastifyPluginAsync = async (fastify) => {
  // 3a. POST /api/v1/admin/pairings/:id/approve
  fastify.post("/pairings/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [candidate] = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.id, id))
      .limit(1);

    if (!candidate) {
      reply.status(404);
      return {
        statusCode: 404,
        error: "Not Found",
        message: `Pairing candidate ${id} not found`,
      };
    }

    const fromState = candidate.lifecycleState;
    const toState = "CURATED";
    const now = new Date();

    // 1. Update pairing candidate lifecycleState
    await db
      .update(pairingCandidates)
      .set({ lifecycleState: toState })
      .where(eq(pairingCandidates.id, id));

    // 2. Record state transition in pairing_history (actor: OPERATOR)
    await db.insert(pairingHistory).values({
      id: `ph-${randomUUID().slice(0, 8)}`,
      pairingCandidateId: id,
      fromState,
      toState,
      actor: "OPERATOR",
      transitionedAt: now,
    });

    // 3. Publish protocol event for operator audit
    await recordOperatorProtocolEvent("PAIRING_CURATED", {
      subjectType: "pairing",
      subjectId: id,
      payload: {
        candidateId: id,
        symbol: candidate.symbol,
        memeSymbol: candidate.memeSymbol,
        fromState,
        toState,
      },
    });

    reply.status(200);
    return formatResponse({
      id,
      symbol: candidate.symbol,
      memeSymbol: candidate.memeSymbol,
      lifecycleState: toState,
      approved: true,
    });
  });

  // 3b. POST /api/v1/admin/pairings/:id/reject
  fastify.post("/pairings/:id/reject", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [candidate] = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.id, id))
      .limit(1);

    if (!candidate) {
      reply.status(404);
      return {
        statusCode: 404,
        error: "Not Found",
        message: `Pairing candidate ${id} not found`,
      };
    }

    const fromState = candidate.lifecycleState;
    const toState = "ARCHIVED";
    const now = new Date();

    // 1. Update pairing candidate lifecycleState
    await db
      .update(pairingCandidates)
      .set({ lifecycleState: toState })
      .where(eq(pairingCandidates.id, id));

    // 2. Record state transition in pairing_history (actor: OPERATOR)
    await db.insert(pairingHistory).values({
      id: `ph-${randomUUID().slice(0, 8)}`,
      pairingCandidateId: id,
      fromState,
      toState,
      actor: "OPERATOR",
      transitionedAt: now,
    });

    // 3. Publish protocol event for operator audit
    await recordOperatorProtocolEvent("PAIRING_ARCHIVED", {
      subjectType: "pairing",
      subjectId: id,
      payload: {
        candidateId: id,
        symbol: candidate.symbol,
        memeSymbol: candidate.memeSymbol,
        fromState,
        toState,
      },
    });

    reply.status(200);
    return formatResponse({
      id,
      symbol: candidate.symbol,
      memeSymbol: candidate.memeSymbol,
      lifecycleState: toState,
      rejected: true,
    });
  });

  // 4. POST /api/v1/admin/pairings/:id/edit
  fastify.post("/pairings/:id/edit", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [candidate] = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.id, id))
      .limit(1);

    if (!candidate) {
      reply.status(404);
      return {
        statusCode: 404,
        error: "Not Found",
        message: `Pairing candidate ${id} not found`,
      };
    }

    const parsed = editPairingBodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid body for pairing edit",
        issues: parsed.error.issues,
      };
    }

    const body = parsed.data;
    const currentThesis = (candidate.thesis as Record<string, unknown>) ?? {};
    const updatedThesis = {
      ...currentThesis,
      ...(body.thesis ?? {}),
    };
    const updatedMemeSymbol = body.memeSymbol ?? candidate.memeSymbol;

    // Update row directly without changing lifecycleState
    await db
      .update(pairingCandidates)
      .set({
        memeSymbol: updatedMemeSymbol,
        thesis: updatedThesis as any,
      })
      .where(eq(pairingCandidates.id, id));

    // Publish protocol_event for audit log (NO pairing_history insertion per spec)
    await recordOperatorProtocolEvent("PAIRING_EDITED", {
      subjectType: "pairing",
      subjectId: id,
      payload: {
        candidateId: id,
        previousMemeSymbol: candidate.memeSymbol,
        updatedMemeSymbol,
        thesisEdits: body.thesis ?? {},
      },
    });

    reply.status(200);
    return formatResponse({
      id,
      symbol: candidate.symbol,
      memeSymbol: updatedMemeSymbol,
      thesis: updatedThesis,
      lifecycleState: candidate.lifecycleState,
    });
  });
};
