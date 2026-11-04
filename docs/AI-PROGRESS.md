# AI collaboration progress — Lead+D Lab

เอกสารนี้เป็นบันทึกงานจริงสำหรับใช้เตรียมการนำเสนอ ไม่ใช่ผลทดสอบแอป
ผู้ดูแล: lead-d-setup (Project Lead / Coordinator)
เวลารอบ C0: 2026-11-04 (+07); ไม่ได้วัดเวลาทำงาน/โทเคน/ค่าใช้จ่ายอย่างเป็นระบบ จึงไม่อ้างจำนวนที่ประหยัด

## C0 — Skills, team และ architecture research
### Human decisions
- เริ่มจากศูนย์; ผู้ใช้ถนัด React/NestJS สนใจทดลอง Elysia บน Bun
- เลือกทีม A: Project Lead + Product & UX + Senior Tester & Delivery; Antigravity IDE ทำ coding
- จำกัดไฟล์งานใน /Users/aiink/Nack/Lead+D-Lab; อนุญาตข้อมูลระบบบอตใน Hermes
- อนุมัติจัดการ skills เป็นพื้นฐานก่อน และบันทึกการใช้ AI
- React บน Cloudflare เป็นทิศทาง; backend/DB/queue/cloud account/ค่าใช้จ่ายยังไม่เลือก

### สิ่งที่ AI ทำจริง
1. Coordinator อ่าน Full Stack Case Interview.pdf และตรวจ workspace ก่อนเขียน พบเริ่มต้นมี PDF ไม่มี application code
2. ดาวน์โหลด shallow/sparse reference clones ของทั้ง 5 repositories ภายใน .research/upstream; อ่าน candidate skill instructions ตรวจ dependencies/side effects และเลือกตามบทบาท
3. จัด 12 third-party skills ใน project directories พร้อม upstream commit SHA, SHA-256 และ license notices; ดัดแปลง handoff ให้เก็บใน workspace, local ticket tracker, ภาษาไทย และ Unslop helper safety
4. พัก cursor/plugins ไม่ติดตั้งเพราะ candidate ต้องใช้ named Cursor agents/CLI; ไม่รัน Caveman installer/proxy/telemetry; ไม่รัน upstream helper scripts
5. สร้าง profiles lead-d-product และ lead-d-qa ผ่าน Hermes CLI, ตั้ง model/provider และ cwd ด้วย config CLI; ไม่คัดลอก secrets ลงโปรเจกต์หรือแก้ profile ทีมเอกสาร
6. ตั้ง SOUL แยกบทบาท, Bot Mode metadata, canonical Bot Chat และ pin sessions
7. เรียกบอตทั้งสองทำงานจริงผ่าน CLI/gateway และอ่านผลงานกลับ: Product สร้าง FOUNDATION-REVIEW.md; Senior Tester สร้าง FOUNDATION-TEST-PLAN.md
8. Coordinator review เอกสารแล้วแก้คำว่า participant accounts เป็น token แบบไม่สมัครบัญชี และกำหนด multi-organisation เป็น optional เพื่อไม่ให้หลุด scope
9. ค้นคว้า official docs เรื่อง Cloudflare React/Workers/Containers, Elysia/Bun, Postgres/D1, Redis, BullMQ/Queues, CORS/cookies/WebSocket; เขียน architecture options โดยแยกข้อเท็จจริงจากข้อเสนอ
10. จัด TEAM-WORKFLOW, Antigravity C1 handoff และ verification report; ยังไม่เขียน application/test/migration/CI code

### ปัญหาจริงและการแก้ไข
- CLI canonical resume ปฏิเสธ --max-turns ที่ต่างจาก launch policy: retry โดยไม่ส่ง creation-only overrides แล้วบอตตอบและเขียนไฟล์ได้จริง
- `skills trust` รายงานพบ project files แต่ canonical skills_list ยังเห็นเฉพาะ builtin: ไม่ถือ install message เป็น proof; ติดตั้ง non-coding profile mirrors ตาม role แล้วทดสอบ skills_list/skill_view ซ้ำจนพบและโหลดได้
- `/handoff` ชน built-in command: ใช้ `/skill handoff` หรือ skill_view แทน
- การค้นเว็บบาง URL (Hermes skills page เดิม/Railway Elysia guide) ไม่สำเร็จ: ใช้ CLI help และ official Bun guide/skills index แทน ไม่แต่งคำสั่ง
- ตัวนับ test IDs รอบแรกใช้ regex เฉพาะตัวอักษรจึงตก A11Y cases: แก้เป็น alphanumeric แล้วนับใหม่; final verification รวม accessibility cases แล้ว
- Project root ยังไม่ใช่ Git repository: คำสั่ง git rev-parse คืน exit 128; ยังไม่ได้สร้าง commits/public repo และไม่อ้าง full history ว่ามีแล้ว

### Verified results
- 5 upstream repositories ถูกบันทึก revision ใน docs/skills-lock.json
- 12 unique third-party project skills; 15 role-specific profile mirrors เปรียบเทียบ byte equality ผ่าน
- 43 project skill files มี SHA-256 ใน lock manifest
- Product: 5 acceptance criteria; Senior Tester: 25 test cases ทั้งหมด NOT RUN เพราะยังไม่มีแอป
- Product canonical session: local-32424a6de89d4784cd4d704be5f4239efde215e3292917bfd939a412991ad73c
- QA canonical session: local-d366b10f56a25d74cc155647a2450e0a21b94b4e149019678ee8d53ea92c3e75
- CLI sessions list/pinned ยืนยัน Bot Chat ทั้งสอง; profile list ยืนยัน profiles ถูก served โดย gateway
- Product skill_view handoff ยืนยัน docs/handoffs; QA skill_view ponytail-review ยืนยันภาษาไทยและ changes no code; CLI skills list ยืนยัน Coordinator ชุดที่ติดตั้ง
- ยังไม่ได้ตรวจ visual roster ใน Desktop; การทำงาน bot ผ่าน CLI/gateway ผ่านแล้ว

### Artifacts
- AGENTS.md: scope/roles/permissions/progress rules
- docs/TEAM-WORKFLOW.md: cycle, ownership และ gates
- docs/SKILLS-REGISTER.md + docs/skills-lock.json: provenance/adaptations/install caveats
- docs/ARCHITECTURE-OPTIONS.md: options, schema proposal, realtime/queue/CORS และ deployment checklist พร้อมแหล่งอ้างอิง
- docs/product/FOUNDATION-REVIEW.md: Product & UX output ของบอตจริง
- docs/qa/FOUNDATION-TEST-PLAN.md: Senior Tester output ของบอตจริง พร้อม Coordinator clarification
- docs/team/: role instruction snapshots
- docs/handoffs/ANTIGRAVITY-C1.md: preflight และ draft spike brief
- docs/SETUP-VERIFICATION.json: machine-counted inventory/QA status
- .gitignore: exclude secrets, clones, raw private evidence และ interview PDF ก่อน public repository

### สิ่งที่ยังไม่เกิดขึ้น
- Antigravity IDE skill discovery/activation ในเครื่องยังไม่ verified; filesystem preparation ไม่เท่ากับ IDE test
- ไม่มี app runtime, database provisioning, migration, CORS/WS integration test, load test หรือ live link
- ไม่มี public GitHub repository/commit history/video และไม่มี cloud resources ที่สร้างใน C0
- Role restrictions เป็น instructions ไม่ใช่ OS filesystem sandbox; ไม่อ้างว่า profile isolation ป้องกันการเข้าถึง OS ทั้งหมด
- ไม่ได้ทดสอบว่า third-party skills ช่วยลดค่าใช้จ่ายหรือทำให้โค้ดเร็วขึ้นจริง

### Next decision gate
ผู้ใช้เลือก A: React Cloudflare + Elysia/Bun Railway + Postgres หรือ B: Cloudflare-native Workers + D1 + Durable Objects หรือ C: Bun ใน Cloudflare Containers
จากนั้นเลือก scope กิจกรรม/auth/คำตอบแก้ไขได้หรือไม่ และอนุมัติ local compatibility spike ให้ Antigravity ก่อน cloud deployment
C0 setup/research เสร็จในขอบเขตนี้; application delivery ยังไม่เริ่ม

## ประเด็นเล่าสำหรับวิดีโอในอนาคต
“ผมใช้ Hermes แยกงาน product และ senior testing ออกจาก implementation ใน Antigravity โดยตัวผมเป็นคนตัดสินใจ stack และ scope เราไม่เชื่อแค่ว่าติดตั้งสำเร็จ แต่ทดลองให้บอตเรียก skills จริง จนพบปัญหา project discovery และแก้ก่อนเริ่ม build ส่วน architecture เราแยก durable database, realtime transport และ background queue ออกจากกัน ไม่เพิ่ม Redis/BullMQ เพียงเพราะเป็นเครื่องมือที่นิยม”
ข้อความข้างต้นพูดได้จากสิ่งที่ทำแล้ว แต่ยังห้ามพูดว่าแอปรองรับ 30 คนหรือ deploy สำเร็จจนกว่าจะมีหลักฐาน

## C0 follow-up — stack chosen / tooling & design preparation
- Human decision: เลือก React Cloudflare + Elysia/Bun Railway + PostgreSQL ไม่มี Redis/BullMQ
- User asks about Docker, additional tools, MCP convenience and Figma-first feasibility; ยังไม่ใช่คำสั่งติดตั้งหรือเชื่อมบัญชี
- Coordinator ตรวจ machine/PATH และ standard app locations จริง: arm64, พบ Antigravity.app, มี Node/Git; ไม่พบ Docker/Bun และ deployment/DB CLIs ที่ตรวจใน PATH
- Docker/Bun command checks คืน command not found; combined shell exit 0 ไม่ได้แปลว่าแต่ละเครื่องมือผ่าน
- ตรวจ lead-d-setup MCP config ด้วย CLI: no servers configured; ไม่ได้ตรวจ Antigravity config หรือเข้าบัญชีผู้ใช้
- ค้น official docs และเขียน docs/STACK-DECISION.md, docs/TOOLING-MCP-FIGMA.md; แก้ AGENTS.md และ C1 handoff ให้ไม่ค้างสถานะ stack ที่ยังไม่เลือก
- Figma official remote รองรับ native canvas writing ตาม entitlement/client/edit permissions; ยังไม่พิสูจน์ Hermes/Antigravity eligibility จึงไม่รับรองเชื่อมได้ทันที
- No installers, cloud resources, account connections, Figma edits, code changes or app tests in this follow-up
- Next gate: อนุญาต system tooling installation (นอก workspace), เลือก MCP host/server scopes และเลือก Figma file/account path ก่อน external writes

## C0 follow-up — Bun container option / Figma first file
- Human decision: ผู้ใช้จะติดตั้ง Docker เอง มีบัญชี Figma แต่ยังไม่มีไฟล์
- 2026-11-04T13:43:57+07:00 ตรวจ command discovery แล้ว docker/bun ยังไม่อยู่ใน PATH ของ session นี้ ไม่สรุปแทนสถานะหลังผู้ใช้ติดตั้ง
- ตรวจ Bun official docs: official oven/bun image รองรับ arm64/x64 และใช้ container-only ได้; เปรียบเทียบกับ native development โดยไม่บังคับติดตั้งทั้งสอง
- ตรวจ Figma official guides: สร้าง Design file ผ่าน figma.new/Drafts, frames/pages; แนะนำเริ่ม 3 pages แทน 6 เพื่อไม่ติดข้อจำกัด Starter team files
- เขียน docs/GETTING-STARTED-BUN-FIGMA.md; ไม่รัน installer, pull image, container, code หรือ Figma remote write
- ไม่มีผล Docker/Bun runtime smoke test หรือ Figma artifact ในรอบนี้; file URL ไม่ได้ทำให้เข้าถึง private file ได้โดยอัตโนมัติ

## C0 follow-up — native dev + Docker clone path / MCP inventory
- Human decision: native Bun + PostgreSQL Docker เป็นโหมดหลัก; ขอ Docker-only path สำหรับคน clone repo; ส่ง Figma URL เป้าหมายแล้ว
- Coordinator บันทึก acceptance contract ใน docs/REPRODUCIBLE-SETUP-REQUIREMENTS.md; ยังไม่เขียน Compose/Dockerfile เพราะเป็นงาน Antigravity
- 2026-11-04T14:24:30+07:00 และการตรวจต่อเนื่อง: พบ Docker.app/CLI client 29.9.2 และ bundled Compose v5.6.1 แต่ default socket ต่อไม่ได้; docker/bun/gh/railway ยังไม่อยู่ใน checked PATH. ไม่ reinstall หรือแก้ PATH โดยพลการ
- ตรวจ native MCP ทั้ง default และ Lead+D profiles แล้ว: default มี figma/cloudflare/railway/supabase/prisma-postgres; Lead+D profiles ยังไม่มี native MCP. ชื่อไม่ต้องตรง shortlist และไม่ต้องเปลี่ยนชื่อ
- Connection tests: figma สำเร็จ 43 tools; supabase สำเร็จ 31 tools; อีกสามตัวไม่มี cached OAuth token จึงยังไม่พร้อมใน noninteractive session. ไม่เริ่ม login/copy tokens
- Hosted connector catalog/status เป็นอีกระบบ: tools อาจค้นพบได้แต่ hosted accounts ยัง disconnected ไม่ใช่หลักฐานว่า native MCP ของผู้ใช้ไม่ทำงาน
- Supabase/Prisma integration ไม่ได้เปลี่ยนการเลือก Railway PostgreSQL และไม่ถือเป็น viewer ของ DB ใดก็ได้
- Figma browser ถูก request error; preview read bridge timeout. Default Figma MCP discovery ผ่านแต่ยังไม่ได้อ่าน exact file/node จึงไม่อ้างว่าเห็นหรือออกแบบ canvas แล้ว
- อธิบาย pgAdmin 4 เป็นตัวเลือกที่ใช้ได้ หากผู้ใช้หมายถึงชื่อนี้; native viewer ต่อ loopback mapped port ส่วน container viewer ต่อ DB service DNS
- Artifacts: docs/ENVIRONMENT-MCP-CHECK.md, docs/REPRODUCIBLE-SETUP-REQUIREMENTS.md; อัปเดต STACK-DECISION และ C1 handoff
- No application changes, installations, cloud writes, repository publication or Figma edits in this round

## C0 → Product preparation — installation and version control
- User approved native Bun/gh installation, public GitHub repo lead-d-lab-workshop, commit identity from GitHub, and read-only Figma setup for Product
- Installed official macOS ARM64 Bun 1.4.4 and gh 2.103.3 with SHA-256 verified against official release digests. Used user-local paths without sudo/Homebrew or shell config overwrite
- Verified version/revision, simple Bun runtime execution and discovery through zsh login shell. Installation results are not app runtime tests
- User completed gh auth login; authenticated read confirms nack1521, display name Apirach (Nack). Set repo-local identity and GitHub noreply email; no global identity changes
- Initialized Git main in project. Preparing checkpoint commits with private PDF, reference clones/install downloads, raw session exports and secrets excluded. No rewriting/squashing of history
- Figma supported installation connected Coordinator profile. Actual get_metadata read verifies pages 0:1, 1:2, 1:3; each returned empty canvas metadata
- Separate Product profile installation was interrupted/not_connected and CLI timed out. Direct Product Figma remains BLOCKED; do not claim it is configured. No repeat connection prompt or credential-copy workaround
- Product subsequently wrote docs/product/FIGMA-DISCOVERY.md from Coordinator-supplied local evidence, distinguishing its own lack of direct access and drafting flows/states only
- GitHub MCP catalog install returned unknown entry; used authenticated gh for repository operations instead of an unreviewed server
- Evidence: docs/INSTALLATION-VERIFICATION.md. Created public repository https://github.com/nack1521/lead-d-lab-workshop after explicit user selection; pushed actual foundation and Product draft commits
- Verified GitHub visibility PUBLIC, default branch main and exact remote SHA matching local HEAD at 04c6ebdd8e83aa7ef9f48bae7d027645d2c520fa after first push. Commits: 0938fc9 foundation; 04c6ebd Product discovery. Subsequent verification-log commit is expected, not a rewritten history
- Checked tracked inventory: 65 paths after Product commit; no interview PDF, .research, .env/auth files tracked. High-confidence secret-pattern scan reported no matches; this is not a comprehensive security certification
- git diff --check flagged an existing extra blank line in vendored Unslop license; retained upstream license bytes to preserve provenance/hash rather than changing legal text for formatting
- GitHub MCP could not be installed from current managed catalog (unknown entry); gh user-authenticated path created/verified the repo successfully
- Direct Product Figma setup remains incomplete: connection approval settled interrupted. Completing it needs user action in Product profile; Coordinator read access and local Product draft are verified separately
- No Figma canvas write, app code, Docker/DB setup or cloud deployment in this phase

## Product Figma direct read — verified after user authorization
- User reported Product Figma connection completed; no new install/login flow was initiated by AI
- Coordinator ran actual profile-scoped checks at 2026-11-04T15:01:56+07:00: enabled Figma configuration and successful connection/tool discovery in lead-d-product
- Product canonical Bot Chat directly listed pages and read metadata of 0:1, 1:2 and 1:3 in exact file RUOnC9Q15LA7DCc6rzhZtN at 15:02 (+07). All succeeded; XML showed canvases without child elements in this observation
- Product wrote docs/product/FIGMA-READ-VERIFICATION.md with arguments, direct results, request IDs and observed timestamps. Coordinator read the report and audited the last-turn session export: exactly four Figma calls, all get_metadata on the correct file, no canvas write calls
- Resolved the direct-read blocker in INSTALLATION-VERIFICATION and the current-status banner of FIGMA-DISCOVERY. Preserved the historical failure context rather than pretending the first attempt succeeded
- Raw session export remains ignored in .research; no tokens or raw private transcript added to Git
- Design flow remains DRAFT; no screenshot/visual inspection, Figma canvas writes, application implementation, DB/realtime tests or deployment in this turn
- Next human gate: approve low-fidelity frame scope/flow and explicitly authorize writing to the selected Figma page before drawing there

## Template สำหรับรอบถัดไป
- Cycle/task ID และ timestamp
- คำขอ/ปัญหา
- Human decisions และเหตุผล
- AI contribution แยกตาม bot/Antigravity
- Artifacts/diff/commit reference
- คำสั่งและผลจริง; evidence path; case statuses
- ปัญหาที่พบ/ทางเลือกที่ไม่ใช้/ความเสี่ยงที่ยังเปิด
- Human acceptance และ next gate
