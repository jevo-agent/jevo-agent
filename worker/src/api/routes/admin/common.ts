import { randomUUID } from "node:crypto";
import type { ProtocolEvent } from "@jevo/protocol-types";
import { db } from "../../../db/client";
import { protocolEvents } from "../../../db/schema";
import { publishProtocolEvent } from "../../../events";

export async function recordOperatorProtocolEvent(
  eventType: string,
  options: {
    cycleId?: string | null;
    subjectType?: string | null;
    subjectId?: string | null;
    payload?: Record<string, unknown>;
  } = {},
): Promise<ProtocolEvent> {
  const eventId = `pe-op-${randomUUID()}`;
  const now = new Date();
  const evt: ProtocolEvent = {
    eventId,
    eventType,
    cycleId: options.cycleId ?? null,
    subjectType: options.subjectType ?? null,
    subjectId: options.subjectId ?? null,
    payload: options.payload ?? {},
    schemaVersion: 1,
    actor: "OPERATOR",
    createdAt: now.toISOString(),
  };

  await db.insert(protocolEvents).values({
    eventId,
    eventType,
    cycleId: options.cycleId ? String(options.cycleId) : null,
    subjectType: options.subjectType ?? null,
    subjectId: options.subjectId ?? null,
    payload: options.payload ?? {},
    schemaVersion: 1,
    actor: "OPERATOR",
    createdAt: now,
  });

  await publishProtocolEvent(evt);
  return evt;
}
