# Visual thesis — The inspected proof sheet

Transcript Redaction Gate looks like a security review pulled fresh from a small-run print shop: an off-black inspection bench, warm uncoated paper, registration-red marks, and cyan proof stamps. The dither is not decoration. It turns dangerous transcript fragments into visibly screened material, while crisp redaction bars and receipt marks communicate deterministic handling.

## Palette

The product is explicitly dark-mode: a controlled inspection room that keeps the transcript and its proof as the brightest objects.

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#12110f` | page background |
| Press | `#1d1b18` | raised surfaces |
| Paper | `#f3ead7` | primary text and proof sheets |
| Newsprint | `#c9bea8` | muted text |
| Cyan proof | `#46d8cf` | actions, focus, verified state |
| Registration red | `#ff675d` | findings and caution |
| Amber stock | `#eebf65` | advisory state |
| Deep cyan | `#123c3a` | accent contrast |

Paper on ink is above 12:1; newsprint on ink is above 8:1; cyan on ink is above 9:1. Status always includes a word or icon, never color alone.

## Typography and spacing

- Headlines: `Arial Black`, `Arial Narrow`, system sans-serif. The condensed, blunt forms recall specimen labels without downloading a font.
- Body and UI: `ui-monospace`, `SFMono-Regular`, `Cascadia Code`, `Liberation Mono`, monospace. Transcripts, flags, and findings share one technical rhythm.
- Type steps: 14, 16, 18, 24, 40, and fluid 64px display. Body is never below 16px.
- Spacing follows an 8px base with 4px optical corrections. Main measures top out at 1200px; prose at 72 characters.
- Corners are 2–4px, like cut stock rather than soft app cards. Heavy 1px rules and offset shadows suggest stacked proofs.

## Interaction grammar

Actions are labeled like press controls: `RUN LOCAL CHECK`, `COPY COMMAND`, `VERIFY LICENSE`. A cyan registration square shifts into alignment on hover or focus. Findings use numbered proof marks. The live demo is a workbench, not a simulated terminal: input sits left and a non-sensitive receipt sits right; on phones these stack in reading order.

Keyboard focus uses a 3px cyan outer keyline with an ink gap. Touch targets are at least 44px. Copy and license verification announce their result in live regions. Offline state is a normal, useful condition: the local demo continues, while license verification reports that the cached state remains in use.

## Motion policy

Only physical, causal motion is used: the proof sheet rises 8px on first reveal, the registration square aligns by 3px, and disclosure panels open without spring effects. Durations are 160–240ms using transforms and opacity. Nothing loops. With `prefers-reduced-motion: reduce`, movement is removed and all state changes are instantaneous.

## Asset plan and provenance

- `site/public/proof-press.webp`: original wide hero illustration generated for this product with the factory image generator, then converted locally to WebP. Prompt: “editorial halftone screen-print illustration of a transcript passing through a mechanical privacy gate, secret-like glyphs entering and solid redaction bars plus a stamped receipt leaving; off-black, warm paper, cyan and registration red spot inks; coarse authentic Ben-Day dots, sharp flat shapes, no gradients, no logos, no words, ample dark negative space; wide landing-page composition.” Generator: `/opt/fleet/lib/gen-image.sh` (`factory-image` deployment). License: original project asset.
- All other marks (registration square, receipt seal, CLI window) are original CSS/HTML geometry; no stock icons or external imagery.

The hero asset explains the product boundary—the moment a risky transcript becomes an exportable proof—rather than serving as atmospheric filler.
