# Polish round 1 — finding closure

Candidate repaired from `4b73957dfb3e92b9bfe6982f796425b74c94d378` in repair commit `11d9eb49d3182f21bee398d4b8b7bafa82997aa6`. Evidence is local until the post-push production check: `.factory/evidence/local-demo/screenshot-desktop.png`, `.factory/evidence/local-demo/screenshot-mobile.png`, and `.factory/evidence/local-demo/verify.json`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Rewrote the first screen with the requested user, job, one primary demo action, and three plain facts. | Playwright: “home has one clear demo action”; mobile screenshot. |
| F-1-2 | Added direct `/demo/`, `?demo=1` redirect, persistent banner, reset/start-real controls, bundled sample, `trg demo`, examples, and demo docs. | @claim browser/demo-reset/cli-demo/offline-demo; screenshots. |
| F-1-3 | Added claims registry and one tagged executable test for each retained public claim. | Every command in `.factory/claims.json` passed. |
| F-1-4 | Removed the unregistered $39 purchase UI and all checkout/refund claims. | Link crawl in Playwright has no checkout link. |
| F-1-5 | Added designed `404.html` and Static Web Apps response override. | “404 override is configured” test. |
| F-1-6 | Added canonical, Open Graph, Twitter, favicon, apple-touch icon, and original derived 1200×630 share art on every real route. | Route metadata Playwright test. |
| F-1-7 | Unified desktop/mobile headers and footers across home, demo, legal, and 404 routes. | Mobile menu Playwright test; local screenshots. |
| F-1-8 | Added destination-H1 focus and polite route announcement on each route. | “route navigation moves focus” Playwright test. |
| F-1-9 | Added `/demo/` to sitemap. | `site/public/sitemap.xml`; build output. |
| F-1-10 | Replaced the broad meta promise with plain redaction description. | Metadata test. |
| F-1-11 | Removed “prove clean” completeness claim. | Copy audit. |
| F-1-12 | Narrowed detector copy to detected credentials and custom patterns. | Browser sample and detector tests. |
| F-1-13 | Replaced subjective diagnostic claim with explicit diagnostic-line behavior. | Browser sample result. |
| F-1-14 | Retained receipt claim with a no-values test. | @claim:receipt-no-values. |
| F-1-15 | Replaced “zero uploads” with scoped browser-demo privacy copy. | @claim:browser-demo-local. |
| F-1-16 | Retained deterministic claim and added test. | @claim:deterministic-output. |
| F-1-17 | Moved CI exit-code detail to README. | Cargo CLI tests. |
| F-1-18 | Replaced workbench jargon with scoped browser-demo privacy copy. | @claim:browser-demo-local. |
| F-1-19 | Replaced “full policy control” with concrete CLI capabilities. | README and CLI tests. |
| F-1-20 | Replaced absolute page copy with scoped browser-demo privacy copy. | @claim:browser-demo-local. |
| F-1-21 | Kept invalid-pattern behavior with input untouched in the demo. | Redactor unit test and visible error path. |
| F-1-22 | Rewrote local-input copy around CLI inputs. | README and CLI tests. |
| F-1-23 | Replaced untested detector-strip inventory with tested sample and documented built-in/custom rules. | Redactor and Rust corpus tests. |
| F-1-24 | Retained receipt privacy in precise copy. | @claim:receipt-no-values and Rust receipt tests. |
| F-1-25 | Removed the unavailable Team Kit, price, license, and paywall claims. | No checkout or licensing UI remains. |
| F-1-26 | Removed unavailable checkout/refund claims. | No checkout or licensing UI remains. |
| F-1-27 | Kept plain limitation statement without overstating detection. | Home/demo limits sections. |
| F-1-28 | Replaced footer claims with product one-liner. | Unified footer test/screenshots. |
| F-1-29 | Rewrote README opening in user language. | README and copy audit. |
| F-1-30 | Retained safe receipt description with claim test. | @claim:receipt-no-values. |
| F-1-31 | Retained repeatability claim with claim test. | @claim:deterministic-output. |
| F-1-32 | Rewrote detector coverage/limit text in two plain sentences. | README. |
| F-1-33 | Retained input immutability as CLI behavior. | Rust CLI tests. |
| F-1-34 | Split overwrite/collision/receipt behavior into short README sentences. | Rust CLI and receipt tests. |
| F-1-35 | Kept build output documentation and verified build. | `npm run build`. |
| F-1-36 | Retained scanning privacy copy and verified browser local flow. | @claim:browser-demo-local; Rust CLI tests. |
| F-1-37 | Replaced vague landing demo with direct isolated demo. | @claim:browser-demo-local. |
| F-1-38 | Kept concise exit-code documentation. | Rust CLI tests. |
| F-1-39 | Replaced broad device promise with scoped browser-demo privacy copy. | @claim:browser-demo-local. |
| F-1-40 | Removed license verifier claim with paid UI. | No billing code or copy remains. |
| F-1-41 | Retained stated toolchain minimums. | Cargo manifest and README. |
| F-1-42 | Retained MIT claim with a tagged test. | @claim:mit-license. |
| F-1-43 | Replaced “Try locally” with “Try it with sample data.” | Home screenshot. |
| F-1-44 | Replaced “Run local check” with “Redact transcript.” | Demo screenshot. |
| F-1-45 | Replaced hero jargon with “Offline transcript redaction.” | Home HTML/copy audit. |
| F-1-46 | Replaced unprovable safety headline. | Home H1 and test. |
| F-1-47 | Rewrote detector jargon in user language. | Home lede. |
| F-1-48 | Removed subjective “useful diagnostics.” | Home lede. |
| F-1-49 | Rewrote receipt description with named fields. | Home sample section. |
| F-1-50 | Moved deterministic wording to documentation. | README/@claim deterministic. |
| F-1-51 | Moved CI detail to README. | README. |
| F-1-52 | Rewrote hero caption literally. | Home figure caption. |
| F-1-53 | Rewrote workbench label as “Browser demo.” | Demo screenshot. |
| F-1-54 | Replaced implementation jargon with direct demo description. | Demo page. |
| F-1-55 | Replaced “full policy control” with concrete CLI actions. | Install section. |
| F-1-56 | Renamed and explained custom pattern field. | Demo screenshot; input label/help. |
| F-1-57 | Removed metaphorical empty-state flow; demo arrives populated. | Direct demo test. |
| F-1-58 | Rewrote install heading. | Home install section. |
| F-1-59 | Rewrote workflow step as “Choose detection rules.” | Home workflow. |
| F-1-60 | Rewrote workflow step as “Save the results.” | Home workflow. |
| F-1-61 | Removed Team Kit lore with unavailable paid product. | No Team Kit section. |
| F-1-62 | Removed paid-tier technical copy. | No Team Kit section. |
| F-1-63 | Removed license action. | No licensing UI. |
| F-1-64 | Removed checkout vocabulary and claims. | No paid UI. |
| F-1-65 | Removed mood eyebrow. | Limits section. |
| F-1-66 | Renamed heading “Detection limits.” | Home/demo limits. |
| F-1-67 | Rewrote upload limitation plainly. | Home limits. |
| F-1-68 | Renamed legal H1 “Privacy policy.” | Privacy route test. |
| F-1-69 | Renamed legal H1 “Terms of use.” | Terms route metadata test. |
| F-1-70 | Rewrote README opening in plain language. | README. |
| F-1-71 | Rewrote README detector/limit sentence. | README. |
| F-1-72 | Split long README CLI sentence. | README/copy audit. |
| F-1-73 | Standardized action/output/receipt/custom-pattern terminology. | Copy audit terminology table. |

## Verification

- `npm test`: pass — TypeScript, 12 Rust tests plus doctest, 9 Vitest tests, 10 Playwright tests.
- `npm run lint`: pass.
- `npm run build`: pass — `dist/site/` and `dist/bin/trg`.
- Each command in `.factory/claims.json`: pass.
- Local `verify-url.sh` on `http://127.0.0.1:4173/demo/`: 200, 549 ms, no console errors, title/lang/one H1/main/alt/buttons passed.
- Playwright Axe WCAG A/AA on mobile demo: no serious/critical violations. The standalone axe CLI could not find a system Chrome binary; the repository uses Playwright’s installed Chromium through `@axe-core/playwright`.
