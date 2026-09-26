import { describe, expect, it } from "bun:test";
import {
  RealJevProvider,
  RealJevProviderError,
} from "../src/jev/RealJevProvider";

const choiceResult = (confidence = 0.94) => ({
  answers: {
    decision: {
      type: "choice",
      choice: "PROMOTE",
      probabilities: { PROMOTE: 0.94, HOLD: 0.04, DEMOTE: 0.02 },
    },
  },
  providerMetadata: { typesafe: { confidence: { decision: confidence } } },
  response: { modelId: "typesafe-ai/jev" },
});

const scoreResult = {
  answers: {
    narrativeMomentum: { type: "score", score: 9 },
    culturalRelevance: { type: "score", score: 8 },
  },
  providerMetadata: {
    typesafe: { confidence: { narrativeMomentum: 0.9, culturalRelevance: 0.88 } },
  },
  response: { modelId: "typesafe-ai/jev" },
};

describe("RealJevProvider", () => {
  it("maps official typed choice and score answers to the JevProvider contract", async () => {
    const provider = new RealJevProvider({
      evaluateFn: (async ({ questions }: { questions: Record<string, unknown> }) =>
        Object.keys(questions).includes("decision") ? choiceResult() : scoreResult) as never,
    });

    await expect(
      provider.evaluateChoice({ context: { symbol: "NVDA" }, options: ["PROMOTE", "HOLD", "DEMOTE"] }),
    ).resolves.toEqual({ choice: "PROMOTE", confidence: 94, signals: [] });
    await expect(
      provider.evaluateScore({ context: { symbol: "NVDA" }, dimensions: ["narrativeMomentum", "culturalRelevance"] }),
    ).resolves.toEqual({ scores: { narrativeMomentum: 89, culturalRelevance: 78 }, confidence: 89 });
  });

  it("rejects malformed typed answers without fabricating a decision", async () => {
    const provider = new RealJevProvider({
      evaluateFn: (async () => ({ answers: {}, providerMetadata: {} })) as never,
    });

    await expect(
      provider.evaluateChoice({ context: { symbol: "NVDA" }, options: ["PROMOTE", "HOLD", "DEMOTE"] }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE", retryable: false });
  });

  it("uses the official bounded retry and abort controls", async () => {
    let calls = 0;
    const provider = new RealJevProvider({
      timeoutMs: 1000,
      maxRetries: 1,
      evaluateFn: (async (options: { maxRetries?: number; abortSignal?: AbortSignal }) => {
        calls += 1;
        expect(options.maxRetries).toBe(1);
        expect(options.abortSignal).toBeInstanceOf(AbortSignal);
        return choiceResult();
      }) as never,
    });

    await provider.evaluateChoice({ context: { symbol: "NVDA" }, options: ["PROMOTE"] });
    expect(calls).toBe(1);
  });

  it("classifies timeouts and unauthorized gateway responses without retrying in the adapter", async () => {
    const timeoutProvider = new RealJevProvider({
      timeoutMs: 1,
      evaluateFn: (async ({ abortSignal }: { abortSignal?: AbortSignal }) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (abortSignal?.aborted) throw new DOMException("Timed out", "TimeoutError");
        return choiceResult();
      }) as never,
    });
    await expect(
      timeoutProvider.evaluateChoice({ context: { symbol: "NVDA" }, options: ["PROMOTE"] }),
    ).rejects.toMatchObject({ code: "TIMEOUT", retryable: true });

    const unauthorizedProvider = new RealJevProvider({
      evaluateFn: (async () => {
        throw Object.assign(new Error("unauthorized"), { status: 401 });
      }) as never,
    });
    await expect(
      unauthorizedProvider.evaluateChoice({ context: { symbol: "NVDA" }, options: ["PROMOTE"] }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED", retryable: false, status: 401 });
  });

  it("does not serialize credentials and maps evaluateNoul to boolean question", async () => {
    const provider = new RealJevProvider({
      evaluateFn: (async () => ({
        answers: { noul: { type: "boolean", probability: 0.23 } },
        providerMetadata: { typesafe: { confidence: { noul: 0.85 } } },
      })) as never,
    });
    expect(JSON.stringify(provider)).not.toContain("AI_GATEWAY_API_KEY");
    const res = await provider.evaluateNoul({ context: { symbol: "NVDA" } });
    expect(res.raw.probability).toBe(0.23);
    expect(res.raw.confidence).toBe(85);
  });
});
