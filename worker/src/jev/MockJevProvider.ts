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
