import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { agentConfigVersions } from "../db/schema";
import { logger } from "../observability/logger";

export const scoreWeightsSchema = z
  .object({
    marketMomentum: z.number().min(0).max(1),
    narrativeMomentum: z.number().min(0).max(1),
    socialVelocity: z.number().min(0).max(1),
    culturalRelevance: z.number().min(0).max(1),
    memeCompatibility: z.number().min(0).max(1),
    cryptoAdjacency: z.number().min(0).max(1),
    pairCompatibility: z.number().min(0).max(1),
  })
  .refine(
    (weights) => {
      const sum =
        weights.marketMomentum +
        weights.narrativeMomentum +
        weights.socialVelocity +
        weights.culturalRelevance +
        weights.memeCompatibility +
        weights.cryptoAdjacency +
        weights.pairCompatibility;
      // Allow slight floating point tolerance (e.g. 0.9999 to 1.0001)
      return Math.abs(sum - 1.0) < 0.001;
    },
    { message: "Weights must sum to 1.0" },
  );

export type ScoreWeights = z.infer<typeof scoreWeightsSchema>;

/**
 * Default ranking weights adhering to Section 8:
 * - marketMomentum (0.15) - Deterministic
 * - narrativeMomentum (0.20) - Jev
 * - socialVelocity (0.15) - Deterministic
 * - culturalRelevance (0.15) - Jev
 * - memeCompatibility (0.15) - Jev
 * - cryptoAdjacency (0.10) - Jev
 * - pairCompatibility (0.10) - Jev
 * Total: 1.00
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  marketMomentum: 0.15,
  narrativeMomentum: 0.2,
  socialVelocity: 0.15,
  culturalRelevance: 0.15,
  memeCompatibility: 0.15,
  cryptoAdjacency: 0.1,
  pairCompatibility: 0.1,
};

export const DEFAULT_AGENT_CONFIG = {
  id: "config-default-v1",
  weights: DEFAULT_SCORE_WEIGHTS,
  jevModelVersion: "jev-2026-08",
  jevPromptVersion: "prompt-v1.0",
  createdBy: "SYSTEM_BOOTSTRAP",
};

export interface ActiveWeightsResult {
  configId: string;
  weights: ScoreWeights;
  modelVersion: string;
  promptVersion: string;
}

/**
 * Reads the latest active weights from agent_config_versions table.
 * If the table is empty, auto-bootstraps DEFAULT_AGENT_CONFIG.
 * Weights are never hardcoded in scoring arithmetic.
 */
export async function getActiveWeights(client = db): Promise<ActiveWeightsResult> {
  const rows = await client
    .select()
    .from(agentConfigVersions)
    .orderBy(desc(agentConfigVersions.activeFrom))
    .limit(1);

  if (rows.length > 0) {
    const row = rows[0];
    const parsedWeights = scoreWeightsSchema.parse(row.weights);
    return {
      configId: row.id,
      weights: parsedWeights,
      modelVersion: row.jevModelVersion,
      promptVersion: row.jevPromptVersion,
    };
  }

  // If table is empty, bootstrap the default config version
  logger.info("agent_config_versions is empty. Bootstrapping default configuration...");
  await client
    .insert(agentConfigVersions)
    .values({
      id: DEFAULT_AGENT_CONFIG.id,
      weights: DEFAULT_AGENT_CONFIG.weights,
      jevModelVersion: DEFAULT_AGENT_CONFIG.jevModelVersion,
      jevPromptVersion: DEFAULT_AGENT_CONFIG.jevPromptVersion,
      createdBy: DEFAULT_AGENT_CONFIG.createdBy,
    })
    .onConflictDoNothing();

  return {
    configId: DEFAULT_AGENT_CONFIG.id,
    weights: DEFAULT_SCORE_WEIGHTS,
    modelVersion: DEFAULT_AGENT_CONFIG.jevModelVersion,
    promptVersion: DEFAULT_AGENT_CONFIG.jevPromptVersion,
  };
}

/**
 * Creates and activates a new configuration version in agent_config_versions.
 */
export async function createConfigVersion(
  params: {
    id: string;
    weights: ScoreWeights;
    jevModelVersion?: string;
    jevPromptVersion?: string;
    createdBy?: string;
  },
  client = db,
): Promise<ActiveWeightsResult> {
  const validatedWeights = scoreWeightsSchema.parse(params.weights);
  const modelVersion = params.jevModelVersion ?? "jev-2026-08";
  const promptVersion = params.jevPromptVersion ?? "prompt-v1.0";
  const createdBy = params.createdBy ?? "ADMIN";

  await client
    .insert(agentConfigVersions)
    .values({
      id: params.id,
      weights: validatedWeights,
      jevModelVersion: modelVersion,
      jevPromptVersion: promptVersion,
      createdBy,
    })
    .onConflictDoUpdate({
      target: agentConfigVersions.id,
      set: {
        weights: validatedWeights,
        jevModelVersion: modelVersion,
        jevPromptVersion: promptVersion,
        createdBy,
      },
    });

  return {
    configId: params.id,
    weights: validatedWeights,
    modelVersion,
    promptVersion,
  };
}
