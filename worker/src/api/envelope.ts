import { z } from "zod";

export interface ApiMeta {
  cursor?: string;
  total?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export function formatResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return {
    data,
    ...(meta ? { meta } : {}),
  };
}

export function createEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: z
      .object({
        cursor: z.string().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
  });
}
