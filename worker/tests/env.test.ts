import { describe, expect, it } from "bun:test";
import { validateEnv } from "../src/config/env";

const BASE_VALID_ENV = {
  NODE_ENV: "development",
  PORT: "4000",
  HOST: "0.0.0.0",
  LOG_LEVEL: "info",
  DATABASE_URL: "postgresql://jevo:jevo_local_dev@localhost:5432/jevo_dev",
  REDIS_URL: "redis://localhost:6379",
  PROVIDER_MODE: "mock",
  JEV_MODE: "mock",
  MARKET_DATA_MODE: "mock",
  NARRATIVE_MODE: "mock",
  STOCK_TOKEN_MODE: "mock",
};

describe("Environment Validation & Mock Guard", () => {
  it("successfully parses valid development configuration", () => {
    const config = validateEnv(BASE_VALID_ENV);
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(4000);
    expect(config.PROVIDER_MODE).toBe("mock");
    expect(config.JEV_MODE).toBe("mock");
  });

  it("throws error when DATABASE_URL is missing", () => {
    const invalidEnv = { ...BASE_VALID_ENV, DATABASE_URL: "" };
    expect(() => validateEnv(invalidEnv)).toThrow("DATABASE_URL is required");
  });

  it("throws error when REDIS_URL is missing", () => {
    const invalidEnv = { ...BASE_VALID_ENV, REDIS_URL: "" };
    expect(() => validateEnv(invalidEnv)).toThrow("REDIS_URL is required");
  });

  it("throws error when JEV_MODE=real but AI_GATEWAY_API_KEY is missing", () => {
    const invalidEnv = {
      ...BASE_VALID_ENV,
      JEV_MODE: "real",
      AI_GATEWAY_API_KEY: "",
    };
    expect(() => validateEnv(invalidEnv)).toThrow("AI_GATEWAY_API_KEY must be provided when JEV_MODE=real");
  });

  it("rejects unsupported granular provider modes", () => {
    const invalidEnv = {
      ...BASE_VALID_ENV,
      MARKET_DATA_MODE: "vendor-specific",
    };
    expect(() => validateEnv(invalidEnv)).toThrow("MARKET_DATA_MODE");
  });

  it("accepts a production hybrid when the legacy PROVIDER_MODE remains mock", () => {
    const hybridEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "mock",
      JEV_MODE: "mock",
      MARKET_DATA_MODE: "real",
      NARRATIVE_MODE: "real",
      STOCK_TOKEN_MODE: "real",
      ALPHA_VANTAGE_API_KEY: "alpha-key",
    };
    expect(validateEnv(hybridEnv).PROVIDER_MODE).toBe("mock");
  });

  it("accepts an explicit production hybrid with mock JEV and real market inputs", () => {
    const hybridEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "real",
      JEV_MODE: "mock",
      MARKET_DATA_MODE: "real",
      NARRATIVE_MODE: "real",
      STOCK_TOKEN_MODE: "real",
      ALPHA_VANTAGE_API_KEY: "alpha-key",
    };
    const config = validateEnv(hybridEnv);
    expect(config.JEV_MODE).toBe("mock");
    expect(config.MARKET_DATA_MODE).toBe("real");
    expect(config.NARRATIVE_MODE).toBe("real");
    expect(config.STOCK_TOKEN_MODE).toBe("real");
  });

  it("rejects production when a granular provider mode is omitted", () => {
    const invalidEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "real",
      JEV_MODE: "mock",
      NARRATIVE_MODE: "real",
      STOCK_TOKEN_MODE: "real",
      ALPHA_VANTAGE_API_KEY: "alpha-key",
    };
    delete (invalidEnv as Record<string, unknown>).MARKET_DATA_MODE;
    expect(() => validateEnv(invalidEnv)).toThrow(
      "MARKET_DATA_MODE must be explicitly configured when NODE_ENV=production",
    );
  });

  it("passes when NODE_ENV=production and all modes are real with valid secrets", () => {
    const validProdEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "real",
      JEV_MODE: "real",
      MARKET_DATA_MODE: "real",
      NARRATIVE_MODE: "real",
      STOCK_TOKEN_MODE: "real",
      AI_GATEWAY_API_KEY: "valid-production-key",
      ALPHA_VANTAGE_API_KEY: "alpha-key",
    };
    const config = validateEnv(validProdEnv);
    expect(config.NODE_ENV).toBe("production");
    expect(config.PROVIDER_MODE).toBe("real");
    expect(config.JEV_MODE).toBe("real");
  });
});
