import { experimental_evaluate as evaluate } from "ai";
import { env } from "../config/env";
import type {
  ChoiceInput,
  ChoiceResult,
  JevProvider,
  NoulInput,
  ScoreInput,
  ScoreResult,
} from "./JevProvider";

const JEV_MODEL = "typesafe-ai/jev" as const;
const DEFAULT_TIMEOUT_MS = env.JEV_REQUEST_TIMEOUT_MS;
const DEFAULT_MAX_RETRIES = 1;

const SCORE_LEVELS = [
  "0 / no evidence",
  "10 / minimal",
  "20 / very low",
  "30 / low",
  "40 / below average",
  "50 / neutral",
  "60 / moderate",
  "70 / above average",
  "80 / strong",
  "90 / very strong",
  "100 / exceptional",
] as const;

export type RealJevProviderErrorCode =
  | "CONFIGURATION"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "TRANSIENT"
  | "INVALID_RESPONSE"
  | "UNSUPPORTED"
  | "UNKNOWN";

export class RealJevProviderError extends Error {
  readonly name = "RealJevProviderError";

  constructor(
    readonly code: RealJevProviderErrorCode,
    message: string,
    readonly retryable: boolean,
    options?: { cause?: unknown; status?: number },
  ) {
    super(message, options);
    this.status = options?.status;
  }

  readonly status?: number;
}

type EvaluationResult = Awaited<ReturnType<typeof evaluate>>;
type EvaluateFn = typeof evaluate;

export interface RealJevProviderOptions {
  timeoutMs?: number;
  maxRetries?: number;
  /** Transport seam for unit tests; production uses the official AI SDK call. */
  evaluateFn?: EvaluateFn;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeConfidence(value: number): number {
  const normalized = value <= 1 && value > 0 ? value * 100 : value;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

function errorStatus(error: unknown): number | undefined {
  const record = asRecord(error);
  const cause = asRecord(record?.cause);
  return finiteNumber(record?.status) ?? finiteNumber(record?.statusCode) ?? finiteNumber(cause?.status) ?? undefined;
}

function classifyError(error: unknown, signal?: AbortSignal): RealJevProviderError {
  const status = errorStatus(error);
  const record = asRecord(error);
  const message = error instanceof Error ? error.message : String(error);
  const name = typeof record?.name === "string" ? record.name : "";

  if (signal?.aborted || name === "AbortError" || name === "TimeoutError") {
    return new RealJevProviderError("TIMEOUT", "Jev evaluation timed out", true, { cause: error, status });
  }
  if (status === 401 || status === 403) {
    return new RealJevProviderError("UNAUTHORIZED", "Jev Gateway authentication failed", false, {
      cause: error,
      status,
    });
  }
  if (status === 408 || status === 425 || status === 429 || (status !== undefined && status >= 500)) {
    return new RealJevProviderError("TRANSIENT", "Jev Gateway returned a transient transport error", true, {
      cause: error,
      status,
    });
  }
  if (message.toLowerCase().includes("unsupported")) {
    return new RealJevProviderError("UNSUPPORTED", "Jev evaluation is not supported by the configured model", false, {
      cause: error,
      status,
    });
  }
  return new RealJevProviderError("UNKNOWN", "Jev evaluation failed", false, { cause: error, status });
}

function confidenceFromResult(result: EvaluationResult, questionId: string, answer: unknown): number {
  const metadata = asRecord(result.providerMetadata);
  const typesafe = asRecord(metadata?.typesafe);
  const confidenceMap = asRecord(typesafe?.confidence);
  const metadataConfidence = finiteNumber(confidenceMap?.[questionId]);
  if (metadataConfidence !== null) return normalizeConfidence(metadataConfidence);

  const answerRecord = asRecord(answer);
  const probabilities = asRecord(answerRecord?.probabilities);
  const selectedChoice = typeof answerRecord?.choice === "string" ? answerRecord.choice : null;
  const selectedProbability = selectedChoice ? finiteNumber(probabilities?.[selectedChoice]) : null;
  if (selectedProbability !== null) return normalizeConfidence(selectedProbability);

  throw new RealJevProviderError(
    "INVALID_RESPONSE",
    `Jev response did not include confidence metadata for ${questionId}`,
    false,
  );
}

function answerFor(result: EvaluationResult, questionId: string): unknown {
  const answers = asRecord(result.answers);
  const answer = answers?.[questionId];
  if (!answer) {
    throw new RealJevProviderError(
      "INVALID_RESPONSE",
      `Jev response did not include answer ${questionId}`,
      false,
    );
  }
  return answer;
}

function scoreFromAnswer(answer: unknown, questionId: string): number {
  const score = finiteNumber(asRecord(answer)?.score);
  if (score === null || score < 0 || score > SCORE_LEVELS.length - 1) {
    throw new RealJevProviderError(
      "INVALID_RESPONSE",
      `Jev response included an invalid score for ${questionId}`,
      false,
    );
  }
  return Math.round((score / (SCORE_LEVELS.length - 1)) * 100);
}

function choiceFromAnswer<T extends string>(answer: unknown, input: ChoiceInput<T>): T {
  const choice = asRecord(answer)?.choice;
  if (typeof choice !== "string" || !input.options.includes(choice as T)) {
    throw new RealJevProviderError(
      "INVALID_RESPONSE",
      "Jev response selected an option outside the requested choice set",
      false,
    );
  }
  return choice as T;
}

function contextSignals(context: Record<string, unknown>): string[] {
  const value = context.signals;
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

export class RealJevProvider implements JevProvider {
  readonly version = JEV_MODEL;

  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly evaluateFn: EvaluateFn;

  constructor(options: RealJevProviderOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.evaluateFn = options.evaluateFn ?? evaluate;
  }

  async evaluateChoice<T extends string = string>(input: ChoiceInput<T>): Promise<ChoiceResult<T>> {
    const criteria = Object.fromEntries(
      input.options.map((option) => [option, `Select ${option} when it is the best structured decision for this asset.`]),
    );
    const result = await this.call({
      state: input.context,
      questions: {
        decision: {
          type: "choice",
          instructions: "Select exactly one decision for the opportunity. Return only the typed answer.",
          criteria,
        },
      },
    });
    const answer = answerFor(result, "decision");
    const choice = choiceFromAnswer(answer, input);
    return {
      choice,
      confidence: confidenceFromResult(result, "decision", answer),
      signals: contextSignals(input.context),
    };
  }

  async evaluateScore(input: ScoreInput): Promise<ScoreResult> {
    const questions = Object.fromEntries(
      input.dimensions.map((dimension) => [dimension, {
        type: "score" as const,
        instructions: `Rate the ${dimension} dimension for this opportunity using only the supplied state. Return only the typed score.`,
        criteria: [...SCORE_LEVELS],
      }]),
    );
    const result = await this.call({ state: input.context, questions });
    const scores: Record<string, number> = {};
    const confidences: number[] = [];
    for (const dimension of input.dimensions) {
      const answer = answerFor(result, dimension);
      scores[dimension] = scoreFromAnswer(answer, dimension);
      confidences.push(confidenceFromResult(result, dimension, answer));
    }
    if (confidences.length === 0) {
      throw new RealJevProviderError("INVALID_RESPONSE", "Jev response contained no score dimensions", false);
    }
    return {
      scores,
      confidence: Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length),
    };
  }

  async evaluateNoul(_input: NoulInput): Promise<never> {
    throw new RealJevProviderError(
      "UNSUPPORTED",
      "evaluateNoul is not part of the verified Vercel AI Gateway evaluation contract",
      false,
    );
  }

  private async call<const QUESTIONS extends Record<string, unknown>>(
    input: { state: Record<string, unknown>; questions: QUESTIONS },
  ): Promise<EvaluationResult> {
    const abortSignal = AbortSignal.timeout(this.timeoutMs);
    try {
      return await this.evaluateFn({
        model: JEV_MODEL,
        state: input.state,
        questions: input.questions,
        maxRetries: this.maxRetries,
        abortSignal,
      } as Parameters<EvaluateFn>[0]);
    } catch (error) {
      if (error instanceof RealJevProviderError) throw error;
      throw classifyError(error, abortSignal);
    }
  }
}
