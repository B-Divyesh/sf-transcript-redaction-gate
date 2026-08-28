# Transcript Redaction Gate

An offline Rust CLI and library that removes secrets from terminal or JSONL transcripts before they cross an external boundary. It emits a redacted copy and a non-sensitive receipt containing detector names, locations, and match lengths—never the matched values.

Use it before pasting logs into a model, attaching a support bundle, or publishing CI artifacts. Detection is deterministic and local. It covers common credential shapes, assignment-style secrets, private keys, configured patterns, and high-entropy tokens; it cannot promise complete PII detection.

Live documentation: <https://transcript-redaction-gate.sociobot.in>

## Install

Build the single binary with stable Rust:

```sh
cargo install --path crates/transcript-redaction-gate
```

## CLI usage

Redact a terminal transcript and write a safe copy plus receipt:

```sh
trg redact session.log --output session.safe.log --receipt session.receipt.json
```

Gate an existing file without creating output. Exit code `2` means findings were detected:

```sh
trg check agent.jsonl --format jsonl --json
```

Read stdin and write the redacted body to stdout (the human summary goes to stderr):

```sh
support-tool logs | trg redact - --quiet > support.safe.log
```

Add project-specific detectors with a JSON policy. Patterns use Rust regex syntax and must match only the value that should be removed:

```json
{
  "patterns": [
    { "name": "customer-id", "regex": "CUST-[0-9]{8}" }
  ],
  "entropy": { "enabled": true, "min_length": 24, "threshold": 4.2 }
}
```

```sh
trg redact trace.jsonl --policy redaction-policy.json --format auto \
  --output trace.safe.jsonl --receipt trace.receipt.json
```

Inputs are never modified. The CLI refuses to overwrite an existing output unless `--force` is supplied, rejects output paths that resolve to the input, and never places paths or secret values in receipts. Run `trg --help` for all options and exit codes.

## Library usage

The public Rust surface is deliberately small:

```rust
use transcript_redaction_gate::{redact, Options};

let result = redact("Authorization: Bearer demo_token_value_1234567890", &Options::default())?;
assert!(!result.output.contains("demo_token_value"));
assert_eq!(result.receipt.findings.len(), 1);
# Ok::<(), transcript_redaction_gate::Error>(())
```

## Develop, test, and package

Requirements: stable Rust and Node.js 20+.

```sh
npm ci
npm test
npm run lint
npm run build
npm run build:site       # static site only -> dist/site
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml
```

`npm run build` produces the deployable static site at `dist/site/` and the release CLI at `dist/bin/trg`. No network, model, telemetry, or external service is used while scanning. The landing-page demo runs entirely in the browser.

## Exit codes

- `0`: completed successfully (including a redaction that removed findings)
- `1`: usage, policy, input, or output error
- `2`: `check` found sensitive content and blocked the gate

## Privacy and limits

Transcript contents stay on the device. The optional one-time license verifier sends only the pasted license token to Sociobot; see the site’s privacy and terms pages. Patterns are advisory. Review policy coverage for your environment and rotate any credential that may already have crossed a boundary.

MIT licensed. See [CHANGELOG.md](CHANGELOG.md).
