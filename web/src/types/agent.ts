import type { z } from "zod";

import type { agentEventSchema, agentRuntimeSchema, memoryRecordSchema } from "@/schemas/protocol";

export type AgentRuntime = z.infer<typeof agentRuntimeSchema>;
export type AgentEvent = z.infer<typeof agentEventSchema>;
export type MemoryRecord = z.infer<typeof memoryRecordSchema>;
