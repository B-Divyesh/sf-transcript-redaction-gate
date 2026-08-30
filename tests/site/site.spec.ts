import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileAsync = promisify(execFile);
const sampleToken = "demo_token_value_1234567890";

test("@claim:browser-demo-local browser demo redacts locally and isolates its state", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo/");
  await expect(page.getByRole("heading", { name: "Redact a sample transcript" })).toBeFocused();
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
  await expect(page.locator("#safe-output")).not.toContainText(sampleToken);
  expect(requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173")).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual(["demo:trg:sample-loaded"]);
});

test("@claim:demo-reset reset restores the sample result", async ({ page }) => {
  await page.goto("/demo/");
  await page.locator("#transcript").fill("plain diagnostic");
  await page.getByRole("button", { name: "Redact transcript" }).click();
  await expect(page.locator("#gate-badge")).toHaveText("No matches");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator("#transcript")).toHaveValue(new RegExp(sampleToken));
  await expect(page.locator("#safe-output")).not.toContainText(sampleToken);
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
});

test("@claim:offline-demo demo remains useful offline after first visit", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4173/demo/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#gate-badge")).toHaveText("Redacted");
    await page.getByRole("button", { name: "Redact transcript" }).click();
    await expect(page.locator("#safe-output")).not.toContainText(sampleToken);
  } finally {
    await context.close();
  }
});

test("@claim:cli-demo bundled CLI demo writes a private receipt", async () => {
  const directory = await mkdtemp(join(tmpdir(), "trg-claim-"));
  try {
    const { stdout } = await execFileAsync("cargo", ["run", "--quiet", "-p", "transcript-redaction-gate", "--", "demo"], { cwd: process.cwd() });
    expect(stdout).toContain("Demo redacted 2 finding(s).");
    const receipt = stdout.split("\n").find((line) => line.startsWith("Receipt: "))!.slice("Receipt: ".length);
    const body = await readFile(receipt, "utf8");
    expect(body).toContain("authorization");
    expect(body).not.toContain(sampleToken);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("home has one clear demo action and complete route metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Transcript Redaction Gate — Redact secrets");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Redact secrets before sharing transcripts");
  await expect(page.getByRole("link", { name: /Try it with sample data/ })).toHaveAttribute("href", "/demo/");
  for (const path of ["/", "/demo/", "/privacy/", "/terms/"]) {
    await page.goto(path);
    await expect(page.locator("link[rel=canonical]")).toHaveCount(1);
    await expect(page.locator("meta[property='og:image']")).toHaveCount(1);
    await expect(page.locator("link[rel='apple-touch-icon']")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

test("direct ?demo=1 entry opens the isolated sample route", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page).toHaveURL(/\/demo\/\?demo=1$/);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#gate-badge")).toHaveText("Redacted");
});

test("route navigation moves focus to the destination heading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Privacy policy" })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Redact secrets before sharing transcripts" })).toBeFocused();
});

test("mobile menu and demo have no serious accessibility violations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/");
  await page.getByText("Menu", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Privacy", exact: true }).last()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("404 override is configured with a designed return route", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.getByRole("heading", { name: "This page was not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
});

test("demo page loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (problem) => errors.push(problem.message));
  await page.goto("/demo/");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});
