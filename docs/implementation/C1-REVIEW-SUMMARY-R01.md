# C1 local build — Consolidated independent review R01

**Current verdict: CHANGES_REQUESTED.** Five deduplicated blocking groups from six source finding IDs. Two groups have runtime browser/authoritative-state reproductions; three remain static code-path findings requiring targeted reproduction. Existing green suites do not close these findings.

## Sources and provenance
- Submitted report commit: `f1320d3e000651b82c7f50afc0642b2f699a2ad5`; application source: `c5ed399aae53fed4c04229fecea546739f0b3b44`. Review documentation commits do not change the application baseline.
- [Canonical Senior QA](../qa/C1-LOCAL-BUILD-QA-R01.md) and [Coordinator browser review](C1-BROWSER-REVIEW-R01.md) remain separate, unchanged reports. The Coordinator checked the cited API/WS/client code paths before consolidating.
- [Machine triage](evidence/C1-REVIEW-R01/triage.json) preserves every source ID; QA-C1-03 and C1-UI-02 are one join-retry defect, not two.

## Blocking groups
| Group | Original IDs | Evidence | Required outcome |
|---|---|---|---|
| C1-RV-01 | QA-C1-01 | STATIC_CODE_PATH | Terminal non-save, stable receipts and in-flight safety |
| C1-RV-02 | QA-C1-02 | STATIC_CODE_PATH | Already-open WebSocket grant lifetime |
| C1-RV-03 | QA-C1-03, C1-UI-02 | BROWSER_AND_DB_REPRODUCED_MODE_B | Lost join acknowledgement creates another participant |
| C1-RV-04 | QA-C1-04 | STATIC_CODE_PATH | Monotonic snapshots, join visibility and truthful Live |
| C1-RV-05 | C1-UI-01 | BROWSER_AND_API_REPRODUCED_MODE_A | Saved outcome incorrectly carries into the next question |

### C1-RV-01 — Terminal non-save, stable receipts and in-flight safety
Certify per-attempt terminality; stable replay/fingerprint conflicts for terminal outcomes; delayed original plus rejected reconciliation must not enable a fresh attempt while late commit remains possible.

### C1-RV-02 — Already-open WebSocket grant lifetime
Enforce approved expiry, session-end grace and revocation on already-open sockets, resync and broadcast; test participant/facilitator variants without inventing a new lifetime policy.

### C1-RV-03 — Lost join acknowledgement creates another participant
Keep the pending join key and immutable payload for uncertain unchanged retry; one logical join must recover the same participant and count once. Define explicit safe room/payload-change behavior.

### C1-RV-04 — Monotonic snapshots, join visibility and truthful Live
Join-only count changes must advance coherent revisioned snapshots and publish after commit. Reject stale HTTP as well as WS state. Mark Live only after an authorized fresh snapshot; cover delayed HTTP, equal-revision resync and reconnect.

### C1-RV-05 — Saved outcome incorrectly carries into the next question
Scope outcome/draft/read-only state to authoritative question and own response. A new unanswered question is not saved and is usable. Preserve unknown earlier attempts separately; verify rating-to-poll, return to answered question and unknown-during-transition.

## Independently executed regression checks
- Coordinator Mode A `bun test tests`: **56 pass / 0 fail, exit 0**; `bun run typecheck`: **exit 0**. [Sanitized output](evidence/C1-REVIEW-R01/coordinator-regression.json). These independently corroborate the canonical QA rerun rather than relying only on its summary.
- The canonical QA Mode B attempt found no tests in the production API image. A Coordinator ephemeral runner with read-only test/source mounts then exposed missing test dependencies (exit 1). Neither is treated as an application regression or a requirement to ship tests/dev dependencies in production. Both limitations are retained.
- Alternative executed successfully: tracked source from the Mode B commit was streamed with `git archive` into tmpfs in the pinned Bun base image; frozen dependency install and the existing suite ran entirely inside Docker on the existing Mode B DB network. **56 pass / 0 fail, exit 0**. No host Bun/node_modules or host credential directories were mounted, no production image changed, no ports published and no app data reset. [Sanitized output](evidence/C1-REVIEW-R01/coordinator-mode-b-fresh.json).
- This closes the independent existing-suite execution gap for Mode B, not all Mode B acceptance criteria. It is not a fresh independent rebuild/restart of the entire web/API/DB stack and does not make uncovered scenarios pass.

## Coverage and retest contract
- Read the canonical QA C1-01–C1-16 coverage table with these deltas: Mode B existing-suite rerun now succeeded; C1-03 has a runtime UI/DB failure in addition to static evidence; C1-15 has a reproduced functional failure rather than merely NOT RUN. Browser observations supplement, not replace, the other criterion evidence.
- Reproduce each new defect at its real seam before fixing. Add RED-to-GREEN tests through the active coding tool, including actual React container wiring, real PostgreSQL/WS and controlled in-flight/expiry/freshness interleavings. Pure helper tests alone are insufficient.
- Rerun affected tests and full regression on the new build in both approved modes; exercise real-browser question transitions, lost join/submission acknowledgements, fresh-attempt safety and reconnect. Preserve the approved R02 attempt policy, Thai product copy and one-instance stack.
- Update stale current setup/status wording in README as delivery hygiene; preserve historical review evidence. Keep tests out of production images unless there is a separate justified design decision.
- Continue task `C1-LOCAL-BUILD` with the next unused producer run (R02 only if still free), immutable result.md/result.json, all C1-01–C1-16 statuses and evidence; update executive report and INDEX last. Do not overwrite R01 or copy its PASS onto changed code.

## Authority, progress and limits
- User-operated DeepSeek remains primary; Antigravity remains fallback only after an explicit stopped-writer handover. This consolidation prepares scope; it does not send START, accept implementation or authorize publication.
- Coordinator ran existing commands and documented evidence only: no application/test/migration/config edits, no service restart, no destructive DB reset, no push/deploy. Temporary test databases were owned by the existing suite; temporary containers were auto-removed.
- Protected dirty AI-PROGRESS and original C1 handoff remain untouched; this summary records the review progress. Real mobile, load/30-client SLA, full accessibility/security certification, actual crash-before-broadcast and deterministic close/submit ordering remain unproven.
- Next gate: user-operated fix/retest -> independent QA/browser verification -> user trial/acceptance.
