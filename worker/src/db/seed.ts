import { db, pool } from "./client";
import { assets } from "./schema";
import { logger } from "../observability/logger";

export const INITIAL_ASSETS = [
  {
    symbol: "NVDA",
    name: "NVIDIA Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000001",
    active: true,
  },
  {
    symbol: "TSLA",
    name: "Tesla Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000002",
    active: true,
  },
  {
    symbol: "PLTR",
    name: "Palantir Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000003",
    active: true,
  },
  {
    symbol: "AAPL",
    name: "Apple Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000004",
    active: true,
  },
  {
    symbol: "GME",
    name: "GameStop Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000005",
    active: true,
  },
  {
    symbol: "AMD",
    name: "AMD Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000006",
    active: true,
  },
  {
    symbol: "COIN",
    name: "Coinbase Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000007",
    active: true,
  },
];

export async function seedAssets() {
  logger.info("Seeding initial stock assets...");

  for (const asset of INITIAL_ASSETS) {
    await db
      .insert(assets)
      .values(asset)
      .onConflictDoUpdate({
        target: assets.symbol,
        set: {
          name: asset.name,
          stockTokenAddress: asset.stockTokenAddress,
          active: asset.active,
        },
      });
  }

  logger.info({ count: INITIAL_ASSETS.length }, "Initial stock assets seeded successfully");
}

if (import.meta.main) {
  seedAssets()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, "Seeding failed");
      await pool.end();
      process.exit(1);
    });
}
