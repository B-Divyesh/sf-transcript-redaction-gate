# Verification report — FAIL

**Work order:** `transcript-redaction-gate-verify-1`  
**Candidate:** `70777990972265fcba5b53d3fde61bbd907a5133`  
**Live URL:** https://transcript-redaction-gate.sociobot.in/  
**Date:** 2026-08-28

## Verdict

**FAIL.** The core package and production build work, but two release gates
fail: the repository TypeScript check fails, and axe finds a **serious**
accessibility violation on the 390px live homepage. The deployment exactly
matches the candidate, so neither is a deployment-only failure.

## Clean-checkout evidence

| Command / check | Result |
| --- | --- |
| `npm ci` | PASS — 59 packages installed; audit reports 0 vulnerabilities. |
| `npm test` | PASS — 11 Rust unit/integration tests, 1 doctest, 4 Vitest tests, 7 Playwright flows. |
| `cargo fmt --check` | PASS. |
| `cargo clippy --workspace --all-targets -- -D warnings` | PASS. |
| `npm run build` | PASS — generates `dist/site/` and `dist/bin/trg`. |
| `cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml` | PASS — package verification; 40.6 KiB unpacked / 12.3 KiB compressed. |
| `npx tsc --noEmit` | **FAIL** — unresolved `ImportMeta.env`, `node:path`, and `import.meta.dirname` typings. |

The built initial JS is 7,507 B raw / 3,360 B gzip; all CSS is 11,450 B raw;
there is no font payload. The responsive hero is 72,004 B at 800px and 185,230
B at 1200px. These are within the supplied static budgets.

## CLI and library consumer checks

Installed `target/package/transcript-redaction-gate-0.1.0` into an isolated
consumer root and exercised the public binary. Fake bearer and assignment
values were redacted; the generated receipt had no fake value or path; `check
--json` returned **2** for a finding; clean input returned **0**; malformed
JSONL with `--format jsonl` returned **1** with its line number. `trg --help`
documents both commands and the three exit-code meanings.

The landing-page command was also installed independently:

```sh
cargo install --git https://github.com/B-Divyesh/sf-transcript-redaction-gate.git transcript-redaction-gate --locked
```

It resolved `70777990` and installed `trg 0.1.0`. The Rust suite's generated
non-secret corpus also verifies 200/200 seeded credentials/identifiers blocked
and 50/50 diagnostic lines preserved.

## Live deployment checks

The homepage matches the local `dist/site/index.html` exactly. The local and
deployed assets have identical SHA-256 values:

| Asset | SHA-256 |
| --- | --- |
| `assets/main-C2Rf4hHo.js` | `9bf1f280eedcab17f280167792f8d37df9dc38a18a2d3528cad9e7e282c59a69` |
| `assets/style-Dn5CGt0r.css` | `7c3edb91c1c7fa59a7401df370a084b48afe4fdac46da00c189bcd767dd38aeb` |

At 390×844, Chromium found zero document horizontal overflow, a visible
skip-link on first Tab, no console/page errors, successful normal redaction,
useful empty-state recovery with focus returned to the input, and useful
invalid-regex recovery. A normal unlicensed visit and local workbench action
made requests only to the site's own origin. No analytics, remote fonts, or
third-party runtime scripts were observed; the optional license verifier is the
designed external boundary.

Desktop axe WCAG 2 A/AA serious/critical findings are empty on `/`,
`/privacy/`, and `/terms/`. Legal pages are also clear on mobile. Offline reload
after installation retained the homepage and workbench. Reduced-motion mode has
`scroll-behavior: auto` and 0.01ms animation/transition durations.

Live headers include HSTS, `Referrer-Policy: same-origin`, and nosniff. HTML
uses short revalidation caching and hashed assets are immutable for one year.

## Defects

### P1 — Type-check failure

**Reproduce:** `npx tsc --noEmit`

`site/src/main.ts` cannot resolve `ImportMeta.env`; `vite.config.ts` cannot
resolve `node:path` or `import.meta.dirname`. TypeScript is installed and
configured in this repository, so this is an available quality gate. Add the
Vite and Node type declarations/configuration and make it a normal scripted
gate.

### P1 — Serious mobile axe failure

**Reproduce:** live `/`, Chromium 390×844, axe 4.10.2 tags `wcag2a,wcag2aa`.

`scrollable-region-focusable` (impact **serious**) targets the horizontally
overflowing `<section class="marquee" aria-label="Supported detectors">`. It is
neither focusable nor contains focusable content, so keyboard users cannot
scroll to all detector labels. Desktop axe is clean only because it does not
overflow. Make it keyboard-scrollable, remove the mobile horizontal overflow,
or expose all content another accessible way.

### P2 — Undersized touch targets

Live measurements: the home brand link is 128×25px desktop and 110×20px at
390px; footer `Terms` and `Privacy` are 39×15px and 55×15px. They miss the
44px minimum touch target.

### P2 — Service-worker update/cache risk

`site/public/sw.js` hard-codes `const CACHE = "trg-shell-v1"` and uses
cache-first lookup for `/`. The live worker has that same sole cache name. A
later deploy which changes the shell but not worker code will leave existing
clients on old cached HTML indefinitely. Version the worker/cache per build (or
revalidate the shell) and test a real old-to-new worker update.

### P3 — Missing browser hardening policies

Live HTML, JS, legal pages, and `sw.js` omit CSP, Permissions-Policy, and
frame protection. HSTS/referrer policy/nosniff are present. Add a tested CSP
and minimal permissions/frame policy at hosting level.

## Measurement limitation

A fresh Lighthouse 12.8.2 live mobile run was attempted. The available Chrome
launcher could not connect to the preinstalled Playwright Chromium even when
`CHROME_PATH` was supplied, so it produced no trustworthy scores. Bundle
budgets above are measured; the prior handoff's historical Lighthouse values
were not treated as fresh evidence.

## Required retest

```sh
npm ci
npm test
npx tsc --noEmit
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml
```

Then re-run live axe at desktop and 390px, touch/keyboard checks, and an actual
old-shell to new-shell service-worker update before changing the verdict.
