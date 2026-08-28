import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const publicFile = (name: string) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

describe("deployment safeguards", () => {
  test("hosting configuration applies a restrictive policy to every page", async () => {
    const config = JSON.parse(await readFile(publicFile("staticwebapp.config.json"), "utf8")) as {
      globalHeaders: Record<string, string>;
    };
    const csp = config.globalHeaders["content-security-policy"];

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' https://api.sociobot.in https://pilot-api.sociobot.in");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(config.globalHeaders["permissions-policy"]).toContain("camera=()");
    expect(config.globalHeaders["x-frame-options"]).toBe("DENY");
  });

  test("worker source uses a build-specific cache and revalidates navigations", async () => {
    const worker = await readFile(publicFile("sw.js"), "utf8");

    expect(worker).toContain('const CACHE = "trg-shell-__TRG_BUILD_ID__"');
    expect(worker).toContain('event.request.mode === "navigate"');
    expect(worker).toContain("networkFirst(event.request)");
    expect(worker).toContain("const response = await fetch(request)");
    expect(worker).toContain("await caches.match(request)");
  });
});
