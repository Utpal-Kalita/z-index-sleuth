# Z-Index Sleuth: build scope

## Problem

A visible button can be unclickable when a transparent inactive overlay receives pointer events. A test failure alone cannot tell us whether this is a product defect or an automation issue.

## Intended loop

1. Run a normal-pointer-click acceptance objective with Kane.
2. On a supported failed interaction, collect DOM hit tests and computed stacking properties.
3. Give Gemini the actual failure, source CSS and diagnostics.
4. Apply a restricted CSS source proposal, not a runtime DOM workaround.
5. Check normal clicking and the active loading overlay's regression behavior.
6. Ask Kane to run the unchanged objective again.
7. Keep before/after evidence and a source diff.

## Acceptance

- A broken baseline fails the actual Kane objective.
- Independent DOM measurements identify the element intercepting target points.
- Only overlay source rules can change.
- The active loading overlay must still block interaction.
- Objective bytes, HTML and assertions remain unchanged.
- Success requires exit 0 and exactly one supported passed Kane completion event.
- Setup errors, missing auth, timeouts and malformed proposals do not become success.

## Delivered slice

One controlled same-origin overlay fixture. An interactive static evidence viewer shows the demonstrated real failure, web-assisted Gemini source repair and unchanged Kane pass. A local loopback-only runner implements the automatic CLI path, with missing authentication handled as failure. That automatic path has not been validated end to end with an authenticated Gemini CLI in the build environment.

## Explicit non-goals

Arbitrary URLs, arbitrary CSS debugging, cross-origin iframe repair, general stacking-context solving, production remote execution and unreviewed model changes to tests or application logic.

The original product brief is linked in `resources.md`. This document describes the bounded implementation and does not imply every aspiration in that brief is complete.
