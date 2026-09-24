import type { z } from "zod";

import type { decisionTraceSchema, signalSchema, stockSchema } from "@/schemas/protocol";

export type Stock = z.infer<typeof stockSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type DecisionTrace = z.infer<typeof decisionTraceSchema>;
