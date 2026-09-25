import { env } from "../config/env";
import { DecisionEngine } from "./DecisionEngine";
import type { JevProvider } from "./JevProvider";
import { MockJevProvider } from "./MockJevProvider";

export * from "./schemas";
export * from "./JevProvider";
export * from "./MockJevProvider";
export * from "./DecisionEngine";

export function createDecisionEngine(
  mode: "mock" | "real" = env.JEV_MODE,
): DecisionEngine {
  if (mode === "real") {
    // Real HTTP Jev adapter will be wired when real Jev API endpoints/keys are finalized (Section 22)
    throw new Error("Real JevProvider not yet configured. Set JEV_MODE=mock.");
  }

  const provider: JevProvider = new MockJevProvider();
  return new DecisionEngine(provider);
}
