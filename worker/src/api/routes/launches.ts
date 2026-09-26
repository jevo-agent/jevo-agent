import type { FastifyPluginAsync } from "fastify";
import type { Launch, LaunchStage } from "@jevo/protocol-types";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { launchCandidates, launchCycles, pairingCandidates } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface LaunchIdParams {
  id: string;
}

const STAGE_ORDER: Record<string, { id: LaunchStage; requirement: string }> = {
  "T-24H": {
    id: "CANDIDATE_SELECTED",
    requirement: "Candidate selection is recorded in the active launch cycle.",
  },
  "T-18H": {
    id: "NARRATIVE_VALIDATION",
    requirement: "The selected narrative must remain valid before pair validation.",
  },
  "T-12H": {
    id: "PAIRING_VALIDATION",
    requirement: "Complete pair and policy validation before contract preparation.",
  },
  "T-06H": {
    id: "CONTRACT_PREPARATION",
    requirement: "Use only the approved metadata and policy-bounded execution payload.",
  },
  "T-01H": {
    id: "FINAL_POLICY_CHECK",
    requirement: "All policy checks and guardian approval must be complete before execution.",
  },
  "T-00": {
    id: "CONTROLLED_EXECUTION",
    requirement: "A backend-driven approval and execution event is required; no automatic transition occurs.",
  },
};

const BASE_POLICY_CHECKS = [
  { id: "policy-stock", label: "Valid Stock Token", description: "Canonical asset identity verified." },
  { id: "policy-pair", label: "Approved Pairing Asset", description: "Pairing asset allowed by mock adapter configuration." },
  { id: "policy-metadata", label: "Token Metadata", description: "Name, symbol, and metadata package valid." },
  { id: "policy-contract", label: "Contract Parameters", description: "Launch parameters are within the approved Phase 0 bounds." },
  { id: "policy-limits", label: "Launch Limits", description: "Policy limits respected." },
  { id: "policy-duplicate", label: "Duplicate Check", description: "No conflicting token candidate was detected." },
  { id: "policy-permission", label: "Agent Permission", description: "Restricted executor permission is valid for the approved action." },
  { id: "policy-simulation", label: "Transaction Simulation", description: "Preflight simulation returned no blocking error." },
];

export function mapRowToLaunch(
  candidate: typeof launchCandidates.$inferSelect,
  cycleRows: (typeof launchCycles.$inferSelect)[],
  pairing?: typeof pairingCandidates.$inferSelect,
): Launch {
  const now = Date.now();
  const deadlineMs = new Date(candidate.stageDeadlineAt).getTime();
  const countdownSeconds = Math.max(0, Math.floor((deadlineMs - now) / 1000));

  let readiness: "READY" | "PENDING" | "BLOCKED" = "PENDING";
  if (candidate.readiness === "PAUSED") {
    readiness = "BLOCKED";
  } else if (candidate.readiness === "READY") {
    readiness = "READY";
  } else {
    readiness = "PENDING";
  }

  // 6 checklist stages from launch_cycles
  const stages = cycleRows.length > 0
    ? cycleRows.map((cr) => {
        const meta = STAGE_ORDER[cr.stageLabel] ?? {
          id: cr.stageLabel as any,
          requirement: "Stage validation requirement.",
        };
        return {
          id: meta.id,
          scheduledPoint: cr.stageLabel,
          status: cr.status as "COMPLETE" | "ACTIVE" | "PENDING",
          description: cr.description,
          requirement: meta.requirement,
        };
      })
    : [
        { id: "CANDIDATE_SELECTED" as const, scheduledPoint: "T-24H", status: "COMPLETE" as const, description: "Opportunity and pair thesis were locked for launch review.", requirement: "Candidate selection is recorded in the active launch cycle." },
        { id: "NARRATIVE_VALIDATION" as const, scheduledPoint: "T-18H", status: "PENDING" as const, description: "Narrative pressure and the why-now context remained above the launch threshold.", requirement: "The selected narrative must remain valid before pair validation." },
        { id: "PAIRING_VALIDATION" as const, scheduledPoint: "T-12H", status: "PENDING" as const, description: "Pairing score, metadata, Stock Token identity, and policy constraints are being validated.", requirement: "Complete pair and policy validation before contract preparation." },
        { id: "CONTRACT_PREPARATION" as const, scheduledPoint: "T-06H", status: "PENDING" as const, description: "Approved launch parameters will be assembled for the Launch Executor and Pons adapter.", requirement: "Use only the approved metadata and policy-bounded execution payload." },
        { id: "FINAL_POLICY_CHECK" as const, scheduledPoint: "T-01H", status: "PENDING" as const, description: "Permissions, transaction simulation, launch limits, and guardian requirements will be reviewed.", requirement: "All policy checks and guardian approval must be complete before execution." },
        { id: "CONTROLLED_EXECUTION" as const, scheduledPoint: "T-00", status: "PENDING" as const, description: "The approved action may be submitted through the restricted Launch Executor.", requirement: "A backend-driven approval and execution event is required; no automatic transition occurs." },
      ];

  // 8 policy checks based on checksPassed / checksTotal
  const policyChecks = BASE_POLICY_CHECKS.map((chk, idx) => ({
    id: chk.id,
    label: chk.label,
    description: chk.description,
    status: readiness === "BLOCKED"
      ? ("BLOCKED" as const)
      : idx < candidate.checksPassed
        ? ("PASSED" as const)
        : ("PENDING" as const),
  }));

  const slug = pairing
    ? `${pairing.symbol.toLowerCase()}-${pairing.memeSymbol.replace(/^\$/, "").toLowerCase()}`
    : candidate.pairingCandidateId.toLowerCase();

  const tokenName = pairing ? pairing.memeSymbol.replace(/^\$/, "") : "TOKEN";
  const tokenSymbol = pairing ? pairing.memeSymbol : "$TOKEN";
  const pairingAsset = pairing ? `${pairing.symbol} Stock Token` : "Stock Token";

  return {
    cycleId: candidate.id,
    selectedPairingSlug: slug,
    stage: candidate.stage as any,
    countdownSeconds,
    readiness,
    stages,
    policyChecks,
    guardianRequirement: { required: true, status: "REQUIRED" },
    wallet: {
      label: "JEVO Agent Wallet",
      displayAddress: "0x7A4f...91B2",
      network: "Robinhood Chain",
      permission: "Launch Executor",
      status: "Authorized",
      emergencyPause: "AVAILABLE",
    },
    contracts: [
      { label: "Launch Executor", displayAddress: "0xEXE...204", referenceState: "Phase 0 reference" },
      { label: "Token Factory", displayAddress: "0xFAC...781", referenceState: "Phase 0 reference" },
      { label: "Policy Contract", displayAddress: "0xPOL...319", referenceState: "Phase 0 reference" },
      { label: "Pons Adapter", displayAddress: "0xPON...447", referenceState: "Phase 0 reference" },
    ],
    token: {
      name: tokenName,
      symbol: tokenSymbol,
      pairingAsset,
      network: "Robinhood Chain",
      launchMechanism: "Pons",
      contractState: "Pending",
    },
    activity: [
      {
        id: `launch-act-${candidate.id}-01`,
        timestamp: new Date().toISOString(),
        type: "SELECTION",
        summary: `Candidate selected. ${pairing?.symbol ?? "Asset"} × ${tokenSymbol} entered launch cycle ${candidate.id}.`,
      },
    ],
    transactionState: "NOT_SUBMITTED",
  };
}

export const launchesRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/launches
  fastify.get("/launches", async (request, reply) => {
    const rows = await db.select().from(launchCandidates);

    if (rows.length === 0) {
      return reply.send(formatResponse([], { total: 0 }));
    }

    const candidateIds = rows.map((r) => r.id);
    const pairingIds = rows.map((r) => r.pairingCandidateId);

    const [allCycleRows, allPairings] = await Promise.all([
      db.select().from(launchCycles).where(inArray(launchCycles.launchCandidateId, candidateIds)),
      db.select().from(pairingCandidates).where(inArray(pairingCandidates.id, pairingIds)),
    ]);

    const cyclesByCandidate = new Map<string, typeof allCycleRows>();
    for (const c of allCycleRows) {
      const list = cyclesByCandidate.get(c.launchCandidateId) ?? [];
      list.push(c);
      cyclesByCandidate.set(c.launchCandidateId, list);
    }

    const pairingsById = new Map<string, (typeof allPairings)[0]>();
    for (const p of allPairings) {
      pairingsById.set(p.id, p);
    }

    const items: Launch[] = rows.map((r) =>
      mapRowToLaunch(r, cyclesByCandidate.get(r.id) ?? [], pairingsById.get(r.pairingCandidateId)),
    );

    return reply.send(formatResponse(items, { total: items.length }));
  });

  // 2. GET /api/v1/launches/:id
  fastify.get<{ Params: LaunchIdParams }>("/launches/:id", async (request, reply) => {
    const { id } = request.params;
    if (!id) {
      return reply.status(400).send({ message: "ID parameter required" });
    }

    let [row] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, id))
      .limit(1);

    if (!row) {
      // Lookup by pairing id or candidate
      const [pairing] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.id, id))
        .limit(1);

      if (pairing) {
        [row] = await db
          .select()
          .from(launchCandidates)
          .where(eq(launchCandidates.pairingCandidateId, pairing.id))
          .limit(1);
      }
    }

    if (!row) {
      return reply.status(404).send({ message: `Launch candidate ${id} not found` });
    }

    const [cycleRows, [pairing]] = await Promise.all([
      db.select().from(launchCycles).where(eq(launchCycles.launchCandidateId, row.id)),
      db.select().from(pairingCandidates).where(eq(pairingCandidates.id, row.pairingCandidateId)).limit(1),
    ]);

    const result = mapRowToLaunch(row, cycleRows, pairing);
    return reply.send(formatResponse(result));
  });
};
