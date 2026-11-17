# Dependency security review

Reviewed 17 November 2026 with Node22 and Kane CLI0.10.5. This is a bounded local prototype, not a production-hardened runner. Do not expose it or use untrusted targets, PDFs, images or evidence packs.

## Findings and reachability

The lockfile audit reports ten affected package nodes, five high and five moderate, all through Kane's dependency tree. Counts include parent packages and are not ten independent exploits.

| Dependency | Relevant behavior | This project's exposure |
| --- | --- | --- |
| adm-zip through evidence-cli | Evidence ZIP opening, entry lookup and decompression. Crafted archives can exhaust memory; extraction advisories also exist. | The runner does not import evidence packs or expose an upload endpoint. Reading unknown packs with upstream tools is outside this safety boundary. |
| pdfjs-dist6.1.200 | Kane's PDF attachment conversion dynamically loads PDF.js. Its code sets isEvalSupported=false, but this review does not claim full remediation. | No PDF attachments in the fixed fixture or objective. Do not extend to untrusted PDFs without updating and testing. |
| sharp | Attachment image conversion uses native image libraries with upstream advisories. | No user images or attachment conversion in the fixture. Not a basis to trust arbitrary images. |
| glob/minimatch through archiver | Filesystem traversal and pattern-matching denial-of-service advisories. | No user-selected filesystem paths or glob patterns. Archive creation still belongs to the upstream runtime and is not proven free of risk. |

## Remediation considered

A nonbreaking `npm audit fix --ignore-scripts` did not clear the findings. Current Kane remains0.10.5. The audit's force suggestion installs Kane0.6.6, an older incompatible release, so it was not applied.

Patched package ranges reported by the registry/advisories include adm-zip0.6.1, PDF.js6.2.108+, Sharp0.35.5 and Glob14.0.2+. These are outside the installed parents' constraints or pins. Blind overrides are not a validated fix. Some archive code is bundled inside Kane; changing top-level packages may not patch bundled copies.

The safe next step is an upstream Kane update or a separately tested patched build. The static viewer does not load or execute these npm packages. That isolation does not erase the local runner's dependency risk.

## References

- https://github.com/advisories/GHSA-xcpc-8h2w-3j85
- https://github.com/advisories/GHSA-7q85-xj36-vmfc
- https://github.com/advisories/GHSA-hq66-cqwq-w95j
- https://github.com/advisories/GHSA-wq5f-xc86-pv6w
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/advisories/GHSA-g3hv-75wg-m249

This review narrows known exposure; it is not a security certification.
