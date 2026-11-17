# Z-Index Sleuth

Find the invisible layer blocking a button. Repair its CSS. Test the same click again with Kane CLI.

[Try the live example](https://z-index-sleuth.pages.dev/) · [View the source](https://github.com/Utpal-Kalita/z-index-sleuth)

## The problem

A button can look clickable while a transparent element above it catches every click. In this example, an inactive loading overlay blocks **Generate Report**.

Z-Index Sleuth brings the failure, DOM evidence, source repair and independent retest together so you can see why the click failed and whether the repair held up.

## What the demo proves

The recorded example follows one real repair:

1. **Fail:** Kane CLI cannot complete the normal-click objective.
2. **Diagnose:** Five DOM hit tests identify the transparent loading overlay intercepting the click.
3. **Repair:** Gemini receives the actual failure, DOM evidence and CSS through a web-assisted re-prompt and proposes a source correction.
4. **Retest:** Kane CLI passes the unchanged objective after the repair.
5. **Check for regression:** An independent browser check confirms that active loading still blocks clicks.

The change lets the inactive overlay pass pointer events through while keeping the active loading state interactive. The objective does not allow force clicks, keyboard activation, JavaScript clicks, DOM edits or removing the overlay.

**This is a demonstrated web-assisted repair, not a verified autonomous Gemini CLI run.** It covers one controlled fixture and one failure category, not arbitrary websites.

## Try it

The [live example](https://z-index-sleuth.pages.dev/) needs no login:

- Try the blocked button.
- Reveal the invisible layer.
- Try the repaired version.
- Inspect the recorded results and CSS change.

The hosted app is an interactive reproduction and recorded-evidence viewer. It does not run repair jobs on a remote server. DOM coordinates shown in the evidence come from the recorded 1280 × 800 probe, not your current browser window.

## Run the recorded viewer locally

Tested with Linux and Node.js 22. Git is needed by the repair runner for source diffs.

```sh
git clone https://github.com/Utpal-Kalita/z-index-sleuth.git
cd z-index-sleuth
npm ci
npm test
npm run preview
```

Open the local address printed in the terminal. Preview mode serves the recorded example without enabling repair or reset endpoints.

## Local repair prototype

The repository also contains a local repair runner. It is separate from the working recorded example and is **not a verified one-click workflow**.

Its intended flow is:

```text
Kane baseline → DOM diagnosis → Gemini CSS proposal
             → CSS checks → browser checks → unchanged Kane retest
```

The runner binds to loopback and supports only the bundled fixture. It restores the broken baseline at the start of each run and rejects overlapping reset or run requests.

### Authentication status

The published runner was built around Gemini CLI's former individual Code Assist sign-in. That authentication path has since been retired. The older instruction to sign into a free individual account is not a working setup route for this version.

See Google's [Code Assist individuals deprecation notice](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals). A supported replacement authentication path and a complete authenticated repair run still need validation. No paid-model fallback is configured. Do not assume that launching the server makes automatic repair available.

Kane execution also requires your own TestMu account and available credits. Never add credentials or raw private run artifacts to the repository.

## How verification works

`objective.txt` supplies the same objective bytes before and after repair. Their SHA-256 hash is recorded with the evidence.

A Kane pass requires both:

- Process exit code `0`.
- Exactly one supported `run_end` event with status `passed`.

Missing, unsupported or contradictory completion data, setup errors and timeouts do not count as passes. A failed automation run alone does not establish a product defect. In the recorded example, DOM hit testing independently establishes the obstruction. Kane's initial prose called it an automation false positive; that interpretation is not treated as the root cause.

The proposed repair is also checked before acceptance:

- Only `.loading-overlay` rules and their `aria-hidden` variants may change.
- CSS must parse and must not introduce external resources.
- A normal click must work after repair.
- Active loading must still block clicks.

The model proposes CSS as JSON in an isolated workspace with tool use denied. The runner validates the proposal and writes the permitted CSS. There is no hardcoded repair fallback.

## Evidence and tests

| Path or command | Contents |
| --- | --- |
| `public/evidence/recorded-run.json` | Sanitized results, objective hash, DOM probes, source diff and limitations |
| `public/evidence/original.css` | Original blocked-click CSS |
| `public/evidence/repaired.css` | Repaired CSS used by the example |
| `public/evidence/before.png`, `after.png` | Recorded screenshots |
| `objective.txt` | Unchanged acceptance objective |
| `npm test` | Result parsing, CSS validation, response parsing and server restriction tests |
| `npm run preview:test` | Chromium layout and interactive reproduction checks |

Private local artifacts under `data/` are excluded from Git. Review and sanitize any new evidence before publishing it.

## Scope and safety

This is a focused prototype, not a universal CSS debugger or a production execution service. Click-blocker detection exists in other tools; this project's focus is making the failure-to-repair-to-independent-retest chain inspectable.

The local runner has known upstream dependency advisories, including high-severity transitive findings. Read [DEPENDENCY-SECURITY.md](DEPENDENCY-SECURITY.md) before running it. The static viewer has no runtime npm dependencies. Do not expose the runner to the internet or extend it to untrusted targets and evidence without fixing and testing those paths.

## Built with

- **Gemini:** implementation, design work and the demonstrated source repair, followed by review and corrections.
- **Kane CLI:** before-and-after acceptance checks against the same objective.
- **Playwright:** independent DOM probes, regression checks and viewer checks.
- **Node.js and css-tree:** local execution and scoped CSS validation.

Built for the Kane CLI Hackathon in November 2026. See [resources.md](resources.md) for event and tool links.
