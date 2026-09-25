import { randomUUID } from "node:crypto";
import type { NarrativeProvider, SignalObservation } from "../types";
import { MOCK_NARRATIVE_DATA } from "./fixtures";

export class MockNarrativeProvider implements NarrativeProvider {
  async getSignals(symbol: string, since?: string): Promise<SignalObservation[]> {
    const uppercaseSymbol = symbol.toUpperCase();
    const rawSignals = MOCK_NARRATIVE_DATA[uppercaseSymbol] ?? [
      {
        symbol: uppercaseSymbol,
        kind: "NARRATIVE",
        magnitude: 70,
        label: `${uppercaseSymbol} baseline narrative observation`,
        source: "mock-narrative",
      },
    ];

    const capturedAt = new Date().toISOString();

    return rawSignals.map((item, idx) => ({
      id: `sig-nar-${uppercaseSymbol.toLowerCase()}-${idx}-${randomUUID().slice(0, 8)}`,
      symbol: item.symbol,
      kind: item.kind,
      magnitude: item.magnitude,
      label: item.label,
      capturedAt,
      source: item.source,
    }));
  }
}
