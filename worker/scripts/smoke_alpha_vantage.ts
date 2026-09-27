import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

console.log("=== Alpha Vantage Smoke Test ===");
console.log(`API Key present: ${Boolean(apiKey && apiKey.trim().length > 0)}`);

if (!apiKey || apiKey.trim() === "") {
  console.error("FATAL: ALPHA_VANTAGE_API_KEY is not set or empty in worker/.env");
  process.exit(1);
}

async function smokeTest() {
  const symbol = "NVDA";

  console.log(`\n--- Testing GLOBAL_QUOTE for ${symbol} ---`);
  const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  const quoteRes = await fetch(quoteUrl);
  const quoteJson = await quoteRes.json();
  console.log("Raw GLOBAL_QUOTE Response:");
  console.log(JSON.stringify(quoteJson, null, 2));

  console.log(`\nWaiting 1.5s to respect Alpha Vantage 1 request/second rate limit...`);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(`\n--- Testing NEWS_SENTIMENT for ${symbol} ---`);
  const newsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}`;
  const newsRes = await fetch(newsUrl);
  const newsJson = await newsRes.json();
  console.log("Raw NEWS_SENTIMENT Response (sample):");
  if (newsJson && Array.isArray(newsJson.feed)) {
    console.log(`Items in feed: ${newsJson.feed.length}`);
    console.log("First item in feed:");
    console.log(JSON.stringify(newsJson.feed[0], null, 2));
  } else {
    console.log(JSON.stringify(newsJson, null, 2));
  }
}

smokeTest().catch((err) => {
  console.error("Smoke test network error:", err);
  process.exit(1);
});
