import rawDeploymentsData from "@/data/deployments.json";
import rawDeps from "@/data/onchain-dependencies.json";

const MONITORED_COUNT = (rawDeps as { monitored: Array<{ address: string }> }).monitored.filter(
  (e) => /^0x[0-9a-fA-F]{40}$/.test(e.address),
).length;

export type NetworkType = "testnet" | "mainnet";
export type SupportedChainId = 46630 | 4663;

export interface RawDeploymentRecord {
  network: string;
  chainId: number;
  name: string;
  address: string;
  txHash: string | null;
  deployer: string | null;
  deployedAt: string | null;
  note: string | null;
}

export interface ValidatedDeployment {
  network: NetworkType;
  chainId: SupportedChainId;
  name: string;
  address: string;
  txHash: string | null;
  deployer: string | null;
  deployedAt: string | null;
  note: string | null;
}

export interface PlannedContract {
  name: string;
  purpose: string;
  sourceDoc: string;
  status: string;
}

export const EXPLORER_BASE = {
  testnet: "https://explorer.testnet.chain.robinhood.com",
  mainnet: "https://robinhoodchain.blockscout.com",
} as const;

export const CHAIN_ID_MAP: Record<NetworkType, SupportedChainId> = {
  testnet: 46630,
  mainnet: 4663,
};

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;

export const STATIC_CONTRACTS_DISCLAIMER =
  "Addresses are public records. Verify on the explorer before relying on them. Contracts are not audited.";

export const PLANNED_CONTRACTS: readonly PlannedContract[] = [
  {
    name: "JEVO Agent Registry",
    purpose: "Canonical agent identity and protocol permission register.",
    sourceDoc: "BRIEF.md §23",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "JEVO Policy Controller",
    purpose: "Rule validation engine for autonomous cycle and launch constraints.",
    sourceDoc: "BRIEF.md §23, BackendHandoff §21",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "JEVO Launch Executor",
    purpose: "Execution engine for authorized token pairings and liquidity creation.",
    sourceDoc: "BRIEF.md §23, BackendHandoff §21",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "Token Factory",
    purpose: "ERC-20 paired token creation and initial distribution contract.",
    sourceDoc: "BRIEF.md §23, BackendHandoff §21",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "Launch Adapter",
    purpose: "Intermediary bridge for parameter formatting and execution staging.",
    sourceDoc: "BRIEF.md §23",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "Pons Adapter",
    purpose: "Integration interface for Pons custom pair market and liquidity bootstrapping.",
    sourceDoc: "BRIEF.md §23, §24",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "Emergency Pause / Guardian",
    purpose: "Multi-signature fail-safe and circuit breaker contract.",
    sourceDoc: "BRIEF.md §23",
    status: "PLANNED · NOT DEPLOYED",
  },
  {
    name: "Event Logger",
    purpose: "Immutable audit trail emitter for on-chain state transitions.",
    sourceDoc: "BRIEF.md §23",
    status: "PLANNED · NOT DEPLOYED",
  },
] as const;

export function validateDeployment(raw: unknown): ValidatedDeployment | null {
  if (!raw || typeof raw !== "object") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Deployments] Invalid deployment item: not an object", raw);
    }
    return null;
  }

  const item = raw as Partial<RawDeploymentRecord>;

  if (item.network !== "testnet" && item.network !== "mainnet") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Deployments] Invalid network "${item.network}": must be "testnet" or "mainnet"`);
    }
    return null;
  }

  const expectedChainId = CHAIN_ID_MAP[item.network];
  if (item.chainId !== expectedChainId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Deployments] Network "${item.network}" chainId mismatch: expected ${expectedChainId}, got ${item.chainId}`,
      );
    }
    return null;
  }

  if (typeof item.name !== "string" || item.name.trim().length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Deployments] Missing or empty deployment name");
    }
    return null;
  }

  if (typeof item.address !== "string" || !ADDRESS_REGEX.test(item.address.trim())) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Deployments] Invalid address "${item.address}": must match ^0x[0-9a-fA-F]{40}$`);
    }
    return null;
  }

  if (item.txHash !== null && item.txHash !== undefined) {
    if (typeof item.txHash !== "string" || !TX_HASH_REGEX.test(item.txHash.trim())) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Deployments] Invalid txHash "${item.txHash}": must match ^0x[0-9a-fA-F]{64}$ or be null`);
      }
      return null;
    }
  }

  if (item.deployer !== null && item.deployer !== undefined) {
    if (typeof item.deployer !== "string" || !ADDRESS_REGEX.test(item.deployer.trim())) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Deployments] Invalid deployer "${item.deployer}": must match ^0x[0-9a-fA-F]{40}$ or be null`);
      }
      return null;
    }
  }

  return {
    network: item.network,
    chainId: expectedChainId,
    name: item.name.trim(),
    address: item.address.trim(),
    txHash: item.txHash?.trim() ?? null,
    deployer: item.deployer?.trim() ?? null,
    deployedAt: item.deployedAt?.trim() ?? null,
    note: item.note?.trim() ?? null,
  };
}

export function getValidatedDeployments(
  data: { deployments?: unknown[] } = rawDeploymentsData,
): ValidatedDeployment[] {
  if (!data || !Array.isArray(data.deployments)) {
    return [];
  }

  const valid: ValidatedDeployment[] = [];
  for (const item of data.deployments) {
    const validated = validateDeployment(item);
    if (validated) {
      valid.push(validated);
    }
  }
  return valid;
}

export function getDeploymentsByNetwork(
  network: NetworkType,
  data?: { deployments?: unknown[] },
): ValidatedDeployment[] {
  return getValidatedDeployments(data).filter((item) => item.network === network);
}

export function getDeploymentSummary(deployments?: ValidatedDeployment[]): string {
  const list = deployments ?? getValidatedDeployments();
  const jevoCount = list.length;
  return `${jevoCount} JEVO · ${MONITORED_COUNT} MONITORED`;
}

export function getExplorerAddressUrl(network: NetworkType, address: string): string {
  return `${EXPLORER_BASE[network]}/address/${address}`;
}

export function getExplorerTxUrl(network: NetworkType, txHash: string): string {
  return `${EXPLORER_BASE[network]}/tx/${txHash}`;
}
