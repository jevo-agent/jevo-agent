import { db, pool } from "./client";
import { assets, memeConcepts } from "./schema";
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

export const CURATED_MEME_CONCEPTS = [
  {
    id: "mc-nvda-gpu",
    name: "$GPU",
    tags: ["nvda", "gpu", "ai", "infrastructure", "compute", "hardware", "chips"],
    notes: "AI infrastructure and GPU compute layer narrative",
  },
  {
    id: "mc-nvda-cuda",
    name: "$CUDA",
    tags: ["nvda", "cuda", "developer", "compute", "acceleration", "ai"],
    notes: "Developer compute and parallel acceleration ecosystem",
  },
  {
    id: "mc-nvda-compute",
    name: "$COMPUTE",
    tags: ["nvda", "compute", "datacenter", "chips", "hardware", "infrastructure"],
    notes: "Datacenter scale AI compute narrative",
  },
  {
    id: "mc-tsla-bot",
    name: "$BOT",
    tags: ["tsla", "bot", "robotics", "autonomy", "machines", "systems"],
    notes: "Robotics and autonomous systems narrative",
  },
  {
    id: "mc-tsla-auto",
    name: "$AUTO",
    tags: ["tsla", "auto", "ev", "autonomous", "mobility", "energy"],
    notes: "Autonomous mobility and EV energy narrative",
  },
  {
    id: "mc-pltr-eye",
    name: "$EYE",
    tags: ["pltr", "eye", "intelligence", "surveillance", "defense", "data", "software"],
    notes: "Intelligence software and defense surveillance narrative",
  },
  {
    id: "mc-gme-respawn",
    name: "$RESPAWN",
    tags: ["gme", "respawn", "retail", "meme", "reflexivity", "gaming", "comeback"],
    notes: "Retail reflexivity and gaming comeback culture",
  },
  {
    id: "mc-gme-comeback",
    name: "$COMEBACK",
    tags: ["gme", "comeback", "retail", "attention", "wallstreet", "meme"],
    notes: "Cyclical retail attention surge narrative",
  },
  {
    id: "mc-amd-silicon",
    name: "$SILICON",
    tags: ["amd", "silicon", "chip", "chips", "compute", "semiconductor", "hardware"],
    notes: "Chips and semiconductor compute infrastructure",
  },
  {
    id: "mc-coin-block",
    name: "$BLOCK",
    tags: ["coin", "block", "crypto", "rails", "exchange", "blockchain"],
    notes: "Crypto infrastructure and exchange culture narrative",
  },
  {
    id: "mc-aapl-garden",
    name: "$GARDEN",
    tags: ["aapl", "garden", "ecosystem", "consumer", "apple", "hardware", "device"],
    notes: "Consumer hardware and walled garden ecosystem narrative",
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

export async function seedMemeConcepts() {
  logger.info("Seeding curated meme concepts...");

  for (const concept of CURATED_MEME_CONCEPTS) {
    await db
      .insert(memeConcepts)
      .values(concept)
      .onConflictDoUpdate({
        target: memeConcepts.id,
        set: {
          name: concept.name,
          tags: concept.tags,
          notes: concept.notes,
        },
      });
  }

  logger.info({ count: CURATED_MEME_CONCEPTS.length }, "Curated meme concepts seeded successfully");
}

export async function seedAll() {
  await seedAssets();
  await seedMemeConcepts();
}

if (import.meta.main) {
  seedAll()
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

