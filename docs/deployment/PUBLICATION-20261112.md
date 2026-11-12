# Public repository publication safety review — 2026-11-12

User explicitly authorized GitHub push and deployment, with the existing free-only constraint. No paid plan, card, domain purchase or provider change is authorized. Publication does not imply full QA acceptance or a working cloud URL.

## Actual audit before publication
- Used official Gitleaks v8.30.1 as a project-task tool in the active Hermes profile cache only, not a global installation. Downloaded the Darwin arm64 release asset and verified its SHA256 against the GitHub release asset digest before execution.
- Scanned all-ref Git diffs, an exact HEAD archive, and all 733 reachable blob contents at the reviewed pre-publication revision c8fb03e. Historical blob contents totalled 10654245 bytes. Reports were 100% redacted and kept in ignored private `.local/publication-audit-20261112/`.
- Git-diff and HEAD-tree scans flagged 16 generic-key matches; the all-blob scan flagged 17 matches across versions. Reviewed flagged source ranges: they are the already-public Figma document identifier used by the design references, not an authentication credential. No blanket rule suppression or history rewrite was applied. Scanner exits for these flagged scans remain 1; classification, not a fictitious scanner exit 0, is the basis of disposition.
- Separately scanned the exact 18 attributed Coordinator/QA document/evidence candidates: exit 0, no findings. Additional publication documentation and final committed tree are rechecked before push. Protected dirty progress/original C1 handoff/service-appended R02 log and unattributed C1 evidence are excluded from staging, not reset or overwritten.
- Scanner coverage is not proof of absence of every secret or privacy risk: detector/format/entropy limitations remain, and arbitrary sensitive context can evade scanning. Actual candidate and reachable history checks supersede the earlier limited pattern-only preparation audit; no sensitive values are included in this report.

## Deployment boundary
Cloudflare MCP read succeeded; existing apn4ck Pages project reads GitHub repository `portfolio`, not this workshop repository. Do not modify or reuse that existing site. The workshop frontend will require its own selected project and the real backend HTTPS/WSS URLs.

Railway's official MCP OAuth registration rejected this Hermes client with HTTP 403. No identity spoofing, broad-scope token request or repeated registration attempt is permitted. The website connector remains connected but its exposed workspace/project reads require an identifier not yet available. Account Free-plan screenshot is user evidence of the plan, not of API access, a deployment, credit sufficiency or hard-stop behavior. No Railway service/database or Cloudflare deployment was created by this audit.

## Safe publication process
Commit only attributed, scanned documents and existing owned implementation history. Preserve meaningful full commits; no squash/reset/force push. Push the approved main branch only after final scan/classification and then read exact remote main back before reporting success. A GitHub push is not a live-app delivery. Remaining verifier/evidence limitations stay documented in canonical QA; no acceptance claims are changed by publication.
