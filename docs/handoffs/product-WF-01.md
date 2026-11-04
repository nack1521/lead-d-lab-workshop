# WF-01 — Approved low-fidelity Figma wireframes

Status: BUILT / READY FOR HUMAN REVIEW — delivery: docs/product/WF-01-DELIVERY.md; design review + targeted retest complete, human acceptance pending. User explicitly approved the Coordinator's immediately preceding scope: black-and-white wireframes ONLY on `02 Wireframes & Flows`, without editing other pages or writing application code.

Target file: RUOnC9Q15LA7DCc6rzhZtN
Target page: 1:2 — 02 Wireframes & Flows
Original user URL: https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-%E2%80%94-Workshop-MVP?node-id=1-3&t=Wzmpg91DodYLXiKd-1
Use target page 1:2, not the original link selection 1:3.

## Authorized mutations
- Add a self-contained, clearly named WF-01 low-fidelity wireframe area on page 1:2 only.
- Participant mobile: Join → Waiting → rating/poll → Sending/Saved; error, reconnect/outcome unknown, closed.
- Facilitator desktop: lobby/join instructions, question control, live aggregate including zero/stale result states.
- HR desktop: post-session summary, empty and partial/missing data. Charts/data explicitly labelled design examples.
- Grayscale only, readable Thai, clear hierarchy and auto-layout. Buttons, inputs and structural chart placeholders; no polished branding, paid generation or new features.
- Flow arrows/annotations are enough; if adding lightweight prototype links, keep within created frames and do not imply database/realtime runtime is working.
- All nodes/components local to approved page. Do not create file-global tokens/styles, publish libraries, modify 01/03 pages, delete user content or alter existing design.
- Figma Plugin API scripts used only through approved design tools are design authoring operations, not application coding. Application/source/test/CI code remains Antigravity-only.

## Workflow
Product: read AGENTS and FIGMA-DISCOVERY; load mandatory Figma use + generate-design guidance resources before every mutating use_figma call; inspect target before writes; use existing components only if suitable and already available; record evidence when no system exists.
Use limited retry-safe batches; return ALL node IDs affected and frame name/bounds per batch. If error may have partially applied, read canvas before retry; never duplicate all screens blindly.
Thai font: inspect available fonts and load actual family/style before text edits; no guessed style names. Auto-layout for related children and dynamic Thai text height. White/gray/black fills; consistent role grouping.
Scope check: record page 0:1 and 1:3 structure before/after by read only; no property mutation outside target.
Finish with no shimmer/placeholders-in-progress, read back created content, take composition screenshots and inspect for overlap/clipping. Layout placeholders that deliberately represent charts must be labelled as wireframe examples, not unfinished job markers.

## Deliverables
- Native editable Figma wireframes with exact file/page/frame URLs and node IDs.
- docs/product/WF-01-DELIVERY.md: inventory, state coverage, evidence IDs, font choices, assumptions, unresolved decisions, no-app-tests caveat.
- docs/product/WF-01-NODES.json: created top-level IDs, frame names and sizes; include all affected IDs where provided by tool.
- Optional local screenshot exports only within docs/product/evidence/ or artifacts/private/; no signed URLs/credentials in public docs.
- Product does not commit or close ticket; Coordinator verifies external target and owns commits/push.
- Senior Tester reviews actual screenshot/metadata after design: scope, labels, pending vs saved, reconnect, session closed, stale live result, HR empty/partial and privacy disclaimers. Only design review, not runtime/accessibility certification.

## Acceptance
1. Above roles/states visibly represented with readable Thai and grayscale-only styling.
2. Frame inventory/read-back supports declared totals; no overlap/clipping in sampled screenshots.
3. 01/03 remain unchanged; existing target content preserved.
4. No fake real-time or DB success claims; all sample counts labelled illustrative.
5. Evidence and final link returned. Coordinator commits and verifies remote SHA for project artifacts; no application code change.
