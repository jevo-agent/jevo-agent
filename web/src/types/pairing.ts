import type { z } from "zod";

import type { pairingFactorSchema, pairingSchema } from "@/schemas/protocol";

export type Pairing = z.infer<typeof pairingSchema>;
export type PairingFactor = z.infer<typeof pairingFactorSchema>;
