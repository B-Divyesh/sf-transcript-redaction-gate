import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test("home, privacy, and terms have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/privacy/", "/terms/"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")), path).toEqual([]);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

test("mobile layout stays within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

test("home loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (problem) => errors.push(problem.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});
