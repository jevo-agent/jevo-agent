import type { z } from "zod";

import type { launchSchema, policyCheckSchema } from "@/schemas/protocol";

export type Launch = z.infer<typeof launchSchema>;
export type PolicyCheck = z.infer<typeof policyCheckSchema>;
