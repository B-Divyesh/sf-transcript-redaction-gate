# Independent verification 3 — PASS

**Work order:** `transcript-redaction-gate-verify-3`  
**Candidate commit:** `a6c1d39afb00727b302d0f7e86f617829e6ae645`  
**Live URL:** https://transcript-redaction-gate.sociobot.in/  
**Date:** 2026-08-28

## Verdict

**PASS.** Fresh independent evidence confirms that the candidate builds,
packages, and performs the required offline transcript-redaction job end to
end. The live static deployment byte-matches the candidate build. No
release-blocking defects were found.

## Clean-checkout release gates

The checkout was clean at the requested SHA before installation. The following
all passed:

```sh
npm ci
npm audit --audit-level=high
npm test
npm run lint
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml --locked
```

`npm ci` installed 61 packages; the high-severity audit reported zero
vulnerabilities. `npm test` includes `tsc --noEmit` and passed 11 Rust
unit/integration tests, 1 compiling Rust doctest, 6 Vitest tests, and 12
Playwright flows. These include the seeded 200-item corpus, error paths,
mobile keyboard/axe coverage, offline reload, stale-shell revalidation, and a
real old-worker-to-new-worker upgrade fixture. `npm run lint` passed TypeScript,
`cargo fmt --check`, and clippy with warnings denied. `npm run build` produced
`dist/site/` and `dist/bin/trg`. Locked package verification passed and created
a 12,622-byte compressed / 40.6-KiB unpacked crate.

| Asset | Raw | Gzip | Result |
| --- | ---: | ---: | --- |
| Initial JS | 7,507 B | 3,360 B | PASS, below 200 KB |
| Main CSS | 11,063 B | 3,320 B | PASS, below 50 KB |
| Fonts | 0 B | 0 B | PASS |
| Mobile hero WebP | 72,004 B | — | PASS, below 300 KB |

The project uses system fonts only. A fresh Lighthouse CLI attempt could not
attach to the supplied Chromium (`Unable to connect to Chrome`) even with its
executable path and no-sandbox flags, so no Lighthouse score is claimed.
Browser, axe, responsive, and bundle checks below passed.

## Packed consumer and core product exercise

I installed `target/package/transcript-redaction-gate-0.1.0` into a clean
temporary consumer root with `cargo install --path … --root … --locked`, then
compiled and ran an independent Rust consumer using the documented public
`redact` and `Options` API. It removed a synthetic bearer value, preserved a
normal diagnostic line, and reported one finding.

The installed `trg --help` documents both commands and exit codes 0/1/2.
Independent CLI checks produced these outcomes:

| Case | Result |
| --- | --- |
| Bearer transcript, `check --json` | exit 2; blocked receipt; no synthetic token |
| Clean diagnostic transcript | exit 0; `PASS — no configured sensitive patterns detected` |
| Custom `CUST-[0-9]{8}` policy | exit 2; detector named `policy:customer-id`; receipt contained no identifier |
| Malformed JSONL forced as JSONL | exit 1; reports line 1 and fails closed |
| `redact - --output -` | exit 0; normal line retained; receipt had neither synthetic value nor consumer path |
| Input and output both `/dev/null` | exit 1; refuses to overwrite the input |

The repository's seeded-corpus test passed its declared result: 200/200
synthetic credentials/identifiers blocked and 50/50 non-secret diagnostic lines
preserved. All fixtures were synthetic.

## Live deployment and browser QA

The deployment is the candidate, not a deployment-only variant. Local/live
SHA-256 values matched for home HTML
`7ff90910c921c3a7d1fe59ac3523ea1003427fc8e21c6eb040fd2ec9784f72ea`,
privacy HTML `43d46fcc8eb37590fb83a7e2d1e0d35d76b91ca45e2d004e43e13ae1b9294c77`,
terms HTML `55c648bb82402587d35041131231b2272e36faea42b69b744293adbe7bc0df4a`,
worker `8bd81d9537ad86528dcbd7ccac0a1550467008be0b828f37584cdddec72287c1`,
JS `9bf1f280eedcab17f280167792f8d37df9dc38a18a2d3528cad9e7e282c59a69`,
and CSS `48b7d4393841f3d795feb58261a981f40f9108e1f78a87922cd0a215fa12011e`.

Fresh Chromium checks at 1440×1000 and 390×844 found no console or page errors.
Desktop default-workbench redaction removed the synthetic token without a
network request. At 390px, first Tab visibly focused the skip link, document
overflow was 0px, empty input announced an actionable error and returned focus,
invalid regex produced recovery text and then succeeded once corrected, and all
brand/footer targets measured at least 44px high. The passing Playwright suite
also covers keyboard-only typing and Enter activation of the workbench.

Axe 4.10.2 WCAG 2 A/AA had no serious or critical findings on desktop `/`,
`/privacy/`, or `/terms/`, or on the 390px homepage. Reduced motion computed
to 0.01ms transition/animation durations and `scroll-behavior: auto`. After
the live service worker controlled the page, offline reload still loaded the
homepage and completed a local redaction. The current worker cache is
`trg-shell-3eda4fb50618`; automated upgrade coverage verifies old cache removal
and new-release offline use.

## Privacy, response policy, and rate limiting

- Free redaction is local-first: no request was made when the local check ran.
  There are no analytics, remote fonts, or third-party runtime scripts. The
  optional Sociobot license verifier/checkout is the sole external boundary.
- A synthetic invalid license verifier response was
  `{"valid":false,"reason":"invalid","expires_at":null}`, CORS-enabled for
  the product origin, and `Cache-Control: no-store`. There is no sign-in flow.
- A 40-request concurrent burst to the verifier using a synthetic token returned
  22×200 and 18×429. The first observed 429 was request 2; all 429 responses
  carried `Retry-After: 1` or `2` seconds.
- Home, legal pages, worker, JS, and CSS carried HSTS, `Referrer-Policy:
  same-origin`, `X-Content-Type-Options: nosniff`, restrictive self-only CSP
  (except the two intended Sociobot API origins in `connect-src`),
  `Permissions-Policy`, and `X-Frame-Options: DENY`.
- HTML and worker use short revalidation caching (`max-age=30`); hashed JS/CSS
  are `public, max-age=31536000, immutable`. The worker provides the offline
  shell.

## Defects

None found. No P0, P1, P2, or P3 defects are open from this verification.

## Reproduction

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml --locked
```

The final package command is the ready-to-publish crate command. Registry
publication was intentionally not attempted.
