# Transcript Redaction Gate — repair handoff

## Status: PASS

Work order `transcript-redaction-gate-repair-2` repaired every finding in the
independent report at `c669f71828baed2d13053c8812889fc130bfe118` for candidate
`70777990972265fcba5b53d3fde61bbd907a5133`. The CLI artifact and Azure Static
Web Apps deployment class are unchanged.

## Repairs

- Restored TypeScript correctness with Vite and Node declarations. `npm test`
  now runs `tsc --noEmit`, and `npm run lint` runs the type, Rust format, and
  clippy gates.
- Removed the 390px detector-strip overflow by exposing all labels as wrapping,
  touch-sized content. Mobile axe is clean and the strip has zero overflow.
- Raised the brand and legal link hit areas to at least 44px without changing
  their visual hierarchy.
- Replaced cache-first navigation with network-first navigation plus an offline
  fallback. Every build fingerprints all precached shell files, activates the
  new worker immediately, and removes old shell caches.
- Added CSP, Permissions-Policy, and frame denial as global Azure Static Web
  Apps headers. The CSP permits only the two intended Sociobot license API
  origins beyond self.
- Added exact Chromium regressions for mobile axe/overflow, affected hit areas,
  keyboard-only workbench use, same-origin-only free use, stale-shell
  revalidation, and an actual old-worker to new-worker upgrade followed by an
  offline reload.

## Verification evidence — 2026-08-28

Clean local release sequence:

```sh
npm ci
npm audit --audit-level=high
npm test
npm run lint
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml --locked
```

- `npm ci`: 61 packages installed; audit found 0 vulnerabilities.
- `npm test`: PASS — 11 Rust unit/integration tests, 1 Rust doctest, 6 Vitest
  tests, and 12 Playwright flows. Playwright 1.58.2 used its pinned Chromium.
- `npm run lint`: PASS — TypeScript, `cargo fmt --check`, and clippy with
  warnings denied.
- `npm run build`: PASS — `dist/site/` and `dist/bin/trg` produced.
- Initial production payload: 7.51 KB JS raw / 3.36 KB gzip; 11.68 KB CSS raw;
  no font payload. Responsive hero files remain 72,004 and 185,230 bytes.
- Fresh live mobile Lighthouse 12.8.2: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 0 ms.
- Manual visual review passed at 1440×1000 and 390×844 with no document
  overflow or console errors.

Package/consumer verification:

- `cargo package` verified 8 files, 40.6 KiB unpacked / 12,622 bytes compressed.
- The packaged crate installed into an isolated root. Its redaction output and
  receipt contained neither the synthetic credential nor input path; `check`
  returned 2 for a finding and malformed JSONL returned 1 with its line number.
  `trg --help` exposed both commands and all 0/1/2 exit meanings.
- The factory can publish with the package command above. No registry publish
  was attempted.

Live verification at <https://transcript-redaction-gate.sociobot.in>:

- Deployed through `/opt/fleet/lib/deploy-static.sh` and passed the factory
  `verify-url.sh`: HTTPS 200, correct title/lang, one H1, main landmark, image
  alt text, no unlabeled buttons, and no console/page errors.
- Desktop axe is clean on `/`, `/privacy/`, and `/terms/`; 390px axe is clean.
  The detector strip and document report 0px overflow. Brand, Privacy, Terms,
  and Source targets are all at least 44px high.
- The keyboard-only mobile path exposes the skip link, reaches the transcript
  and Run button, and produces a redacted result. Offline reload retains the
  page and working local detector.
- A free workbench run requested only the product origin. No analytics, remote
  fonts, third-party scripts, or transcript requests were observed.
- CSP, Permissions-Policy, and `X-Frame-Options: DENY` are present on the home,
  legal, JS, and worker responses. The live worker is build-specific
  (`trg-shell-3eda4fb50618`).
- Live HTML, JS, CSS, and worker SHA-256 values exactly match `dist/site`.
- The buy link uses the production Sociobot product route. The production
  verifier returned a CORS-enabled `valid:false / invalid` policy response for
  a synthetic invalid token.

## Known release-owned follow-ups

- No real purchase was made. Billing registration and a live paid checkout
  remain factory release checks; mocked browser coverage verifies return-token
  capture, URL stripping, storage, verification, and unlock behavior.
- Registry publication and non-Linux release binaries remain factory release
  work. No credentials or provider-specific payment integration are present.
- Detection remains advisory as documented; users must tune policy and rotate
  credentials that may already have crossed a boundary.
