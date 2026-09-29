import type {
  ChoiceInput,
  ChoiceResult,
  JevProvider,
  NoulInput,
  NoulResult,
  ScoreInput,
  ScoreResult,
} from "./JevProvider";

const FIXTURE_CHOICES: Record<string, { choice: string; confidence: number; signals: string[] }> = {
  NVDA: {
    choice: "PROMOTE",
    confidence: 94,
    signals: [
      "AI infrastructure accelerating into dominant cluster",
      "Market conditions supportive without saturation",
      "High developer and retail velocity overlap",
    ],
  },
  TSLA: {
    choice: "HOLD",
    confidence: 91,
    signals: [
      "Robotics and autonomous systems attention persistent",
      "Autonomy symbolism remains clear",
    ],
  },
  PLTR: {
    choice: "DEMOTE",
    confidence: 88,
    signals: [
      "Relative narrative momentum weakened versus prior cycle",
      "Observation motif steady but lack of new acceleration",
    ],
  },
  GME: {
    choice: "PROMOTE",
    confidence: 86,
    signals: [
      "Sharp retail social velocity increase",
      "Meme equity and reflexivity dynamics reactivated",
    ],
  },
  AAPL: {
    choice: "HOLD",
    confidence: 87,
    signals: [
      "Consumer technology recognition remains stable",
      "Limited short-term narrative velocity delta",
    ],
  },
  AMD: {
    choice: "HOLD",
    confidence: 83,
    signals: [
      "Datacenter compute roadmap steady",
      "Cultural intensity lower than primary AI leader",
    ],
  },
  COIN: {
    choice: "HOLD",
    confidence: 85,
    signals: [
      "Strong crypto adjacency aligned with market liquidity",
      "Exchange volumes stable",
    ],
  },
  MSFT: {
    choice: "HOLD",
    confidence: 88,
    signals: [
      "Copilot enterprise integration continues at scale",
      "Steady revenue growth across commercial cloud",
    ],
  },
  GOOGL: {
    choice: "HOLD",
    confidence: 85,
    signals: [
      "Gemini multimodal benchmarks solid",
      "Search ads market share resilient",
    ],
  },
  AMZN: {
    choice: "HOLD",
    confidence: 84,
    signals: [
      "AWS custom Graviton/Trainium rollout progressing",
      "E-commerce operating income expanding",
    ],
  },
  META: {
    choice: "PROMOTE",
    confidence: 91,
    signals: [
      "Llama open source developer moat strengthening",
      "Engagement and advertising conversions accelerating",
    ],
  },
  AVGO: {
    choice: "HOLD",
    confidence: 86,
    signals: [
      "AI networking switches and custom XPU backlog expanding",
      "VMware synergy integration on track",
    ],
  },
  MSTR: {
    choice: "PROMOTE",
    confidence: 93,
    signals: [
      "Direct crypto treasury reflexivity premium",
      "Exceptional social and speculative attention velocity",
    ],
  },
  HOOD: {
    choice: "HOLD",
    confidence: 82,
    signals: [
      "Retail equities and crypto volume elevated",
      "International tokenization rollout pending",
    ],
  },
  SOFI: {
    choice: "HOLD",
    confidence: 80,
    signals: [
      "Member growth steady across lending and financial services",
      "Rate environment sensitivity moderating",
    ],
  },
};

const FIXTURE_SCORES: Record<string, Record<string, number>> = {
  NVDA: {
    narrativeMomentum: 98,
    culturalRelevance: 95,
    memeCompatibility: 94,
    cryptoAdjacency: 92,
    pairCompatibility: 96,
  },
  TSLA: {
    narrativeMomentum: 93,
    culturalRelevance: 94,
    memeCompatibility: 90,
    cryptoAdjacency: 85,
    pairCompatibility: 92,
  },
  PLTR: {
    narrativeMomentum: 91,
    culturalRelevance: 93,
    memeCompatibility: 88,
    cryptoAdjacency: 84,
    pairCompatibility: 90,
  },
  AAPL: {
    narrativeMomentum: 86,
    culturalRelevance: 93,
    memeCompatibility: 75,
    cryptoAdjacency: 65,
    pairCompatibility: 80,
  },
  GME: {
    narrativeMomentum: 89,
    culturalRelevance: 98,
    memeCompatibility: 98,
    cryptoAdjacency: 82,
    pairCompatibility: 89,
  },
  AMD: {
    narrativeMomentum: 88,
    culturalRelevance: 87,
    memeCompatibility: 84,
    cryptoAdjacency: 80,
    pairCompatibility: 86,
  },
  COIN: {
    narrativeMomentum: 90,
    culturalRelevance: 91,
    memeCompatibility: 89,
    cryptoAdjacency: 98,
    pairCompatibility: 92,
  },
  MSFT: {
    narrativeMomentum: 92,
    culturalRelevance: 88,
    memeCompatibility: 72,
    cryptoAdjacency: 60,
    pairCompatibility: 82,
  },
  GOOGL: {
    narrativeMomentum: 90,
    culturalRelevance: 89,
    memeCompatibility: 70,
    cryptoAdjacency: 62,
    pairCompatibility: 80,
  },
  AMZN: {
    narrativeMomentum: 89,
    culturalRelevance: 87,
    memeCompatibility: 68,
    cryptoAdjacency: 64,
    pairCompatibility: 78,
  },
  META: {
    narrativeMomentum: 94,
    culturalRelevance: 93,
    memeCompatibility: 86,
    cryptoAdjacency: 78,
    pairCompatibility: 91,
  },
  AVGO: {
    narrativeMomentum: 91,
    culturalRelevance: 83,
    memeCompatibility: 65,
    cryptoAdjacency: 72,
    pairCompatibility: 85,
  },
  MSTR: {
    narrativeMomentum: 96,
    culturalRelevance: 95,
    memeCompatibility: 96,
    cryptoAdjacency: 99,
    pairCompatibility: 95,
  },
  HOOD: {
    narrativeMomentum: 88,
    culturalRelevance: 89,
    memeCompatibility: 88,
    cryptoAdjacency: 91,
    pairCompatibility: 87,
  },
  SOFI: {
    narrativeMomentum: 85,
    culturalRelevance: 80,
    memeCompatibility: 76,
    cryptoAdjacency: 75,
    pairCompatibility: 79,
  },
};

export class MockJevProvider implements JevProvider {
  readonly version = "jev-2026-08";

  async evaluateChoice<T extends string = string>(input: ChoiceInput<T>): Promise<ChoiceResult<T>> {
    const symbol = String(input.context.symbol ?? "").toUpperCase();
    const fixture = FIXTURE_CHOICES[symbol];

    if (fixture && input.options.includes(fixture.choice as T)) {
      return {
        choice: fixture.choice as T,
        confidence: fixture.confidence,
        signals: fixture.signals,
      };
    }

    // Default to the first available option or a neutral choice
    const fallbackChoice = input.options[0] ?? ("HOLD" as T);
    return {
      choice: fallbackChoice,
      confidence: 80,
      signals: [`${symbol || "Asset"} evaluated against baseline parameters`],
    };
  }

  async evaluateScore(input: ScoreInput): Promise<ScoreResult> {
    const symbol = String(input.context.symbol ?? "").toUpperCase();
    const symbolScores = FIXTURE_SCORES[symbol] ?? {};

    const scores: Record<string, number> = {};
    for (const dim of input.dimensions) {
      scores[dim] = symbolScores[dim] ?? 75;
    }

    return {
      scores,
      confidence: 88,
    };
  }

  /**
   * PLACEHOLDER / UNCONFIRMED SPEC:
   * Provisional implementation of unconfirmed evaluateNoul method per Section 7 & 22.
   * Input/output shape is a mock placeholder until confirmed by official Jev documentation.
   */
  async evaluateNoul(input: NoulInput): Promise<NoulResult> {
    return {
      raw: {
        evaluated: true,
        contextKeys: Object.keys(input.context),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
