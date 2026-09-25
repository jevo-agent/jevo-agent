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

  it("throws error when JEV_MODE=real but JEV_API_KEY is missing", () => {
    const invalidEnv = {
      ...BASE_VALID_ENV,
      JEV_MODE: "real",
      JEV_API_KEY: "",
    };
    expect(() => validateEnv(invalidEnv)).toThrow("JEV_API_KEY must be provided when JEV_MODE=real");
  });

  it("throws error when NODE_ENV=production and PROVIDER_MODE=mock (Section 19 Guard)", () => {
    const invalidEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "mock",
      JEV_MODE: "real",
      JEV_API_KEY: "secret-key",
    };
    expect(() => validateEnv(invalidEnv)).toThrow(
      "Refusing to start: mock mode is not allowed when NODE_ENV=production",
    );
  });

  it("throws error when NODE_ENV=production and JEV_MODE=mock (Section 19 Guard)", () => {
    const invalidEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "real",
      JEV_MODE: "mock",
    };
    expect(() => validateEnv(invalidEnv)).toThrow(
      "Refusing to start: mock mode is not allowed when NODE_ENV=production",
    );
  });

  it("passes when NODE_ENV=production and all modes are real with valid secrets", () => {
    const validProdEnv = {
      ...BASE_VALID_ENV,
      NODE_ENV: "production",
      PROVIDER_MODE: "real",
      JEV_MODE: "real",
      JEV_API_KEY: "valid-production-key",
    };
    const config = validateEnv(validProdEnv);
    expect(config.NODE_ENV).toBe("production");
    expect(config.PROVIDER_MODE).toBe("real");
    expect(config.JEV_MODE).toBe("real");
  });
});
