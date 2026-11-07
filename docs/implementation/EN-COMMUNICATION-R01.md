# English communication update — R01

- Task: EN-COMMUNICATION; producer: lead-d-setup (Coordinator, non-coding).
- Observed baseline: `91497cbc65760394869c35ef0f73dc7d9a577d46`; date: 2026-11-07 (+07).
- Human decision: approve concise English for coding-tool prompts and inter-agent technical communication; retain Thai communication with the user and approved Thai product copy.
- The user stated that the earlier Thai starter had not been sent to DeepSeek Harness.

## Changes
- `AGENTS.md`: authoritative communication-language policy.
- `docs/CODING-WORKFLOW.md` and `docs/handoffs/C1-LOCAL-BUILD.md`: pointers to the policy and English starter; existing scope and authorization remain unchanged.
- `docs/handoffs/C1-START-EN.txt`: canonical, reference-based initial DeepSeek prompt (251 whitespace-delimited words; not a token count).
- Profile-cache copy widget and plain-text download match the canonical prompt; the previous Thai cache artifact is retained as history.
- Coordinator's project-cycle skill: English communication convention, active-tool fix routing, and copy-widget support for both coding tools. Other agents' profiles were not edited.

## Verification and limitations
- Documentation checks: relative links and canonical/cache/widget content parity PASS; copy-handler JavaScript lint OK.
- Browser execution: prompt rendered, exact content matched the canonical file, Copy control visible, text area read-only. Clipboard transfer in the user's embedded preview was not independently measured.
- Protected dirty files `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md`: SHA256 unchanged; excluded from staging. Progress is recorded here instead of editing another writer's pending work.
- Historical results, Product/QA evidence and repository skill foundations: unchanged from the observed baseline.
- Token/cost savings: NOT MEASURED. No actual-model usage comparison or provider API request was performed.
- No application/test/config changes, coding-tool dispatch, implementation execution, push or deployment in this update. No claim that every other agent has read the new policy.

## Next gate
The user pastes the English starter into DeepSeek Harness. Current-build C1 evidence must be produced and reviewed independently before implementation acceptance; fallback still requires a stopped writer and an explicit handover.
