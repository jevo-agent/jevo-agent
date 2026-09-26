import { env } from "../config/env";
import { DecisionEngine } from "./DecisionEngine";
import type { JevProvider } from "./JevProvider";
import { MockJevProvider } from "./MockJevProvider";
import { RealJevProvider } from "./RealJevProvider";

export * from "./schemas";
export * from "./JevProvider";
export * from "./MockJevProvider";
export * from "./RealJevProvider";
export * from "./DecisionEngine";

export function createDecisionEngine(
  mode: "mock" | "real" = env.JEV_MODE,
): DecisionEngine {
  const provider: JevProvider = mode === "real" ? new RealJevProvider() : new MockJevProvider();
  return new DecisionEngine(provider);
}
