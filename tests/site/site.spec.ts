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
