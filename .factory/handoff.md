# Transcript Redaction Gate — polish round 1 handoff

## Status

Repair commit: `11d9eb49d3182f21bee398d4b8b7bafa82997aa6`, with final routing repair `9075ca0`, based on reviewed candidate `4b73957dfb3e92b9bfe6982f796425b74c94d378`. Deployed to <https://transcript-redaction-gate.sociobot.in>.

## Delivered

- Plain first screen that names support and engineering teams, the sharing job, and one sample-data action.
- Direct isolated `/demo/` plus `?demo=1` entry, visible demo banner, reset/start-real controls, precomputed redacted result, and `demo:trg:` storage isolation.
- Bundled `examples/support-session.log` and `trg demo`, which writes sample/output/receipt into a temporary directory.
- Full claims registry and tagged browser/Vitest claim tests.
- Real static routes for demo, privacy, terms, and designed 404; route metadata, social art, icons, canonical links, mobile navigation, focus announcements, sitemap, service worker cache, and Static Web Apps 404 override.
- Dead Team Kit checkout removed because its product-specific checkout returned 404; no unpurchasable offer remains.
- Rewritten README, copy audit, catalog description, demo documentation, design provenance, and complete finding map.

## Verification

- `npm ci`: pass.
- `npm test`: pass — 12 Rust tests plus one doctest, 9 Vitest tests, and 10 Playwright tests.
- `npm run lint`: pass.
- `npm run build`: pass; produces `dist/site/` and `dist/bin/trg`.
- All seven commands in `.factory/claims.json`: pass.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo/ .factory/evidence/local-demo`: pass (HTTP 200; 549 ms; no console errors; title/lang/one H1/main/alt/buttons passed).
- Playwright Axe WCAG A/AA mobile check: zero serious/critical issues.
- Screenshots: `.factory/evidence/local-demo/screenshot-desktop.png` and `.factory/evidence/local-demo/screenshot-mobile.png`.
- Live cold check: `verify-url.sh https://transcript-redaction-gate.sociobot.in/demo/ .factory/evidence/live-demo` passed (HTTP 200; 600 ms; zero console errors; title/lang/one H1/main/alt/buttons passed). A cache-busted unknown live path returned HTTP 404 with “Page not found — Transcript Redaction Gate” and “This page was not found”; see `.factory/evidence/live-demo/404.html`.

## Run and package

```sh
npm ci
npm test
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml
```

The factory owns publication credentials. Do not publish from this repository.

## Known gaps

None in the repaired product. The standalone `@axe-core/cli` could not launch because this image has no system Chrome binary; the required axe scan ran through Playwright’s installed Chromium instead.
