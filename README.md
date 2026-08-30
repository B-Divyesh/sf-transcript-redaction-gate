# Transcript Redaction Gate

Remove detected secrets from terminal and JSONL transcripts before sharing them. Transcript Redaction Gate is an offline Rust CLI and library.

It writes a redacted transcript plus a receipt. The receipt lists detector names, locations, and match lengths without matched values. The same input and rules produce the same output. It cannot detect every kind of personal data.

Live documentation: <https://transcript-redaction-gate.sociobot.in>

## Install

Build the binary with Rust 1.85 or later:

```sh
cargo install --path crates/transcript-redaction-gate
```

## Try the bundled demo

`trg demo` writes a bundled sample, redacted transcript, and receipt in a new temporary directory.

```sh
trg demo
```

The browser demo is available at <https://transcript-redaction-gate.sociobot.in/demo/>. It starts with the same sample result and keeps its sample state separate from real use.

## CLI usage

Redact a transcript and save its receipt:

```sh
trg redact session.log --output session.redacted.log --receipt session.receipt.json
```

Check a file without writing a redacted transcript. Exit code 2 means a detected value blocked the check:

```sh
trg check agent.jsonl --format jsonl --json
```

Read stdin and send the redacted transcript to stdout:

```sh
support-tool logs | trg redact - --quiet > support.redacted.log
```

Add a custom pattern with a JSON policy:

```json
{
  "patterns": [{ "name": "customer-id", "regex": "CUST-[0-9]{8}" }],
  "entropy": { "enabled": true, "min_length": 24, "threshold": 4.2 }
}
```

```sh
trg redact trace.jsonl --policy redaction-policy.json --output trace.redacted.jsonl
```

The CLI does not modify its input. It refuses an existing output unless you pass `--force`. It rejects an output path that points to the input.

## Library usage

```rust
use transcript_redaction_gate::{redact, Options};

let result = redact("Authorization: Bearer demo_token_value_1234567890", &Options::default())?;
assert!(!result.output.contains("demo_token_value"));
assert_eq!(result.receipt.findings.len(), 1);
# Ok::<(), transcript_redaction_gate::Error>(())
```

## Develop, test, and package

Requirements: Rust 1.85+ and Node.js 20+.

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --manifest-path crates/transcript-redaction-gate/Cargo.toml
```

`npm run build` creates the static site in `dist/site/` and the CLI in `dist/bin/trg`.

## Exit codes

- `0`: redaction or check completed.
- `1`: input, policy, or output error.
- `2`: `check` found detected values.

## Privacy and limits

Scanning does not use a model, telemetry, or a network service. The browser demo does not upload transcript text. Review the receipt and rotate any credential that may already have been shared.

MIT licensed. See [LICENSE](LICENSE) and [CHANGELOG.md](CHANGELOG.md).
