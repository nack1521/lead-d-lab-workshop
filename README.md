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
