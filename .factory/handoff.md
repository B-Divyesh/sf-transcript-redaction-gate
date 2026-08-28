# Transcript Redaction Gate — build handoff

## Shipped

- Rust 0.1.0 library and `trg` single binary with `redact` and CI-oriented `check` commands.
- Offline detectors for private keys, AWS/GitHub/Google/Slack tokens, JWTs, authorization headers, secret assignments, credentialed database URLs, high-entropy values, and custom Rust regex policy patterns.
- Plain terminal text and validated JSONL input, stdin/stdout support, safe default filenames, input overwrite and symlink protection, non-sensitive JSON receipts, JSON scripting output, documented exit codes, and helpful errors.
- Receipts contain detector, line, column, and match length only—never transcript values or paths.
- Dithered proof-press landing site with a fully local redaction workbench, empty/error/offline states, keyboard paths, responsive 390px layout, original responsive WebP hero, install documentation, honest limitations, privacy, and terms.
- $39 one-time Team Kit integration through Sociobot: checkout link, return-token capture and URL removal, exact local-storage key, optimistic cached unlock, once-daily background verification, offline behavior, invalid/revoked handling, and paste-to-restore form. Core detection and exports are never gated.
- Versioned service-worker shell cache, immutable asset cache configuration, sitemap, and robots policy. No analytics, third-party runtime scripts, remote fonts, or scan-time network calls.

## Verification

Run from the repository root:

```sh
npm ci
npm test
npm run build
cargo clippy --workspace --all-targets -- -D warnings
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml --locked
```

Verified on 2026-08-28:

- `npm test`: 12 Rust tests/doctests, 4 browser detector tests, and 7 Playwright flows passed. Playwright covers the real redaction path, empty input, 390px overflow, serious/critical axe findings, paid return and unlock, offline reload/use, and console errors.
- Synthetic non-secret test corpus: 200/200 seeded credential and configured-identifier values blocked; 50/50 diagnostic lines preserved (100%). Fixtures are generated and contain no live credentials.
- `cargo clippy --workspace --all-targets -- -D warnings`: passed.
- `npm audit`: 0 vulnerabilities.
- `cargo package`: verified; 40.6 KiB unpacked / 12.3 KiB compressed. The factory can publish with the package command above; no publishing was attempted.
- `npm run build`: passed. Static deployment root is `dist/site/` with `index.html`; optimized Linux CLI is `dist/bin/trg` (2.2 MiB).
- Production asset budgets: initial JS 7.3 KiB raw / 3.3 KiB gzip; CSS 11.5 KiB raw combined; responsive hero 71 KiB at 800px and 181 KiB at 1200px; no font payload.
- Lighthouse 12.8.2, mobile defaults, local production preview: Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9s, LCP 2.4s, CLS 0, total blocking time 0ms. Lab Lighthouse does not report field INP; 0ms blocking time is the available responsiveness proxy.
- Manual visual review completed at 1440×1000 and 390×844. The site has one `<h1>` per page, `lang`, main landmarks, meaningful hero alt text, 44px targets, visible focus treatment, high-contrast tokens, and reduced-motion overrides.

## Product and asset notes

- The hero was generated with `/opt/fleet/lib/gen-image.sh` using the `factory-image` deployment, visually reviewed, and locally converted to 1200px and 800px WebP variants. The full prompt and provenance are in `.factory/design.md`.
- Billing uses `https://api.sociobot.in/api/v1/products/transcript-redaction-gate/...`; it contains the slug, not a hardcoded provider product ID. Factory registration must exist before checkout works in production.
- The browser detector is intentionally a convenient subset. The Rust CLI is the authoritative scanner for automation, JSONL validation, entropy detection, and full built-in coverage.

## Known gaps / next steps

- Pattern and entropy detection are advisory, not complete PII detection; users must tune policy and rotate already-exposed credentials.
- Registry publication and cross-platform release binaries remain factory release work. The crate and source-based install are ready; only the container’s Linux binary is built here.
- No live purchase was made. The verified license flow is covered with a mocked billing response; factory staging should exercise checkout with its registered test product before release.
