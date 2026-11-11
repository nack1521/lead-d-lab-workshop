# Lead+D Lab — Project foundation

สถานะ: C1 local tracer bullet ผ่านการแก้ finding รอบ R02 (C1-RV-01..05) — มี application code จริง (React + Elysia/Bun + PostgreSQL + authenticated native WS) และ regression suite ผ่านทั้ง Mode A/B. ยังไม่มี live deployment/public URL; real-browser interaction ของ fixing round ยัง NOT RUN ในเครื่องนี้ (ไม่มี browser automation) — ดู [executive report](docs/implementation/C1-REPORT.md)

## เริ่มอ่าน
1. [ข้อตกลง AI](AGENTS.md)
2. [ทีมและ workflow](docs/TEAM-WORKFLOW.md)
3. [Skills และข้อจำกัด](docs/SKILLS-REGISTER.md)
4. [Stack decision](docs/STACK-DECISION.md) / [Architecture research](docs/ARCHITECTURE-OPTIONS.md)
5. [AI progress สำหรับนำเสนอ](docs/AI-PROGRESS.md)
6. [Product review](docs/product/FOUNDATION-REVIEW.md) / [Senior test plan](docs/qa/FOUNDATION-TEST-PLAN.md)
7. [Antigravity C1 handoff](docs/handoffs/ANTIGRAVITY-C1.md) / [Static handoff review](docs/qa/C1-HANDOFF-REVIEW.md)
8. [Setup verification](docs/SETUP-VERIFICATION.json)
9. [WF-01 ส่งมอบ Figma wireframes](docs/product/WF-01-DELIVERY.md) / [Design review](docs/qa/WF-01-DESIGN-REVIEW.md) / [Targeted retest](docs/qa/WF-01-DESIGN-RETEST.md)
10. [ล่าสุด WF-01-R1: nickname และ textbox](docs/product/WF-01-R1-DELIVERY.md) / [R1 retest](docs/qa/WF-01-R1-DESIGN-RETEST.md)

## ทีม
- lead-d-setup: Project Lead + Coordinator
- lead-d-product: Product & UX
- lead-d-qa: Senior Tester & Delivery
- ผู้ใช้กำกับ Antigravity IDE สำหรับ coding ทั้งหมด

## Source policy
Source skills อยู่ใน .hermes/skills และ .agents/skills; provenance อยู่ docs/skills-lock.json
.research เป็น reference clones ที่ไม่เผยแพร่; ไม่รัน installers/hooks โดยพลการ
.gitignore กัน secrets/private PDF; เก็บประวัติใน local Git และ public repository เป้าหมาย `nack1521/lead-d-lab-workshop` ตามที่ผู้ใช้อนุมัติ ตรวจผล push ล่าสุดจาก Git/GitHub ไม่อาศัยข้อความนี้เป็นหลักฐาน

## Future deliverables
Working URL, public GitHub repository with full commit history, unlisted one-take 5–8 minute video with face and screen. ยังไม่มีแอปออนไลน์หรือวิดีโอ; repository เริ่มเก็บ foundation/design history ก่อน implementation

## iPhone on private Wi-Fi — preparation only
The current loopback URLs are not iPhone URLs. [LAN-IPHONE-01 handoff](docs/handoffs/LAN-IPHONE-01.md) and its [English START prompt](docs/handoffs/LAN-IPHONE-01-START-EN.txt) define a dev-only trusted-HTTPS LAN mode; this preparation has not implemented or started that mode. Any iPhone CA/profile trust is a separate explicit user action. No public tunnel or system trust change is authorized automatically; physical-phone verification remains NOT RUN.

## C1 local tracer bullet — commands ที่รันจริง

ต้องมี Bun 1.4.4 และ Docker engine ที่ทำงานอยู่. ค่า secret อยู่ใน `.env` (untracked) — คัดลอกจาก `.env.example` แล้วตั้ง `POSTGRES_PASSWORD` เอง.

```bash
bun install                 # pinned dependencies จาก bun.lock
docker compose up -d db     # PostgreSQL 16.15-alpine บน 127.0.0.1:5433 (volume c1a_c1_pgdata)
bun run migrate             # db/migrations/*.sql ผ่าน schema_migrations
bun run bootstrap           # synthetic fixtures ROOM-01/ROOM-02 + facilitator grants ใน .local/fixtures.json (untracked)
bun run api                 # Elysia API + WS บน 127.0.0.1:3000
bun run web                 # Vite dev server บน 127.0.0.1:5173
bun test tests              # integration tests กับ PostgreSQL จริง
bun run build:web           # production build ที่ apps/web/dist
bun run docker/web-serve.ts # เสิร์ฟ dist พร้อม SPA deep-link fallback บน 127.0.0.1:5173
docker compose stop db      # หยุดโดยไม่ลบ volume; ห้าม down -v/prune
```

Mode B (Docker-only, ไม่ใช้ host Bun/node_modules/DB เดิม) สร้างจาก fresh worktree และใช้ project คนละชื่อ:

```bash
git worktree add .worktrees/c1-mode-b HEAD
cp .env.mode-b .worktrees/c1-mode-b/.env   # คนละพอร์ต: web 5174, api 3001, db 5434
cd .worktrees/c1-mode-b
docker compose -p c1b --profile full up -d --build
docker compose -p c1b ps
docker compose -p c1b stop                 # ห้ามลบ volume
```

Tests ไม่ถูกใส่ใน production image. รัน suite แบบ Docker-only แยก container (ต้องมี PostgreSQL ที่ container เข้าถึงได้):

```bash
tests/run-in-docker.sh            # Mode B network c1b_default + c1b DB
tests/run-in-docker.sh c1b_default
```

The runner forwards `DATABASE_URL`/`ALLOWED_ORIGINS` by name (values never appear in
process arguments) and removes its temporary source copy on exit. Live server output
belongs in `.local/logs/` (untracked); result evidence files are immutable snapshots.

ห้าม push/deploy/public tunnel/paid service/global config/destructive reset จาก workflow นี้. ผลลัพธ์จริงพร้อมคำสั่ง/exit code อยู่ `docs/results/C1-LOCAL-BUILD/R01/`.

## Private LAN iPhone test mode (LAN-IPHONE-01)

Development-device testing on your own trusted private Wi-Fi only. This is not a public deployment, tunnel or workshop onboarding path. Details and limits: [LAN handoff](docs/handoffs/LAN-IPHONE-01.md) and [results](docs/results/LAN-IPHONE-01/R01/result.md).

```bash
bun run lan:certs        # project-local dev CA + server cert (SAN = current en0 IPv4 + <host>.local)
                         # written to ignored .local/lan-certs (keys mode 600; never commit/serve them)
bun run build:web:lan    # same-origin bundle: empty VITE_* so no loopback/observed IP is baked in
bun run lan:entry        # TLS entry on https://<lan-ip>:8443 -> web + /api + /ws to 127.0.0.1:3000
NODE_EXTRA_CA_CERTS=.local/lan-certs/ca.crt bun lan/verify.ts   # real API/DB/WS verification
```

The selected backing authority is the existing native **Mode A** API (`127.0.0.1:3000`), so participant and facilitator share one authority and one PostgreSQL database. The LAN entry binds only to the private LAN address; API/DB keep listening on loopback. If the LAN IP changes, rerun `bun run lan:certs` and update `ALLOWED_ORIGINS` for the exact `https://<new-ip>:8443` origin (the existing `.env` currently allows `https://192.168.1.98:8443`).

**iPhone certificate trust (user-assisted, required — the phone test stays BLOCKED until done):**
1. Transfer only the public CA certificate `.local/lan-certs/ca.crt` to your own test iPhone using AirDrop or another trusted out-of-band transfer. Do not bypass the initial HTTPS warning to bootstrap certificate trust. Never transfer `ca.key`/`server.key`; no certificate/profile is installed automatically.
2. On the iPhone install the downloaded profile: Settings > General > VPN & Device Management > install the profile.
3. Enable trust separately: Settings > General > About > Certificate Trust Settings > enable full trust for "Lead+D Lab LAN Development CA" ([Apple guidance](https://support.apple.com/en-us/102390)).
4. Open `https://<lan-ip>:8443/join` in Safari with code `ROOM-01`. If macOS prompts to allow incoming connections for `bun`, that firewall decision is yours; no firewall or router setting is changed by the project.

**Remove afterwards:** delete the profile in Settings > General > VPN & Device Management (this removes the CA and trust); stopping `bun run lan:entry` returns to loopback-only mode. Generated keys and certs stay in ignored `.local/lan-certs`; they are development-only and must never be used for production.

Limitations: one private network and one phone; guest-network/AP isolation, VPN, or firewall prompts can block it and are not changed by this setup; the LAN URL is not a stable hostname (IP-based SAN), and real-device Safari results are recorded by the user/QA, not fabricated here.

## HR summary after session end (HR-SUMMARY-01)

Local, read-only, session-scoped HR summary backed by the real PostgreSQL data of an **ended** session. No minimum-sample gate: any positive n is shown together with its per-question joined denominator; n=0 is an honest empty state with no mean. The page never shows names, comments, participant identifiers or individual rankings. Synthetic demo data only.

Private local trial (loopback; grants never go in URLs or the bundle):

```bash
bun run apps/api/src/hr-demo-fixture.ts          # fresh owned session/code, no ROOM fixture reuse
# drive synthetic participants through the real API (this smoke also ends the session):
bun scripts/hr-smoke.ts .local/hr-demo/<CODE>.json 30
bun scripts/hr-smoke-overlap.ts 30 30 27   # bounded overlapping real HTTP/DB/WS verification (fresh fixture, paced concurrency)
bun run apps/api/src/issue-hr-grant.ts <session-id-or-code>   # writes ignored .local/hr-grants/<id>.json
# open http://127.0.0.1:5173/hr and paste the grant into the page field
```

HR grants are session-scoped and use the configured HR TTL (prototype default follows the facilitator TTL, `GRANT_TTL_HR_SECONDS`). HR can only read the summary; it cannot join, submit, use facilitator controls or open a WebSocket. Expired/revoked/other-session/participant/facilitator access is denied. Keep grant files and screenshots out of recordings; delete `.local/hr-grants/*.json` after the demo.
