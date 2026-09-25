export interface ChoiceInput<T extends string = string> {
  context: Record<string, unknown>;
  options: T[];
}

export interface ChoiceResult<T extends string = string> {
  choice: T;
  confidence: number; // 0 - 100
  signals: string[];
}

export interface ScoreInput {
  context: Record<string, unknown>;
  dimensions: string[];
}

export interface ScoreResult {
  scores: Record<string, number>;
  confidence: number; // 0 - 100
}

/**
 * PLACEHOLDER / UNCONFIRMED SPEC:
 * The exact request/response shape and purpose of `evaluateNoul` are unconfirmed
 * in the official Jev brief (BackendHandoff.md Section 7 & Section 22).
 * Do NOT use in production cycle logic until confirmed by official Jev documentation.
 */
export interface NoulInput {
  context: Record<string, unknown>;
}

/**
 * PLACEHOLDER / UNCONFIRMED SPEC: Provisional return shape for evaluateNoul.
 */
export interface NoulResult {
  raw: Record<string, unknown>;
}

export interface JevProvider {
  readonly version: string;
  evaluateChoice<T extends string = string>(input: ChoiceInput<T>): Promise<ChoiceResult<T>>;
  evaluateScore(input: ScoreInput): Promise<ScoreResult>;
  /** PLACEHOLDER: Unconfirmed Jev method, see Section 7 & 22 */
  evaluateNoul(input: NoulInput): Promise<NoulResult>;
}
