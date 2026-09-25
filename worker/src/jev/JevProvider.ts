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

export interface NoulInput {
  context: Record<string, unknown>;
}

export interface NoulResult {
  raw: Record<string, unknown>;
}

export interface JevProvider {
  readonly version: string;
  evaluateChoice<T extends string = string>(input: ChoiceInput<T>): Promise<ChoiceResult<T>>;
  evaluateScore(input: ScoreInput): Promise<ScoreResult>;
  evaluateNoul(input: NoulInput): Promise<NoulResult>;
}
