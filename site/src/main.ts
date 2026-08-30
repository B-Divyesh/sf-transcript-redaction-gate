import { redactInBrowser, type BrowserReceipt } from "./redactor";

const SAMPLE = `2026-08-30T09:14:22Z support-agent: retrying customer export
Authorization: Bearer demo_token_value_1234567890
build completed in 1325ms
customer=CUST-12345678 status=failed
2026-08-30T09:14:25Z support-agent: attaching receipt for review`;
const DEMO_PREFIX = "demo:trg:";

function byId<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

const transcript = byId<HTMLTextAreaElement>("transcript");
if (transcript) {
  const pattern = byId<HTMLInputElement>("demo-pattern")!;
  const safeOutput = byId<HTMLTextAreaElement>("safe-output")!;
  const error = byId<HTMLElement>("demo-error")!;
  const status = byId<HTMLElement>("demo-status")!;
  const badge = byId<HTMLElement>("gate-badge")!;
  let currentReceipt: BrowserReceipt | undefined;

  const updateCount = () => {
    byId("input-count")!.textContent = `${new Blob([transcript.value]).size.toLocaleString()} bytes`;
  };

  const runCheck = () => {
    error.hidden = true;
    if (!transcript.value.trim()) {
      error.textContent = "Add transcript text, then redact it.";
      error.hidden = false;
      transcript.focus();
      return;
    }
    try {
      const checked = redactInBrowser(transcript.value, pattern.value);
      currentReceipt = checked.receipt;
      safeOutput.value = checked.output;
      byId("finding-count")!.textContent = String(checked.receipt.finding_count);
      const list = byId<HTMLOListElement>("finding-list")!;
      list.replaceChildren(...checked.receipt.findings.map((finding) => {
        const item = document.createElement("li");
        item.textContent = `Line ${finding.line}, column ${finding.column}: ${finding.detector}`;
        return item;
      }));
      badge.textContent = checked.receipt.blocked ? "Redacted" : "No matches";
      badge.className = `badge ${checked.receipt.blocked ? "blocked" : "pass"}`;
      status.textContent = checked.receipt.blocked ? `${checked.receipt.finding_count} detected values removed. Redacted transcript is ready.` : "No detected values were found.";
    } catch (caught) {
      error.textContent = caught instanceof Error ? caught.message : "The transcript could not be redacted.";
      error.hidden = false;
      status.textContent = error.textContent;
    }
  };

  const setSample = () => {
    transcript.value = SAMPLE;
    pattern.value = "CUST-[0-9]{8}";
    try { sessionStorage.setItem(`${DEMO_PREFIX}sample-loaded`, "1"); } catch { /* Storage is optional. */ }
    updateCount();
    runCheck();
  };

  const copyText = async (value: string, button: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(value);
      const previous = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = previous; }, 1200);
    } catch {
      status.textContent = "Clipboard access was unavailable. Select the text and copy it manually.";
    }
  };

  transcript.addEventListener("input", updateCount);
  byId<HTMLButtonElement>("run-check")!.addEventListener("click", runCheck);
  byId<HTMLButtonElement>("copy-output")!.addEventListener("click", (event) => copyText(safeOutput.value, event.currentTarget as HTMLButtonElement));
  byId<HTMLButtonElement>("download-receipt")!.addEventListener("click", () => {
    if (!currentReceipt) return;
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([`${JSON.stringify(currentReceipt, null, 2)}\n`], { type: "application/json" }));
    anchor.download = "transcript.receipt.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  });
  byId<HTMLButtonElement>("reset-demo")?.addEventListener("click", () => {
    try { Object.keys(sessionStorage).filter((key) => key.startsWith(DEMO_PREFIX)).forEach((key) => sessionStorage.removeItem(key)); } catch { /* Storage is optional. */ }
    setSample();
    status.textContent = "Demo reset. The sample result is ready.";
  });
  setSample();
}

document.querySelectorAll<HTMLButtonElement>(".copy-command").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.command ?? "");
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy install command"; }, 1200);
    } catch { /* The visible command remains selectable. */ }
  });
});

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  addEventListener("load", () => { void navigator.serviceWorker.register("/sw.js"); });
}
