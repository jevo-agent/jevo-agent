import type { AgentCycle, AgentRuntime, MemoryComparison, MemoryRecord, ProviderReference } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

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
}
