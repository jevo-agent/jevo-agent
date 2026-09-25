import type { z } from "zod";

import type { agentCycleSchema, agentEventSchema, agentRuntimeSchema, memoryComparisonSchema, memoryOverviewSchema, memoryRecordSchema, providerReferenceSchema } from "@/schemas/protocol";

export type AgentRuntime = z.infer<typeof agentRuntimeSchema>;
export type AgentEvent = z.infer<typeof agentEventSchema>;
export type MemoryRecord = z.infer<typeof memoryRecordSchema>;
export type AgentCycle = z.infer<typeof agentCycleSchema>;
export type MemoryOverview = z.infer<typeof memoryOverviewSchema>;
export type MemoryComparison = z.infer<typeof memoryComparisonSchema>;
export type ProviderReference = z.infer<typeof providerReferenceSchema>;
