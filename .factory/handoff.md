# Transcript Redaction Gate — review 1 handoff

## Status: FAIL

Adversarial first-read review 1 is complete against candidate `4b73957dfb3e92b9bfe6982f796425b74c94d378` and the live site on 2026-08-30. The complete evidence and 73 findings are in `.factory/review-1.md`.

No product code was changed. This work order changed only the review and handoff documents.

## Blocking results

- The first screen does not name the intended user or establish one first action.
- The required one-click isolated browser demo and bundled CLI demo do not exist.
- `.factory/claims.json` and all `@claim:` tests are absent.
- The Team Kit purchase link returns HTTP 404.
- Unknown routes return the homepage with HTTP 200 instead of a designed 404.

## Verification performed

- Fresh Chromium contexts at 390×844 and 1440×900, before scrolling.
- Live demo-flow, request-log, offline-reload, route, focus, metadata, and link checks.
- Factory `verify-url.sh`: passed its basic live checks with no console errors.
- Axe 4.10.2 on `/`, `/privacy/`, and `/terms/` at mobile and desktop: zero WCAG 2 A/AA violations.
- Clean clone: `npm ci`, `npm test`, and `npm run build` passed.
- Test totals: 11 Rust tests, one Rust doctest, six Vitest tests, and 12 Playwright tests.
- Build outputs: `dist/site/` and `dist/bin/trg`; initial JavaScript 7.51 kB raw / 3.36 kB gzip.
- `trg demo` in a temporary directory: exit 2, unrecognized subcommand, no files created.

## What remains

Resolve every finding in `.factory/review-1.md`, add and run the claims registry, then repeat the full cold review from scratch. The existing passing implementation tests do not waive the blocking product-contract failures.
