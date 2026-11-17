# Z-Index Sleuth

Find the invisible element blocking a button. Repair its CSS source. Make Kane verify the same interaction again.

## What is working

A real controlled fixture has been tested end to end:

1. Kane failed to activate a visible Generate Report button (exit 1).
2. Five DOM hit tests showed an inactive, transparent `.loading-overlay` receiving the clicks.
3. Gemini received the actual Kane result, DOM evidence and CSS source through a web-assisted re-prompt.
4. Gemini returned a real source correction. The inactive overlay passes pointer events through; the active loading state still blocks them.
5. Kane ran the exact same objective and passed (exit 0). A supplementary browser check confirmed the active-overlay behavior was preserved.

The recorded run used about 27.8 Kane credits in total. No paid model API was used.

**This demonstrated loop was web-assisted, not an autonomous Gemini CLI run.** The static website is an interactive recorded-evidence viewer, not a remote repair service. Its Original and Repaired modes run real copies of the CSS in a separate reproduction iframe. The displayed DOM coordinates are from the captured 1280 x 800 probe, not a fresh measurement of your current viewport.

## Run locally

Tested on Linux, Node 22 and Google Chrome. Git is needed for source diffs.

```sh
npm ci
npm test
npm start
```

Open the localhost address printed by the server. The runner binds to loopback only.

Before **Run Full Repair** can execute the automatic path:

```sh
npx kane-cli login --oauth
npx kane-cli whoami
npx gemini
```

Sign into your own free Gemini Code Assist account in the Gemini CLI, and your own TestMu account with available Kane credits. Complete Gemini's first-run setup in the terminal. Do not put credentials into project files. The application passes no paid API keys or Vertex credentials to Gemini and has no paid-model fallback.

**Automatic Gemini CLI repair has not yet been end-to-end validated in this build environment because an agent-owned free Google login is unavailable.** Missing authentication stops the run without applying a hardcoded patch. It must not be represented as demonstrated one-click automation.

Each local run restores the intentionally broken fixture from `baseline/fixture.css`, then runs the acceptance flow. This project currently supports that one fixture and one failure category, not arbitrary websites. The reset and run endpoints are locked during active runs and disabled in read-only mode.

To view only the recorded run locally:

```sh
READ_ONLY=1 npm start
```

## Acceptance objective

The same bytes are read from `objective.txt` before and after source repair. The UI shows their SHA-256 hash. The objective requires a normal pointer click and visible report output. Keyboard activation, force clicks, JavaScript clicks, DOM edits and overlay removal are forbidden.

Kane success requires **exit 0 AND exactly one supported `run_end` event with status `passed`**. An empty stream, unsupported schema, setup error, timeout, contradictory status or missing completion event cannot become a pass. A failed run does not by itself prove a product defect: DOM evidence establishes the obstruction here.

Kane's initial prose incorrectly called the invisible overlay an automation false positive. The raw report is preserved as evidence, but that root-cause interpretation is not endorsed. The DOM hit tests independently establish the blocker.

## Architecture

```text
Local Node runner
  -> Kane CLI baseline (independent acceptance)
  -> Playwright DOM probe (five points and stacking ancestors)
  -> Gemini CLI proposal (source + actual failure + diagnostics)
  -> CSS AST guard (only overlay-rule changes allowed)
  -> browser regression guard (normal click + active overlay)
  -> Kane CLI unchanged-objective retest
  -> local run artifacts

Static evidence viewer
  -> sanitized recorded JSON + screenshots + source diff
  -> interactive Original/Repaired CSS reproduction
```

Gemini CLI receives an isolated temporary workspace and a deny-all-tools policy. It proposes CSS as JSON. The parent process validates the proposal and writes only the fixed fixture CSS. There is no deterministic repair fallback. Only `.loading-overlay` rules and its `aria-hidden` variants may change. Changes outside those rules, malformed CSS and external resources are rejected. The objective, HTML, diagnostics and acceptance code are not handed over for editing.

## Evidence and tests

- `public/evidence/recorded-run.json`: sanitized actual run results, objective hash, DOM probes, diff and limitations.
- `public/evidence/original.css` and `repaired.css`: source states used in the reproduction.
- `data/`: local/private run artifacts, excluded from Git.
- `npm test`: parser fail-closed cases, CSS scope/validation, response parsing and local server restrictions.
- `npm run preview:test`: real Chromium viewport checks and interactive reproduction checks.

The preserved Kane evidence packages contain original screenshots and logs, but are not automatically published. Review their contents before sharing them.

## Scope and originality

This is a controlled overlay-repair proof, not a universal CSS debugger. Click-blocker detection already exists in tools such as css-lab-mcp. The focus here is the explicit failure-to-source-repair-to-independent-retest loop, including evidence of what the verifier got wrong.

## Build provenance

Gemini generated the first implementation and frontend direction with the public Taste skill supplied. That code was reviewed and hardened: a deterministic fallback repair, permissive success parser, UI state mismatches and an iframe layout bug were removed. The demonstrated CSS repair was also generated by Gemini from the actual failure evidence. The interface adapts Taste's hierarchy, typography, restrained color, real product UI and browser-verification guidance to an application workspace rather than a marketing page. No claim is made that a landing-page-only design gate passed.

## Dependency note

The installed upstream Kane CLI dependency tree currently reports npm audit findings, including high-severity transitive advisories. See [the dependency security review](DEPENDENCY-SECURITY.md) for the actual affected paths and why the suggested forced downgrade was not applied. This source is a bounded prototype, not production-security-ready. The runner is local-only, accepts no arbitrary targets or uploaded evidence, and is not deployed as a public execution service. The static viewer has no runtime npm dependencies. Do not expose the local runner to the internet or extend it to untrusted targets, evidence packs, PDFs or images without fixing and testing those paths.

## Hackathon status

Built in a new repository initialized on 17 November 2026. Public posts, demo video and final submission require separate review and are not implied by this README. See `resources.md` for official rules and tool documentation.
