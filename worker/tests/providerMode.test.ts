import { describe, expect, it } from "bun:test";
import { buildProviderModeInfo } from "../src/intelligence/facade";

describe("provider runtime metadata", () => {
  it("reports the explicit hybrid runtime without claiming fully-real operation", () => {
    const metadata = buildProviderModeInfo({
      providerMode: "real",
      jevMode: "mock",
      marketDataMode: "real",
      narrativeMode: "real",
      stockTokenMode: "real",
    });

    expect(metadata.providerMode).toBe("mock");
    expect(metadata.jevMode).toBe("mock");
    expect(metadata.marketDataMode).toBe("real");
    expect(metadata.narrativeMode).toBe("real");
    expect(metadata.stockTokenMode).toBe("real");
    expect(metadata.socialMode).toBe("mock");
    expect(metadata.isSimulated).toBe(true);
  });

  it("keeps the aggregate runtime simulated while Social remains mock", () => {
    const metadata = buildProviderModeInfo({
      providerMode: "real",
      jevMode: "real",
      marketDataMode: "real",
      narrativeMode: "real",
      stockTokenMode: "real",
    });

    expect(metadata.providerMode).toBe("mock");
    expect(metadata.socialMode).toBe("mock");
    expect(metadata.isSimulated).toBe(true);
  });
});
