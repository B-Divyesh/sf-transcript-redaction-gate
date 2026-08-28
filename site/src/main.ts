import { redactInBrowser, type BrowserReceipt } from "./redactor";

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const transcript = $("#transcript") as HTMLTextAreaElement;
const pattern = $("#demo-pattern") as HTMLInputElement;
const safeOutput = $("#safe-output") as HTMLTextAreaElement;
const result = $("#result");
const emptyReceipt = $("#empty-receipt");
const error = $("#demo-error");
const status = $("#demo-status");
const badge = $("#gate-badge");
let currentReceipt: BrowserReceipt | undefined;

function updateCount() {
  $("#input-count").textContent = `${new Blob([transcript.value]).size.toLocaleString()} bytes`;
}

function runCheck() {
  error.hidden = true;
  if (!transcript.value.trim()) {
    result.hidden = true;
    emptyReceipt.hidden = false;
    error.textContent = "Add transcript text before running the check.";
    error.hidden = false;
    badge.textContent = "Empty";
    badge.className = "badge waiting";
    status.textContent = "No transcript was checked.";
    transcript.focus();
    return;
  }
  try {
    const checked = redactInBrowser(transcript.value, pattern.value);
    currentReceipt = checked.receipt;
    safeOutput.value = checked.output;
    $("#finding-count").textContent = String(checked.receipt.finding_count);
    const list = $("#finding-list");
    list.replaceChildren(...checked.receipt.findings.map((finding) => {
      const item = document.createElement("li");
      item.append(document.createTextNode(`Line ${finding.line}, column ${finding.column} · `));
      const code = document.createElement("code");
      code.textContent = finding.detector;
      item.append(code);
      return item;
    }));
    if (!checked.receipt.findings.length) {
      const item = document.createElement("li");
      item.textContent = "No configured sensitive patterns detected.";
      list.append(item);
    }
    result.hidden = false;
    emptyReceipt.hidden = true;
    badge.textContent = checked.receipt.blocked ? "Redacted" : "Pass";
    badge.className = `badge ${checked.receipt.blocked ? "blocked" : "pass"}`;
    status.textContent = checked.receipt.blocked
      ? `${checked.receipt.finding_count} sensitive spans removed. Safe output is ready.`
      : "No sensitive spans found. Output is ready.";
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : "The check could not run.";
    error.hidden = false;
    status.textContent = error.textContent;
  }
}

async function copyText(value: string, button: HTMLButtonElement) {
  try {
    await navigator.clipboard.writeText(value);
    const previous = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = previous; }, 1600);
  } catch {
    status.textContent = "Clipboard access was unavailable. Select the text and copy it manually.";
  }
}

function download(name: string, value: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([value], { type: "application/json" }));
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

transcript.addEventListener("input", updateCount);
$("#run-check").addEventListener("click", runCheck);
$("#copy-output").addEventListener("click", (event) => copyText(safeOutput.value, event.currentTarget as HTMLButtonElement));
$("#download-receipt").addEventListener("click", () => {
  if (currentReceipt) download("transcript.receipt.json", `${JSON.stringify(currentReceipt, null, 2)}\n`);
});
document.querySelectorAll<HTMLButtonElement>(".copy-command").forEach((button) => {
  button.addEventListener("click", () => copyText(button.dataset.command!, button));
});
updateCount();

const networkState = $("#network-state");
function updateNetwork() {
  networkState.innerHTML = navigator.onLine ? '<span aria-hidden="true">●</span> Local-ready' : '<span aria-hidden="true">●</span> Offline · local check works';
  networkState.classList.toggle("offline", !navigator.onLine);
}
addEventListener("online", updateNetwork);
addEventListener("offline", updateNetwork);
updateNetwork();

const PRODUCT = "transcript-redaction-gate";
const BILLING_BASE = import.meta.env.VITE_BILLING_API_BASE || "https://api.sociobot.in";
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const licenseStatus = $("#license-status");
const licenseForm = $("#license-form") as HTMLFormElement;
const licenseInput = $("#license-token") as HTMLInputElement;
const policyComposer = $("#policy-composer");

type CachedVerdict = { valid: boolean; checkedAt: number };

function storedValue(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function readVerdict(): CachedVerdict | null {
  try {
    const raw = storedValue(VERDICT_KEY);
    return raw ? JSON.parse(raw) as CachedVerdict : null;
  } catch {
    try { localStorage.removeItem(VERDICT_KEY); } catch { /* Storage is optional. */ }
    return null;
  }
}

function setUnlocked(unlocked: boolean, message = "") {
  policyComposer.classList.toggle("unlocked", unlocked);
  policyComposer.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button").forEach((control) => { control.disabled = !unlocked; });
  $("#lock-tag").textContent = unlocked ? "Team kit active" : "License required";
  licenseStatus.textContent = message;
}

async function verifyLicense(token: string, force = false) {
  const cached = readVerdict();
  const fresh = cached && Date.now() - cached.checkedAt < 86_400_000;
  if (cached?.valid) setUnlocked(true, "Team kit unlocked from your last verified license.");
  if (!force && fresh) {
    if (!cached.valid) setUnlocked(false, "License no longer active. Every core safety feature remains available for free.");
    return;
  }
  if (!navigator.onLine) {
    licenseStatus.textContent = cached?.valid ? "Offline — using the last verified license." : "Offline — connect once to verify this license.";
    return;
  }
  licenseStatus.textContent = "Verifying license…";
  try {
    const response = await fetch(`${BILLING_BASE}/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error("verification service unavailable");
    const verdict = await response.json() as { valid: boolean; reason: string };
    try { localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: verdict.valid, checkedAt: Date.now() })); }
    catch { /* A verified license still applies to the current tab. */ }
    if (verdict.valid) setUnlocked(true, "License verified. Team policy tools are ready.");
    else setUnlocked(false, "License no longer active. You can continue using every core safety feature for free.");
  } catch {
    licenseStatus.textContent = cached?.valid ? "Verification is unavailable — using the last verified license." : "Could not verify right now. Check your connection and try again.";
  }
}

function acceptLicense(token: string) {
  try { localStorage.setItem(LICENSE_KEY, token); }
  catch { licenseStatus.textContent = "This browser blocked local license storage; verification will apply only to this tab."; }
  void verifyLicense(token, true);
}

const query = new URLSearchParams(location.search);
const returnedLicense = query.get("license");
if (returnedLicense) {
  acceptLicense(returnedLicense);
  query.delete("license");
  history.replaceState({}, "", `${location.pathname}${query.size ? `?${query}` : ""}${location.hash}`);
} else {
  const storedLicense = storedValue(LICENSE_KEY);
  if (storedLicense) void verifyLicense(storedLicense);
}

$("#show-license").addEventListener("click", () => {
  licenseForm.hidden = !licenseForm.hidden;
  if (!licenseForm.hidden) licenseInput.focus();
});
licenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = licenseInput.value.trim();
  if (token) acceptLicense(token);
});
$("#download-policy").addEventListener("click", () => {
  const name = ($("#policy-name") as HTMLInputElement).value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "custom-pattern";
  const regex = ($("#policy-regex") as HTMLInputElement).value;
  download("redaction-policy.json", `${JSON.stringify({ patterns: [{ name, regex }], entropy: { enabled: true, min_length: 24, threshold: 4.2 } }, null, 2)}\n`);
});

const buyLink = $("#buy-link") as HTMLAnchorElement;
buyLink.href = `${BILLING_BASE}/api/v1/products/${PRODUCT}/checkout`;

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  addEventListener("load", () => { void navigator.serviceWorker.register("/sw.js"); });
}
