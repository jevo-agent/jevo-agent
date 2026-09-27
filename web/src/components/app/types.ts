import type { AgentCycle, AgentRuntime, MemoryComparison, MemoryRecord, ProviderReference } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

export type DomainStatus = {
  agent: "ok" | "loading" | "error";
  opportunities: "ok" | "loading" | "error";
  pairings: "ok" | "loading" | "error";
  launches: "ok" | "loading" | "error";
  memory: "ok" | "loading" | "error";
  cycles: "ok" | "loading" | "error";
};

export interface AppData {
  agent: AgentRuntime;
  assets: Stock[];
  ranking: string[];
  pairings: Pairing[];
  launch: Launch | null;
  memory: MemoryRecord[];
  featuredAsset: Stock;
  featuredPairing: Pairing | null;
  agentCycles: AgentCycle[];
  memoryComparison: MemoryComparison;
  providers: ProviderReference[];
  domainStatus?: DomainStatus;
}
