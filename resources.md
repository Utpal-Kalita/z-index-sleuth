# Resources and provenance

## Project

- Live viewer: https://z-index-sleuth.pages.dev/
- Product brief: https://chatgpt.com/s/t_6afc4723f0e08191bdc0018487ccb880
- Event: https://www.kaneclihack.sh/

## Tools used

- Kane CLI agent mode: https://www.testmuai.com/docs/kane-cli-agent-mode
- Kane quickstart: https://www.testmuai.com/docs/kane-cli-quickstart
- Kane modes: https://www.testmuai.com/docs/kane-cli-modes
- Kane CLI reference: https://www.testmuai.com/docs/kane-cli-cli-reference
- Gemini CLI policies: https://geminicli.com/docs/reference/policy-engine/
- Public Taste skill: https://github.com/Leonxlnx/taste-skill/
- Static hosting limits: https://developers.cloudflare.com/pages/platform/limits/

Kane CLI 0.10.5, Gemini CLI 0.68.0 and Playwright 1.65.1 were installed during the build. The lockfile records the dependency tree. Gemini web generated the implementation and CSS repair. Taste was supplied to Gemini for frontend design. Code was reviewed and real tests were run separately. Anonymous Gemini web and free static hosting were used; no paid model API was used.

## Evidence

The sanitized record at `public/evidence/recorded-run.json` contains observed Kane report URLs, completion events, five-point DOM probes, source diff and limitations. Before and after screenshots are in the same directory. The baseline's prose interpretation was wrong; measured DOM evidence supplies the actual root cause. See README for the distinction between demonstrated web-assisted repair and the unvalidated automatic CLI repair path.

Private CLI session metadata and raw evidence packages are intentionally excluded from this source repository. No credentials or personal account details are needed to inspect the static viewer.
