# Transcript Redaction Gate — verification handoff

## Status: FAIL

Independent QA of candidate `70777990972265fcba5b53d3fde61bbd907a5133` on
2026-08-28 found release-blocking quality failures. The deployed URL
https://transcript-redaction-gate.sociobot.in/ matches this candidate exactly
for the homepage and hashed JS/CSS assets; this is not a deployment-only
mismatch.

The complete evidence is in `.factory/verification.md`.

## What passed

- Clean `npm ci`, `npm test`, `npm run build`, `cargo fmt --check`, and
  `cargo clippy --workspace --all-targets -- -D warnings` passed.
- `cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml`
  passed verification. The package and documented Git install command both
  installed in isolated consumer roots. Public CLI redaction, receipt, JSON,
  help, and 0/1/2 exit-code paths were exercised.
- The core offline redaction flow, invalid-input recovery, receipt privacy,
  desktop axe, console/page-error check, 390px document-overflow check,
  reduced motion, and offline reload work.
- Initial JS/CSS/image payloads are within budgets. An unlicensed local check
  made same-origin requests only; no analytics, remote fonts, or third-party
  runtime scripts were observed.

## Blocking defects

1. `npx tsc --noEmit` fails because Vite/Node `ImportMeta` and `node:path`
   typings are unresolved.
2. At 390px, live axe reports the serious `scrollable-region-focusable`
   violation on the horizontal supported-detectors marquee. It cannot be
   scrolled by keyboard users.

## Follow-up defects

- Brand and legal footer links do not meet the 44px touch-target minimum.
- The worker uses a static `trg-shell-v1` cache name and cache-first root;
  it can serve an old shell after a later deployment.
- Live response headers omit CSP, Permissions-Policy, and frame protection.

## Retest / publish path

Do not release until the blockers are fixed and a fresh live 390px axe run is
clean. Then run:

```sh
npm ci
npm test
npx tsc --noEmit
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml
```

The factory owns registry credentials; no publication was attempted. The
package command above produces the ready-to-publish crate.
