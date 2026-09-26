import { experimental_evaluate } from "ai";
import { config } from "dotenv";
config();

async function testJev() {
  console.log("Testing experimental_evaluate with typesafe-ai/jev...");
  console.log("AI_GATEWAY_API_KEY present:", Boolean(process.env.AI_GATEWAY_API_KEY));
  
  try {
    const result = await experimental_evaluate({
      model: "typesafe-ai/jev",
      state: "test",
      questions: {
        test: {
          type: "choice",
          instructions: "Select the best option",
          criteria: {
            a: "Option A",
            b: "Option B",
          },
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
