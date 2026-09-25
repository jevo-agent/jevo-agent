import { z } from "zod";

/**
 * Validates and sanitizes raw Jev choice output.
 * Strips all free-text reasoning, thoughts, or explanations
 * so that no hallucinated or unstructured chain-of-thought is ever persisted.
 */
export const rawJevChoiceResultSchema = z
  .object({
    choice: z.string().min(1),
    confidence: z.coerce.number().min(0),
    signals: z.array(z.string().min(1)).default([]),
    // Optional reasoning fields that MUST be stripped
    reasoning: z.unknown().optional(),
    thought: z.unknown().optional(),
    thoughts: z.unknown().optional(),
    explanation: z.unknown().optional(),
    chainOfThought: z.unknown().optional(),
  })
  .transform((data) => {
    // Normalize confidence to 0 - 100 range if provided as 0 - 1
    let normalizedConfidence = data.confidence;
    if (normalizedConfidence <= 1.0 && normalizedConfidence > 0) {
      normalizedConfidence = Math.round(normalizedConfidence * 100);
    } else {
      normalizedConfidence = Math.min(100, Math.max(0, Math.round(normalizedConfidence)));
    }

    return {
      choice: data.choice.toUpperCase().trim(),
      confidence: normalizedConfidence,
      signals: data.signals.map((s) => s.trim()).filter((s) => s.length > 0),
    };
  });

export type SanitizedJevChoiceResult = z.output<typeof rawJevChoiceResultSchema>;

export const rawJevScoreResultSchema = z
  .object({
    scores: z.record(z.string(), z.coerce.number()),
    confidence: z.coerce.number().min(0),
    reasoning: z.unknown().optional(),
    thought: z.unknown().optional(),
    explanation: z.unknown().optional(),
  })
  .transform((data) => {
    let normalizedConfidence = data.confidence;
    if (normalizedConfidence <= 1.0 && normalizedConfidence > 0) {
      normalizedConfidence = Math.round(normalizedConfidence * 100);
    } else {
      normalizedConfidence = Math.min(100, Math.max(0, Math.round(normalizedConfidence)));
    }

    const sanitizedScores: Record<string, number> = {};
    for (const [key, value] of Object.entries(data.scores)) {
      sanitizedScores[key] = Math.min(100, Math.max(0, Math.round(value)));
    }

    return {
      scores: sanitizedScores,
      confidence: normalizedConfidence,
    };
  });

export type SanitizedJevScoreResult = z.output<typeof rawJevScoreResultSchema>;
