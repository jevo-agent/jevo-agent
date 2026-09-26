import { experimental_evaluate } from "ai";
import { config } from "dotenv";
config();

async function testJev() {
  console.log("Testing experimental_evaluate with typesafe-ai/jev...");
  console.log("AI_GATEWAY_API_KEY present:", Boolean(process.env.AI_GATEWAY_API_KEY));
  
  try {
    const result = await experimental_evaluate({
      model: "typesafe-ai/jev",
      state: "NVDA reached new all-time high with strong AI inference demand.",
      questions: {
        testChoice: {
          type: "choice",
          instructions: "Select the best directional stance",
          criteria: {
            PROMOTE: "Strong narrative and fundamentals",
            HOLD: "Neutral momentum",
            DEMOTE: "Deteriorating conditions",
          },
        },
        testScore: {
          type: "score",
          instructions: "Rate narrative momentum from 1 to 10",
          criteria: [
            "1 / minimal",
            "2 / very low",
            "3 / low",
            "4 / below avg",
            "5 / neutral",
            "6 / moderate",
            "7 / above avg",
            "8 / strong",
            "9 / very strong",
            "10 / exceptional",
          ],
        },
        testBoolean: {
          type: "boolean",
          instructions: "Is this asset currently exhibiting meme/cultural breakout characteristics?",
        },
      },
    });

    console.log("RAW RESULT SUCCESS:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("RAW ERROR CAUGHT:");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Error details:", err);
    if (err?.cause) {
      console.error("Error cause:", err.cause);
    }
  }
}

testJev();
