import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("local workbench redacts and exports a safe result", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Transcript Redaction Gate/);
  await page.getByRole("button", { name: "Run local check" }).click();
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
  await expect(page.locator("#safe-output")).not.toContainText("demo_token_value");
  await expect(page.locator("#finding-count")).toHaveText("2");
});

test("empty state gives a useful error and focuses input", async ({ page }) => {
  await page.goto("/");
  await page.locator("#transcript").fill("");
  await page.getByRole("button", { name: "Run local check" }).click();
  await expect(page.getByRole("alert")).toContainText("Add transcript text");
  await expect(page.locator("#transcript")).toBeFocused();
});

test("mobile keyboard path reaches the workbench and runs a check", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator(".skip-link")).toBeVisible();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press("Tab");
  await expect(page.locator("#transcript")).toBeFocused();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Authorization: Bearer keyboard_fixture_token_1234567890");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator("#run-check")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
  await expect(page.locator("#safe-output")).not.toContainText("keyboard_fixture_token");
});

test("home, privacy, and terms have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/privacy/", "/terms/"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")), path).toEqual([]);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

test("mobile detector labels remain fully exposed and pass axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const detectorOverflow = await page.locator(".marquee").evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(detectorOverflow).toBeLessThanOrEqual(0);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("brand and footer links have touch-sized hit areas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const link of [page.locator(".brand"), page.locator("footer nav a")]) {
    const count = await link.count();
    for (let index = 0; index < count; index += 1) {
      const box = await link.nth(index).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  }
});

test("returned license is stored, stripped from the URL, and unlocks the composer", async ({ page }) => {
  await page.route("**/api/v1/products/transcript-redaction-gate/verify?license=*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }) })
  );
  await page.goto("/?license=test_license_token");
  await expect(page.locator("#lock-tag")).toHaveText("Team kit active");
  expect(page.url()).not.toContain("license=");
  expect(await page.evaluate(() => localStorage.getItem("sb_license:transcript-redaction-gate"))).toBe("test_license_token");
});

test("unlicensed local checks make no third-party requests", async ({ page }) => {
  const destinations = new Set<string>();
  page.on("request", (request) => destinations.add(new URL(request.url()).origin));
  await page.goto("/");
  await page.getByRole("button", { name: "Run local check" }).click();
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
  expect([...destinations]).toEqual(["http://127.0.0.1:4173"]);
});

test("installed shell and workbench remain available offline", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Run local check" }).click();
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
});

test("service worker revalidates a stale cached shell before serving it", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const worker = await page.request.get("/sw.js");
  const workerSource = await worker.text();
  expect(workerSource).toMatch(/const CACHE = "trg-shell-[a-f0-9]{12}"/);
  expect(workerSource).not.toContain("__TRG_BUILD_ID__");

  await page.evaluate(async () => {
    const [cacheName] = await caches.keys();
    const cache = await caches.open(cacheName);
    await cache.put(new Request("/"), new Response("<main><h1>Stale shell</h1></main>", {
      headers: { "content-type": "text/html" }
    }));
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: /Prove the transcript is clean/i })).toBeVisible();
});

test("a new worker replaces the old shell cache and keeps the new release offline", async ({ page }) => {
  const builtWorker = await readFile(resolve("dist/site/sw.js"), "utf8");
  const currentBuild = builtWorker.match(/trg-shell-([a-f0-9]{12})/)?.[1];
  expect(currentBuild).toBeTruthy();
  let release: "old" | "new" = "old";
  const server = createServer((request, response) => {
    response.setHeader("cache-control", "no-store");
    if (request.url === "/sw.js") {
      response.setHeader("content-type", "text/javascript");
      const build = release === "old" ? "000000000000" : currentBuild!;
      response.end(builtWorker.replace(currentBuild!, build));
      return;
    }
    if (request.url === "/") {
      response.setHeader("content-type", "text/html");
      response.end(`<!doctype html><html lang="en"><title>Worker update fixture</title><body><main><h1>${release} release</h1></main><script>navigator.serviceWorker.register('/sw.js')</script></body></html>`);
      return;
    }
    response.end("shell fixture");
  });

  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("fixture server did not expose a port");
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await expect(page.getByRole("heading", { name: "old release" })).toBeVisible();

    release = "new";
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual([`trg-shell-${currentBuild}`]);

    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "new release" })).toBeVisible();
  } finally {
    await page.context().setOffline(false);
    server.closeAllConnections();
    await new Promise<void>((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
  }
});

test("home loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (problem) => errors.push(problem.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});
