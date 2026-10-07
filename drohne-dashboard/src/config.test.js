import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

describe("config", () => {
  const original = process.env.VUE_APP_API_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (original === undefined) delete process.env.VUE_APP_API_URL;
    else process.env.VUE_APP_API_URL = original;
  });

  test("fällt auf http://localhost:3000 zurück, wenn VUE_APP_API_URL nicht gesetzt ist", async () => {
    delete process.env.VUE_APP_API_URL;
    const { apiBaseUrl } = await import("./config.js");
    expect(apiBaseUrl).toBe("http://localhost:3000");
  });

  test("nutzt VUE_APP_API_URL, wenn gesetzt", async () => {
    process.env.VUE_APP_API_URL = "https://api.example.com";
    const { apiBaseUrl } = await import("./config.js");
    expect(apiBaseUrl).toBe("https://api.example.com");
  });
});
