# Unslop R02 — rejected baseline audit and direction gate

Status: R01 REJECTED_BY_USER. R02 AUDIT_COMPLETE / DIRECTION_PENDING. Do not use R01 as an approved visual base or implement it. Preserve R01 files as history. No app edits, publication or coding dispatch.

## Applied source
Read project `.agents/skills/unslop/SKILL.md`, PROJECT-SAFETY.md and references/signs.md. Unslop by Damir Sokolovsky (@heydamir), https://github.com/heydamir/unslop, CC BY 4.0. Project copy limits Hermes to audit/spec; coding writer owns app changes. Snapshot/story helper scripts are not installed and were not invoked.

## Evidence
Opened docs/design/WORKSHOP-BUILDER-02/preview.html in browser and inspected Dashboard screenshot at 1280x577. Also retained current source context from prior creation. This is visual audit, not runtime app QA or a claim of user preference acceptance.

## Findings
- `.stats`: three equal-sized bordered statistic cards dominate above actual question results. Generic dashboard composition, not workshop operation hierarchy.
- `.charts`: equal columns/equal visual weight for score and choice; no primary active-question view. User must inspect multiple aggregates instead of operating the current question.
- `--ink`, background, help, pills, selected navigation and bars spread green tint across chrome. Brand color is everywhere rather than reserved for a meaningful content moment.
- `.caption`: tracked English uppercase labels (ROOM / FEEDBACK LAB, WORKSHOP SPACE, SINGLE CHOICE) add template garnish and compete with Thai context.
- `.panel`, `.room`, `.pill`: repeated rounded containers around almost every group. Hierarchy relies on boxes rather than aligned content and typographic rhythm.
- `.heading`: generic aspirational room-list copy rather than concrete room name/list or authoring task.
- Sidebar exposes room-specific Questions/Dashboard at global room-list level, obscuring global-versus-in-room navigation.
- Dashboard has multiple comparable actions in a row (preview, next question, waiting-state toggle), mixing prototype controls with actual operator decisions.
- Large duplicate brand wordmark next to full wordmark-containing source image; logo should occupy one deliberate placement, not repeat the product name unnecessarily.
- Numeric text lacks deliberate tabular alignment; type hierarchy leans on repeated bold headings and large stat boxes.
- Existing sample labels are honest, but repetitive disclaimers inside each content region distract from evaluating the actual composition. Keep one unmistakable design-fixture disclaimer outside the product canvas.

## Five-line proposed direction
Product: managers prepare questions, run one shared conversation and inspect answers without terminal/token chores.
Character: purposeful, tactile, sociable.
World: a facilitator's working agenda — question sequence, response sheets and a shared presentation wall; not literal paper textures or decorative sticky notes.
Moments: one large active-question result with deliberate chart labels, plus a focused participant answer surface; navigation and room inventory remain quiet neutral.
Signature: a consistent question-number rail linking editor, active question and results; functional progress rather than ornamental icons.

## Proposed structural reset (requires human direction choice)
- Global inventory: compact room list/table, substantive room title, status/updated metadata aligned, one Create room action; no marketing headline or KPI tiles.
- In-room workspace: left question sequence; main working area switches between Questions and Dashboard as user requested; one clearly identifiable Open room/active-question action.
- Dashboard: active question is the large central result, participants/answered counts inline near its heading; compact question selector/history; choice bars use actual scale labels and numbers. Text reads as an answer feed, not nested cards; latest five and paginated all answers.
- HR: same room and question context, no mutation controls; overview composed from question results, not narrative insights or a generic finance dashboard.
- Brand: preserve supplied logo; use teal sparingly in current question/result. Neutral white/graphite chrome. No gradient surface, glass, random grain, blobs, sticker metaphors or rainbow graphs.
- Thai copy names the task directly. Proposed primary family must be chosen for Thai legibility, not swapped to a Latin-first default. 44px touch targets and visible focus retained.

## Gate
Ask user whether the agenda-first direction matches taste, or choose presentation-wall or editorial/report emphasis. Do not create another full mockup before this gate; prior user explicitly rejects entire R01 design, not merely its colors. After choice, next owned artifact is revised wireframe/visual direction for room list, editor and dashboard; then user validation and one coding writer.
