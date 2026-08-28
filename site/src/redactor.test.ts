import { describe, expect, it } from "vitest";
import { redactInBrowser } from "./redactor";

describe("browser redactor", () => {
  it("removes a bearer token and never places it in the receipt", () => {
    const secret = "demo_token_value_1234567890";
    const result = redactInBrowser(`Authorization: Bearer ${secret}`);
    expect(result.output).toBe("Authorization: Bearer [REDACTED:authorization]");
    expect(JSON.stringify(result.receipt)).not.toContain(secret);
  });

  it("applies an advisory policy and preserves the rest of the line", () => {
    const result = redactInBrowser("customer=CUST-12345678 status=failed", "CUST-[0-9]{8}");
    expect(result.output).toContain("customer=[REDACTED:policy:demo-pattern] status=failed");
  });

  it("returns a clean receipt for diagnostic text", () => {
    const result = redactInBrowser("build completed in 1325ms");
    expect(result.receipt.blocked).toBe(false);
    expect(result.output).toBe("build completed in 1325ms");
  });

  it("reports invalid policy syntax", () => {
    expect(() => redactInBrowser("anything", "[")).toThrow(/not valid/);
  });
});
