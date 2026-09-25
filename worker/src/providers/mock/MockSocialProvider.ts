import { randomUUID } from "node:crypto";
import type { SignalObservation, SocialProvider } from "../types";
import { MOCK_SOCIAL_DATA } from "./fixtures";

export class MockSocialProvider implements SocialProvider {
  async getVelocity(symbol: string, since?: string): Promise<SignalObservation[]> {
    const uppercaseSymbol = symbol.toUpperCase();
    const rawSignals = MOCK_SOCIAL_DATA[uppercaseSymbol] ?? [
      {
        symbol: uppercaseSymbol,
        kind: "SOCIAL",
        magnitude: 65,
        label: `${uppercaseSymbol} baseline social attention velocity`,
        source: "mock-social",
      },
    ];

    const capturedAt = new Date().toISOString();

    return rawSignals.map((item, idx) => ({
      id: `sig-soc-${uppercaseSymbol.toLowerCase()}-${idx}-${randomUUID().slice(0, 8)}`,
      symbol: item.symbol,
      kind: item.kind,
      magnitude: item.magnitude,
      label: item.label,
      capturedAt,
      source: item.source,
    }));
  }
}
