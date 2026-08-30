# Adversarial first-read review 1 — Transcript Redaction Gate

**Verdict: FAIL**  
**Reviewed:** 2026-08-30  
**Live URL:** <https://transcript-redaction-gate.sociobot.in>  
**Candidate:** `4b73957dfb3e92b9bfe6982f796425b74c94d378`

The review found five blocking failures, 68 further findings, and no claim that can be accepted through the required claims gate. A passing test suite does not change the verdict because the first screen, demo, checkout, claim registry, and 404 behavior fail the supplied product contract.

## Cold first screen, before scrolling

Both captures used a new Chromium context with no storage. The mobile viewport was 390×844 and the desktop viewport was 1440×900. Neither page was scrolled before recording the copy.

| Question | 390px answer | Desktop answer |
| --- | --- | --- |
| What does this do? | It appears to remove credentials and token-like text from a transcript on my device, then make a receipt. | Same. |
| For whom? | Cannot answer. No role, team, or situation is named. | Cannot answer. The navigation adds “Team kit” but does not identify the user. |
| What should I click first? | Cannot choose between “Run local check” and “Copy install command.” The navigation is hidden. | Cannot choose between “Run local check” and “Copy install command.” |

Exact first-screen text that failed the test:

- Headline: “PROVE THE TRANSCRIPT IS CLEAN BEFORE IT LEAVES.”
- Supporting copy: “Redact credentials, policy patterns, and high-entropy tokens locally. Keep the useful diagnostics. Export a receipt that contains evidence—not secrets.”
- Competing actions: “Run local check” and “Copy install command.”

The function is inferable, but the user and first action are not. This is blocking under the required first-screen shape.

## Findings — blocking

### F-1-1 — The first screen does not name the user or one first action

**Location/quote:** live `/`, headline, supporting copy, and the two actions quoted above. On mobile, `.site-header nav` is hidden.  
**Why it fails:** a cold visitor can infer redaction but cannot tell whether this is for support staff, developers, security reviewers, or another audience. Two actions compete, and neither says that sample data is available.  
**Concrete fix:** use “Redact secrets before sharing transcripts” as the headline. Follow with “For support and engineering teams sharing terminal logs, it removes common credentials while keeping diagnostic lines.” Use one primary action, “Try it with sample data,” beside “See a redacted transcript and receipt immediately.” Show three facts: “Runs on your device,” “Core CLI is free,” and “Team Kit costs $39 once.”

### F-1-2 — The required one-click sandbox demo does not exist

**Location/quote:** live hero action “Run local check”; live `/demo`; CLI help.  
**Evidence:** clicking the hero action only changes the hash to `#workbench`; the result remains hidden and the badge remains “Waiting.” A second click is required. `/demo` serves the ordinary homepage, with the ordinary title, no result, no demo banner, no reset, and no “Start for real.” `trg demo` exits 2 with “unrecognized subcommand 'demo'.” There is no `examples/` sample, terminal recording, `.factory/demo.md`, separate demo storage namespace, or documented demo command.  
**Why it fails:** the sample editor is not the specified demo. The first screen after the action does not show the product’s result, and there is no visible sandbox contract or reset. The CLI artifact also lacks its required bundled demo path.  
**Concrete fix:** add a first-screen “Try it with sample data” action to a real `/demo` route. Render a realistic terminal or JSONL sample with the redacted transcript and receipt already visible. Keep a persistent “Demo — sample data, nothing is saved” banner with “Reset demo” and “Start for real.” Add `trg demo` or `trg --demo`, bundled `examples/`, a self-hosted recording of that command, a `demo:` namespace if anything is stored, and `.factory/demo.md`. Test reset, isolation, direct `/demo`, offline use, and the CLI command from a temporary directory.

### F-1-3 — The claims registry and tagged claim tests are absent

**Location:** `.factory/claims.json` is missing; repository-wide search finds no `@claim:` test.  
**Why it fails:** the landing page and README make many operational, privacy, detector, licensing, compatibility, and output claims. None has the required one-to-one registry entry and tagged observable test. Therefore every claim remains untested by the product’s claims gate, even though the general suite passes.  
**Concrete fix:** create `.factory/claims.json`. Add exactly one `@claim:<id>` test for each retained claim listed under “Unlisted claims” below, using only the demo entry and shipped sample in a clean context or temporary directory. Remove copy that cannot be tested.

### F-1-4 — The paid action is dead

**Location/quote:** live “Buy team kit — $39 once” points to `https://api.sociobot.in/api/v1/products/transcript-redaction-gate/checkout`.  
**Evidence:** a direct link crawl returns HTTP 404. The earlier `.factory/handoff.md` already left billing registration and a live checkout as release-owned follow-ups.  
**Why it fails:** the page offers a paid result that a visitor cannot buy. This also invalidates the nearby checkout and $39 purchase claims.  
**Concrete fix:** register and verify the product-specific checkout before showing the offer, or remove the purchase action until it exists. Add a claim test that follows the product link to a valid checkout start without making a purchase, plus a release test for a completed purchase and restore.

### F-1-5 — Unknown URLs masquerade as the homepage

**Location:** live `/this-route-does-not-exist` and `site/public/staticwebapp.config.json`.  
**Evidence:** the unknown URL returns HTTP 200, the homepage title, and the homepage H1. There is no 404 document or response override.  
**Why it fails:** broken links are hidden, search engines receive false success responses, and visitors get no explanation or route back. The supplied structure contract makes broken routing blocking.  
**Concrete fix:** add a designed proof-sheet 404 with a clear “Return home” link. Configure the host’s 404 response override so unknown URLs return the designed page with HTTP 404. Add direct and browser tests for status, title, H1, and return link.

## Findings — major structure and behavior

### F-1-6 — Required route metadata is missing

**Location:** live `/`, `/privacy/`, `/terms/`, and `/demo`.  
**Evidence:** all lack a canonical link, Open Graph title/description/image, Twitter card metadata, and an apple-touch icon. There is no 1200×630 share image. `/demo` reuses the homepage title instead of “Demo — Transcript Redaction Gate.”  
**Why it fails:** shared links have no product-specific preview, routes are not canonicalized, and the supposed demo cannot identify itself.  
**Concrete fix:** add route-specific canonical and social metadata, an original 1200×630 proof-sheet image, SVG favicon plus 180px apple-touch icon, and the required route titles. Test every route’s metadata.

### F-1-7 — Header and footer structure changes by route and disappears on mobile

**Location:** all live routes and `site/src/style.css:142`.  
**Evidence:** the landing header has Try locally/Install/Team kit, while legal headers have only Privacy/Terms. Below 900px the header navigation is `display: none` with no replacement. Legal footers omit the link for the current legal page; every footer omits “Built by Param Factory” and a version/build ID.  
**Why it fails:** route navigation is inconsistent, phone users lose the primary navigation, and the standard footer is incomplete.  
**Concrete fix:** use one responsive header on every route with Home, Demo, Install, and Privacy or equivalent, exposed through an accessible mobile control. Use one footer everywhere with the product sentence, Privacy, Terms, “Built by Param Factory,” and the build ID.

### F-1-8 — Route changes do not move or announce focus

**Location:** navigation from `/` to `/privacy/` and browser Back.  
**Evidence:** `document.activeElement` is `BODY` after both navigation and Back. Privacy and Terms have no polite live region.  
**Why it fails:** keyboard and screen-reader users receive no reliable indication that the page changed.  
**Concrete fix:** focus the destination H1 on load/navigation with `tabindex="-1"`, announce its text in a polite live region, and add a browser test for direct links, forward navigation, and Back.

### F-1-9 — The sitemap cannot expose the required demo route

**Location:** live `/sitemap.xml`.  
**Evidence:** it lists only `/`, `/privacy/`, and `/terms/`.  
**Why it fails:** once the required real `/demo` route exists, it must be a first-class URL discoverable by the catalog and verifiers.  
**Concrete fix:** add the real `/demo` route to the sitemap and README after implementing F-1-2. Do not add the 404 route to the sitemap.

## Unlisted claim findings

Each row is an unlisted claim finding. The general tests sometimes exercise similar behavior, but there is no registry entry or uniquely tagged claim test. The concrete fix for every row is to add the named registry entry and observable test, or remove the sentence. Where copy is also unclear, the rewrite is given in the copy findings.

| ID | Exact claim and location | Concrete claim test |
| --- | --- | --- |
| F-1-10 | Meta description: “Offline deterministic secret redaction for terminal and agent transcripts, before upload.” | `offline-redaction`: run the shipped demo offline, assert expected redaction twice, and record no external request. |
| F-1-11 | Hero: “Prove the transcript is clean before it leaves.” | Remove this completeness claim; detector tests cannot prove an arbitrary transcript is clean. Use the narrower rewrite in the copy audit. |
| F-1-12 | Hero: “Redact credentials, policy patterns, and high-entropy tokens locally.” | `detector-coverage-local`: fixtures for each named class, run in a temporary directory with networking unavailable. |
| F-1-13 | Hero: “Keep the useful diagnostics.” | `diagnostic-preservation`: assert the stated preservation threshold on the shipped corpus. Replace “useful” with a measurable description. |
| F-1-14 | Hero: “Export a receipt that contains evidence—not secrets.” | `receipt-no-values`: assert detector/location/length fields exist and every seeded value and path is absent. |
| F-1-15 | Hero fact: “Zero uploads.” | `zero-uploads`: record the full demo request log and assert only same-origin static resources; run the CLI with no network. |
| F-1-16 | Hero fact: “Deterministic.” | `deterministic-output`: run identical input and policy twice and byte-compare redacted output and normalized receipt. |
| F-1-17 | Hero fact: “CI exit codes.” | `ci-exit-codes`: assert 0 for clean/redacted success, 1 for errors, and 2 for a blocked check. |
| F-1-18 | Workbench: “Local workbench / no network” and “The demo uses a compact browser edition of the deterministic detector.” | `browser-local-deterministic`: assert repeatable output and no outgoing request during the complete demo flow. |
| F-1-19 | Workbench: “For automation and full policy control, use the Rust CLI.” | Replace “full” or add `cli-policy-controls` covering format, patterns, entropy options, stdin, output, and receipt behavior. |
| F-1-20 | Workbench: “Your text never leaves this page.” | `browser-transcript-private`: intercept all requests and assert transcript fragments never appear in URL, headers, or body. |
| F-1-21 | Workbench: “Invalid patterns are reported without changing the input.” | `invalid-pattern-preserves-input`: enter an invalid expression, run, assert the error and exact original input. |
| F-1-22 | Workflow: “Terminal text, stdin, and JSONL stay on your machine.” | `cli-inputs-local`: exercise all three inputs with networking unavailable and assert no external process/request. |
| F-1-23 | Detector strip/workflow: AWS keys, GitHub tokens, private keys, bearer auth, JWTs, entropy, custom regex, and “Known credentials, entropy, and your regular expressions.” | `detector-matrix`: one synthetic fixture and expected detector result for every advertised class. |
| F-1-24 | Workflow: “A redacted copy plus a path-free, value-free JSON receipt.” | `receipt-path-value-free`: scan serialized receipt for all seeded values and absolute/relative input paths. |
| F-1-25 | Team Kit: “One-time license / $39,” composer unlock/download behavior, and “The CLI, safety detectors, receipts, and core export remain free.” | Separate `team-kit-price`, `licensed-policy-download`, and `free-core` tests; verify the live product checkout start and unlicensed core behavior. |
| F-1-26 | Team Kit: “Secure checkout by Sociobot/Dodo, merchant of record. Refunds revoke the license automatically.” | `checkout-provider` and `refund-revokes-license`; the checkout-start test currently fails with HTTP 404. |
| F-1-27 | Limits: “Pattern detection is advisory and cannot identify every form of personal data.” | `documented-limit`: ship a clearly documented unsupported synthetic identifier and assert it is not presented as detected. |
| F-1-28 | Footer: “Offline by design. MIT-licensed core. No telemetry.” | Separate offline reload, LICENSE identity, and request/telemetry tests. |
| F-1-29 | README: “An offline Rust CLI and library that removes secrets from terminal or JSONL transcripts before they cross an external boundary.” | `cli-library-redaction`: test both public surfaces, both formats, offline, using shipped fixtures. |
| F-1-30 | README: “It emits a redacted copy and a non-sensitive receipt containing detector names, locations, and match lengths—never the matched values.” | `receipt-schema-no-values`: assert every promised field and absence of all seeded matches. |
| F-1-31 | README: “Detection is deterministic and local.” | Reuse the observable deterministic and offline tests through one registered claim ID at both copy locations. |
| F-1-32 | README detector-coverage sentence ending “it cannot promise complete PII detection.” | Register the detector matrix and documented-limit tests, or split the sentence so each testable idea maps cleanly. |
| F-1-33 | README: “Inputs are never modified.” | `input-immutable`: hash each input before and after redaction, check, errors, and output-collision attempts. |
| F-1-34 | README sentence describing `--force`, input/output collision rejection, and receipts without paths or values. | Split into three claims and test overwrite behavior, collision rejection, and receipt privacy independently. |
| F-1-35 | README: “`npm run build` produces the deployable static site at `dist/site/` and the release CLI at `dist/bin/trg`.” | `build-artifacts`: run the build from a clean clone and assert both executable/site outputs. |
| F-1-36 | README: “No network, model, telemetry, or external service is used while scanning.” | `scan-no-network`: deny network for CLI and browser scan flows and inspect process/request logs. |
| F-1-37 | README: “The landing-page demo runs entirely in the browser.” | Replace after F-1-2 with a precise browser-demo claim, then test the direct demo route and request log. |
| F-1-38 | README exit-code bullets for 0, 1, and 2. | Register one `exit-codes` claim with fixtures for all three observable outcomes. |
| F-1-39 | README: “Transcript contents stay on the device.” | `transcript-stays-local`: inspect all browser requests and run the CLI with network disabled. |
| F-1-40 | README: “The optional one-time license verifier sends only the pasted license token to Sociobot.” | `license-request-minimal`: intercept the verifier request and assert destination, method, and exact allowed data. |
| F-1-41 | Landing/README compatibility: “Rust 1.85+,” “stable Rust,” and “Node.js 20+.” | `minimum-toolchains`: build and test with Rust 1.85 and Node.js 20, the minimum declared toolchains. |
| F-1-42 | README/footer: “MIT licensed.” | `license-file`: assert the distributed source/package includes the expected MIT license and metadata. |

## Plain-words findings

### F-1-43 — “Try locally” does not name the result

**Location:** desktop navigation.  
**Why:** “try” does not say what happens, and the same target is not a completed demo.  
**Rewrite:** “Redact a sample” after F-1-2 exists.

### F-1-44 — “Run local check” does not name the result

**Location:** hero and workbench buttons.  
**Why:** “check” can mean validation, scanning, or redaction.  
**Rewrite:** hero “Try it with sample data”; workbench “Redact transcript.”

### F-1-45 — The hero eyebrow is jargon, not a useful section label

**Quote:** “PRE-EXPORT PRIVACY BOUNDARY / OFFLINE CLI.”  
**Rewrite:** “Offline transcript redaction.”

### F-1-46 — The hero uses an unprovable safety headline

**Quote:** “PROVE THE TRANSCRIPT IS CLEAN BEFORE IT LEAVES.”  
**Why:** “clean” implies completeness that the limits section later denies.  
**Rewrite:** “Redact secrets before sharing transcripts.”

### F-1-47 — The first hero sentence stacks unexplained detector jargon

**Quote:** “Redact credentials, policy patterns, and high-entropy tokens locally.”  
**Rewrite:** “Remove common credentials and values that match your rules on your device.”

### F-1-48 — “Useful diagnostics” is subjective

**Quote:** “Keep the useful diagnostics.”  
**Rewrite:** “Keep lines that do not contain a detected value.”

### F-1-49 — “Evidence—not secrets” is abstract

**Quote:** “Export a receipt that contains evidence—not secrets.”  
**Rewrite:** “Save a receipt that lists detector names and locations without matched values.”

### F-1-50 — “Deterministic” is unexplained first-screen jargon

**Location:** hero fact strip.  
**Rewrite:** “The same input and rules produce the same output,” after adding F-1-16’s test.

### F-1-51 — “CI exit codes” is not one of the required plain first-screen facts

**Location:** hero fact strip.  
**Rewrite:** move it to CLI documentation as “Exit codes let CI block a transcript when a match is found.” Use privacy/offline/price as the three first-screen facts.

### F-1-52 — The hero caption is a mood slogan

**Quote:** “BOUNDARY 01 — UNSAFE IN, PROOF OUT.”  
**Rewrite:** “A transcript enters; a redacted copy and receipt leave.”

### F-1-53 — The workbench eyebrow uses slash-label jargon

**Quote:** “LOCAL WORKBENCH / NO NETWORK.”  
**Rewrite:** “Redact a transcript in your browser.”

### F-1-54 — The demo description is implementation jargon

**Quote:** “The demo uses a compact browser edition of the deterministic detector.”  
**Rewrite:** “This browser demo removes common credentials and one custom pattern.”

### F-1-55 — “Full policy control” is vague and absolute

**Quote:** “For automation and full policy control, use the Rust CLI.”  
**Rewrite:** “Use the Rust CLI to scan files, read stdin, and load custom patterns.”

### F-1-56 — “Advisory pattern” does not explain the field

**Location:** workbench label.  
**Rewrite:** “Custom value pattern (Rust regex).” Add help text and an example.

### F-1-57 — The empty state uses product metaphor and a safety adjective

**Quote:** “Run the check to align the gate and produce a share-safe receipt.”  
**Rewrite:** “Redact the sample to see removed values, a redacted transcript, and a receipt.”

### F-1-58 — The install heading is a metaphor

**Quote:** “PUT THE GATE ON THE BOUNDARY.”  
**Rewrite:** “Install the Rust CLI.”

### F-1-59 — “Apply policy” is an out-of-context heading

**Location:** workflow step 2.  
**Rewrite:** “Choose detection rules.”

### F-1-60 — “Export proof” is an out-of-context heading

**Location:** workflow step 3.  
**Rewrite:** “Save the redacted transcript and receipt.”

### F-1-61 — The Team Kit heading is brand lore

**Quote:** “TURN LOCAL RULES INTO A TEAM RITUAL.”  
**Rewrite:** “Reuse redaction rules across your team.”

### F-1-62 — The paid-tier explanation stacks inconsistent technical terms

**Quote:** “Unlock the browser policy composer for building and downloading repeatable JSON rule files. The CLI, safety detectors, receipts, and core export remain free.”  
**Rewrite:** “Team Kit lets you create and download custom-pattern files in the browser. The CLI, built-in detection, redacted transcript, and receipt stay free.”

### F-1-63 — “Have a license?” is not a result-naming button

**Location:** Team Kit action.  
**Rewrite:** “Enter license token.”

### F-1-64 — The checkout line assumes payment vocabulary

**Quote:** “Secure checkout by Sociobot/Dodo, merchant of record. Refunds revoke the license automatically.”  
**Rewrite:** “Sociobot handles the $39 payment and receipt through Dodo. A refunded license stops working.” Do not show this until F-1-4 is fixed and tested.

### F-1-65 — “Honest boundary” is a mood label

**Location:** limits eyebrow.  
**Rewrite:** delete it; the following “Detection limits” heading is sufficient.

### F-1-66 — “A gate, not a guarantee” is a metaphor heading

**Location:** limits H2.  
**Rewrite:** “Detection limits.”

### F-1-67 — The LLM sentence is defensive jargon

**Quote:** “TRG never claims an LLM can undo an upload.”  
**Rewrite:** “Redaction cannot remove data from a service after you upload it.”

### F-1-68 — The Privacy H1 is a slogan

**Quote:** “Privacy, without fine-print fog.”  
**Rewrite:** “Privacy policy.”

### F-1-69 — The Terms H1 is a slogan

**Quote:** “Use the gate. Keep your judgment.”  
**Rewrite:** “Terms of use.”

### F-1-70 — README introduces “external boundary” before explaining the situation

**Quote:** “An offline Rust CLI and library that removes secrets from terminal or JSONL transcripts before they cross an external boundary.”  
**Rewrite:** “Remove detected secrets from terminal and JSONL transcripts before sharing them.” Follow with a separate sentence naming the CLI and Rust library.

### F-1-71 — README stacks detector jargon

**Quote:** “It covers common credential shapes, assignment-style secrets, private keys, configured patterns, and high-entropy tokens; it cannot promise complete PII detection.”  
**Rewrite:** “It detects common credentials, private keys, custom patterns, and random-looking tokens. It does not detect every kind of personal data.”

### F-1-72 — README has a 29-word sentence

**Quote:** “The CLI refuses to overwrite an existing output unless `--force` is supplied, rejects output paths that resolve to the input, and never places paths or secret values in receipts.”  
**Rewrite:** “The CLI does not replace an existing output unless you pass `--force`. It rejects an output path that points to the input. Receipts contain neither file paths nor matched values.”

### F-1-73 — The same concepts use too many names

**Location:** landing page and README.  
**Examples:** action is “check,” “gate,” “scan,” “inspect,” and “redact”; output is “safe output,” “redacted transcript,” “redacted copy,” and “core export”; receipt is “findings receipt,” “share-safe receipt,” “proof,” and “evidence”; custom detection is “policy,” “rule,” “pattern,” and “regex.”  
**Why it fails:** a first-time visitor must infer whether these are different objects or actions.  
**Concrete fix:** use “redact/redaction” for the action, “redacted transcript” for the output, “receipt” for the audit file, and “custom pattern” for user-supplied detection. Reserve “Rust regex” for the format help text.

## Complete landing-page copy audit

Counts treat hyphenated, dotted, and slash-joined terms as one word; URLs and file paths each count as one. Commands are counted by their space-separated words. UI labels are included because the plain-words contract applies to headings, buttons, labels, errors, and empty states. “Flag” points to the finding that supplies the rewrite. No banned-word-list term appears; the flags are jargon, vague claims, inconsistent terms, slogans, or non-result actions.

| # | Words | Copy | Flag |
| ---: | ---: | --- | --- |
| M1 | 9 | Transcript Redaction Gate — prove it is safe before upload | F-1-11 |
| M2 | 11 | Offline deterministic secret redaction for terminal and agent transcripts, before upload. | F-1-10 |
| 1 | 4 | Skip to main content | — |
| 2 | 2 | TRG / 0.1 | — |
| 3 | 2 | Try locally | F-1-43 |
| 4 | 1 | Install | — |
| 5 | 2 | Team kit | — |
| 6 | 1 | Local-ready | F-1-73 |
| 7 | 5 | PRE-EXPORT PRIVACY BOUNDARY / OFFLINE CLI | F-1-45 |
| 8 | 8 | PROVE THE TRANSCRIPT IS CLEAN BEFORE IT LEAVES. | F-1-11, F-1-46 |
| 9 | 8 | Redact credentials, policy patterns, and high-entropy tokens locally. | F-1-12, F-1-47 |
| 10 | 4 | Keep the useful diagnostics. | F-1-13, F-1-48 |
| 11 | 8 | Export a receipt that contains evidence—not secrets. | F-1-14, F-1-49 |
| 12 | 3 | Run local check | F-1-44 |
| 13 | 3 | Copy install command | — |
| 14 | 2 | ZERO UPLOADS | F-1-15 |
| 15 | 1 | DETERMINISTIC | F-1-16, F-1-50 |
| 16 | 3 | CI EXIT CODES | F-1-17, F-1-51 |
| 17 | 6 | BOUNDARY 01 — UNSAFE IN, PROOF OUT. | F-1-52 |
| 18 | 2 | AWS KEYS | F-1-23 |
| 19 | 2 | GITHUB TOKENS | F-1-23 |
| 20 | 2 | PRIVATE KEYS | F-1-23 |
| 21 | 2 | BEARER AUTH | F-1-23 |
| 22 | 1 | JWTS | F-1-23 |
| 23 | 1 | ENTROPY | F-1-23 |
| 24 | 2 | YOUR REGEX | F-1-23, F-1-73 |
| 25 | 4 | LOCAL WORKBENCH / NO NETWORK | F-1-18, F-1-53 |
| 26 | 6 | INSPECT A TRANSCRIPT IN THIS TAB | F-1-73 |
| 27 | 11 | The demo uses a compact browser edition of the deterministic detector. | F-1-18, F-1-54 |
| 28 | 10 | For automation and full policy control, use the Rust CLI. | F-1-19, F-1-55 |
| 29 | 2 | 01 / INPUT | — |
| 30 | 2 | 112 BYTES | — |
| 31 | 2 | Transcript text | — |
| 32 | 2 | Advisory pattern | F-1-56, F-1-73 |
| 33 | 3 | Run local check | F-1-44 |
| 34 | 6 | Your text never leaves this page. | F-1-20 |
| 35 | 8 | Invalid patterns are reported without changing the input. | F-1-21 |
| 36 | 3 | 02 / SAFE OUTPUT | F-1-73 |
| 37 | 1 | WAITING | — |
| 38 | 2 | Findings receipt | F-1-73 |
| 39 | 12 | Run the check to align the gate and produce a share-safe receipt. | F-1-57, F-1-73 |
| 40 | 5 | 0 sensitive span(s) removed | — |
| 41 | 2 | Redacted transcript | — |
| 42 | 3 | Copy safe output | F-1-73 |
| 43 | 2 | Download receipt | — |
| 44 | 4 | SINGLE BINARY / RUST 1.85+ | F-1-41 |
| 45 | 6 | PUT THE GATE ON THE BOUNDARY | F-1-58 |
| 46 | 2 | Read locally | — |
| 47 | 9 | Terminal text, stdin, and JSONL stay on your machine. | F-1-22 |
| 48 | 2 | Apply policy | F-1-59, F-1-73 |
| 49 | 7 | Known credentials, entropy, and your regular expressions. | F-1-23 |
| 50 | 2 | Export proof | F-1-60, F-1-73 |
| 51 | 9 | A redacted copy plus a path-free, value-free JSON receipt. | F-1-24, F-1-73 |
| 52 | 2 | TEAM KIT | — |
| 53 | 3 | ONE-TIME LICENSE / $39 | F-1-25 |
| 54 | 7 | TURN LOCAL RULES INTO A TEAM RITUAL. | F-1-61 |
| 55 | 13 | Unlock the browser policy composer for building and downloading repeatable JSON rule files. | F-1-25, F-1-62 |
| 56 | 10 | The CLI, safety detectors, receipts, and core export remain free. | F-1-25, F-1-62 |
| 57 | 5 | Buy team kit — $39 once | F-1-4, F-1-25 |
| 58 | 3 | Have a license? | F-1-63 |
| 59 | 7 | Secure checkout by Sociobot/Dodo, merchant of record. | F-1-4, F-1-26, F-1-64 |
| 60 | 5 | Refunds revoke the license automatically. | F-1-26, F-1-64 |
| 61 | 1 | Terms | — |
| 62 | 1 | Privacy | — |
| 63 | 2 | License token | — |
| 64 | 2 | Verify license | — |
| 65 | 2 | LICENSE REQUIRED | — |
| 66 | 2 | Policy composer | F-1-73 |
| 67 | 2 | Pattern name | — |
| 68 | 2 | Rust regex | — |
| 69 | 2 | Download policy.json | — |
| 70 | 2 | HONEST BOUNDARY | F-1-65 |
| 71 | 5 | A GATE, NOT A GUARANTEE. | F-1-66 |
| 72 | 12 | Pattern detection is advisory and cannot identify every form of personal data. | F-1-27 |
| 73 | 16 | Tune it to your environment, review the receipt, and rotate credentials that may already have escaped. | — |
| 74 | 9 | TRG never claims an LLM can undo an upload. | F-1-67 |
| 75 | 3 | Transcript Redaction Gate | — |
| 76 | 3 | Offline by design. | F-1-28 |
| 77 | 2 | MIT-licensed core. | F-1-28, F-1-42 |
| 78 | 2 | No telemetry. | F-1-28 |
| 79 | 1 | Privacy | — |
| 80 | 1 | Terms | — |
| 81 | 1 | Source | — |

### Dynamic landing-page sentences

| Words | Copy | Flag |
| ---: | --- | --- |
| 7 | Add transcript text before running the check. | — |
| 4 | No transcript was checked. | — |
| 5 | No configured sensitive patterns detected. | F-1-16 |
| 4 | [count] sensitive spans removed. | F-1-23 |
| 4 | Safe output is ready. | F-1-73 |
| 4 | No sensitive spans found. | F-1-23 |
| 3 | Output is ready. | — |
| 5 | The check could not run. | F-1-73 |
| 1 | Copied | — |
| 4 | Clipboard access was unavailable. | — |
| 7 | Select the text and copy it manually. | — |
| 4 | Offline · local check works | F-1-28, F-1-73 |
| 8 | Team kit unlocked from your last verified license. | F-1-25 |
| 4 | License no longer active. | F-1-25 |
| 8 | Every core safety feature remains available for free. | F-1-25, F-1-73 |
| 6 | Offline — using the last verified license. | F-1-25 |
| 7 | Offline — connect once to verify this license. | — |
| 2 | Verifying license… | — |
| 2 | License verified. | F-1-25 |
| 5 | Team policy tools are ready. | F-1-25, F-1-73 |
| 8 | Verification is unavailable — using the last verified license. | F-1-25 |
| 5 | Could not verify right now. | — |
| 6 | Check your connection and try again. | — |
| 13 | This browser blocked local license storage; verification will apply only to this tab. | F-1-25 |
| 6 | That advisory pattern is not valid. | F-1-56 |
| 8 | Check its brackets and escapes, then try again. | F-1-56 |

## Complete README sentence audit

Code blocks are excluded because they are executable examples rather than sentences. Headings and exit-code labels are included. The only sentence above 22 words is row 18.

| # | Words | Copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 3 | Transcript Redaction Gate | — |
| 2 | 20 | An offline Rust CLI and library that removes secrets from terminal or JSONL transcripts before they cross an external boundary. | F-1-29, F-1-70 |
| 3 | 20 | It emits a redacted copy and a non-sensitive receipt containing detector names, locations, and match lengths—never the matched values. | F-1-30 |
| 4 | 16 | Use it before pasting logs into a model, attaching a support bundle, or publishing CI artifacts. | — |
| 5 | 5 | Detection is deterministic and local. | F-1-31 |
| 6 | 20 | It covers common credential shapes, assignment-style secrets, private keys, configured patterns, and high-entropy tokens; it cannot promise complete PII detection. | F-1-32, F-1-71 |
| 7 | 3 | Live documentation: https://transcript-redaction-gate.sociobot.in | — |
| 8 | 1 | Install | — |
| 9 | 7 | Build the single binary with stable Rust: | F-1-41 |
| 10 | 2 | CLI usage | — |
| 11 | 11 | Redact a terminal transcript and write a safe copy plus receipt: | F-1-73 |
| 12 | 7 | Gate an existing file without creating output. | F-1-73 |
| 13 | 7 | Exit code 2 means findings were detected: | F-1-38 |
| 14 | 15 | Read stdin and write the redacted body to stdout (the human summary goes to stderr): | — |
| 15 | 7 | Add project-specific detectors with a JSON policy. | F-1-73 |
| 16 | 15 | Patterns use Rust regex syntax and must match only the value that should be removed: | — |
| 17 | 4 | Inputs are never modified. | F-1-33 |
| 18 | 29 | The CLI refuses to overwrite an existing output unless `--force` is supplied, rejects output paths that resolve to the input, and never places paths or secret values in receipts. | F-1-34, F-1-72 |
| 19 | 9 | Run `trg --help` for all options and exit codes. | — |
| 20 | 2 | Library usage | — |
| 21 | 7 | The public Rust surface is deliberately small: | — |
| 22 | 4 | Develop, test, and package | — |
| 23 | 6 | Requirements: stable Rust and Node.js 20+. | F-1-41 |
| 24 | 16 | `npm run build` produces the deployable static site at `dist/site/` and the release CLI at `dist/bin/trg`. | F-1-35 |
| 25 | 11 | No network, model, telemetry, or external service is used while scanning. | F-1-36 |
| 26 | 8 | The landing-page demo runs entirely in the browser. | F-1-2, F-1-37 |
| 27 | 2 | Exit codes | — |
| 28 | 9 | 0: completed successfully (including a redaction that removed findings) | F-1-38 |
| 29 | 7 | 1: usage, policy, input, or output error | F-1-38 |
| 30 | 9 | 2: `check` found sensitive content and blocked the gate | F-1-38, F-1-73 |
| 31 | 3 | Privacy and limits | — |
| 32 | 6 | Transcript contents stay on the device. | F-1-39 |
| 33 | 20 | The optional one-time license verifier sends only the pasted license token to Sociobot; see the site’s privacy and terms pages. | F-1-40 |
| 34 | 3 | Patterns are advisory. | F-1-27 |
| 35 | 17 | Review policy coverage for your environment and rotate any credential that may already have crossed a boundary. | — |
| 36 | 2 | MIT licensed. | F-1-42 |
| 37 | 2 | See CHANGELOG.md. | — |

## Demo, privacy, and sandbox evidence

- The hero action did not produce a result on its first screen; the badge remained “Waiting.”
- Running the prefilled workbench produced two findings and removed the synthetic bearer token and customer value.
- That workbench flow wrote no localStorage entry and requested only `https://transcript-redaction-gate.sociobot.in`.
- After the service worker installed, a live offline reload succeeded and the workbench still redacted the sample.
- These observations support implementation quality but do not create a demo mode. There is no banner, namespace, reset, real-data separation contract, direct demo state, or CLI demo command to verify.
- No AI request occurs. No AI feature is warranted: deterministic, offline secret detection is the product’s core safety property, and a model call would weaken that boundary. File import/export is already provided by the CLI; the missed leverage is the required CLI/browser demo path in F-1-2, not an AI or sync feature.

## Structure, accessibility, and link evidence

- Required basics pass on `/`, `/privacy/`, and `/terms/`: HTTPS 200, `lang="en"`, one H1, one main landmark, image alt text, labelled buttons, and no console/page errors.
- Axe 4.10.2 found zero WCAG 2 A/AA violations at 390×844 and 1440×900 on all three routes.
- The skip link and visible focus styles work. Touch targets covered by the suite pass.
- The visual system is recognizably product-specific: off-black proof bench, paper stock, cyan/red registration marks, halftone press art, square controls, and restrained proof-sheet motion match `.factory/design.md`. It does not look like a generic SaaS template.
- The homepage title follows the required “Product — what it does” pattern and legal route titles follow “Route — Product.” F-1-6 covers missing metadata and the nonexistent demo title.
- Link crawl: home/hash targets, Privacy, Terms, and GitHub Source returned 200. The Team Kit checkout returned 404 (F-1-4).

## Claims and quality-gate execution

There were no listed claim commands to run because `.factory/claims.json` does not exist. This is not a pass; it is F-1-3.

From a clean local clone of candidate `4b73957d`:

- `npm ci`: PASS, 61 packages, zero reported vulnerabilities.
- `npm test`: PASS — TypeScript; 11 Rust tests; one Rust doctest; six Vitest tests; 12 Playwright tests.
- `npm run build`: PASS — `dist/site/` and `dist/bin/trg` produced.
- Initial JavaScript: 7.51 kB raw / 3.36 kB gzip.
- `trg demo` in a fresh temporary directory: FAIL as a demo entry, exit 2, unrecognized subcommand, no files created.
- Factory `verify-url.sh`: PASS for its basic live checks, 563 ms measured load, zero console errors.

## History verification

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists.

The prior handoff’s earlier technical repair items were rechecked rather than trusted:

- TypeScript now passes.
- The former mobile axe and undersized-target defects remain fixed.
- The worker uses a build-specific cache and the offline reload works.
- CSP, frame protection, Permissions-Policy, HSTS, referrer policy, and nosniff are present live.
- General tests and the production build pass.

The handoff’s known checkout-registration follow-up is not fixed: the live buy link is HTTP 404, now blocking F-1-4. Registry publication and non-Linux binaries remain release work, not first-visit defects.

## What would make this perfect

Resolve every finding above, then repeat this entire review from a fresh context rather than checking only the diff. The target state is one plain first screen that names the user and action; a direct, isolated, resettable demo whose result is already visible; a bundled CLI demo; a complete and passing claims registry; a working checkout; real 404 behavior; complete metadata and route focus; one responsive site skeleton; and zero copy flags. Until all of those are true, the verdict remains FAIL.
