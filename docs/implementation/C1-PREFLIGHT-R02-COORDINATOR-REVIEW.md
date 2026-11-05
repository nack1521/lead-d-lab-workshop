# C1-PREFLIGHT-FOLLOWUP / R02 — Coordinator review

What this change does: ลุงตอบ findings ของ R01 และบันทึกผล R02 เป็น result.md/result.json พร้อม index ลงดิสก์จริงแล้ว จึงรับงานจากไฟล์ได้โดยไม่ต้องแปะบทสนทนา. รอบนี้เป็น static/preflight review ไม่ใช่ app QA หรือคำอนุมัติ local build

## ขอบเขตและหลักฐาน
- ตรวจเมื่อ 2026-11-05 (+07:00); Coordinator: lead-d-setup
- ไฟล์ที่อ่าน: docs/results/INDEX.md และ docs/results/C1-PREFLIGHT-FOLLOWUP/R02/{result.md,result.json}, AGENTS.md, TEAM-WORKFLOW.md, result protocol
- Git HEAD ที่ตรวจจริง: `7d065e6c25b5ea24f5a69a554468bbfc92acaf61`; R02 ระบุ baseline `29b40dbdb55c518546dac266911e2d18a6ef7fa2` ซึ่งเป็น commit เก่ากว่า
- Parse JSON จริงแล้วมี C1-01–C1-16 ครบ 16 unique IDs และทุก ID เป็น NOT RUN ทั้ง Mode A/B; detail path มีอยู่จริง
- ตรวจ npm registry exact metadata จริง 9 packages (React, React DOM, Vite, plugin-react, Elysia, cors, Drizzle ORM, drizzle-kit, postgres): เวอร์ชันที่เสนอมีอยู่จริง แต่พบ peer incompatibility ตาม REV-05
- ตรวจ GitHub Advisory API ของ vite@6.4.5, elysia@1.4.31, drizzle-orm@0.45.4: แต่ละ query คืน 0 advisories ไม่มี Link pagination ณ เวลาตรวจ. นี่เป็นขอบเขต known advisories ของ exact packages ที่ query ไม่ใช่ full transitive/image audit หรือคำรับรองว่าไม่มีช่องโหว่
- ตรวจ PostgreSQL upstream security/versioning และ Docker Hub tag metadata จริงตาม REV-06
- ไม่มี install, image pull/start, application/test/config edits, agy dispatch, deployment หรือ push ในรอบ review นี้

## Finding เดิม
| ID | ผล review ระดับ specification |
|---|---|
| C1-PF-REV-01 | ยังไม่ปิด: เปลี่ยน Vite/Elysia/ORM แล้ว แต่ชุด pins ยังมี compatibility/image-security gap ตาม REV-05/06 |
| C1-PF-REV-02 | RESOLVED_SPEC_ONLY: แยก question close, normal session end และ security revocation; เสนอ read-only grace 15 นาที. ผู้ใช้ยังต้องยืนยัน policy; ห้าม grace ต่ออายุเกิน hard TTL หรือข้าม revoked_at |
| C1-PF-REV-03 | RESOLVED_SPEC_ONLY: fallback approximate ชัดเจน ไม่ block/ตัด input จากตัวนับที่ไม่ตรง server และคง draft |
| C1-PF-REV-04 | RESOLVED_SPEC_ONLY: terminal non-save ต้องเป็น authoritative application outcome ที่รับรองไม่ commit ภายหลัง; generic transport/status error ยังคง UNKNOWN |

RESOLVED_SPEC_ONLY ไม่ใช่ PASS ของ C1 runtime. ต้องพิสูจน์กรณี drop ack + session end, hard expiry/revoke, segmentation mismatch และ concurrent receipt behavior หลัง build

## Must fix

### 1. C1-PF-REV-05 — plugin-react ที่เสนอไม่รองรับ Vite ที่เลือก
- What this is: R02/result.md:49–50 จับคู่ `vite@6.4.5` กับ `@vitejs/plugin-react@6.2.1`
- Problem: [npm metadata ของ plugin-react 6.2.1](https://registry.npmjs.org/%40vitejs%2Fplugin-react/6.2.1) ระบุ `peerDependencies.vite = ^8.0.0` จึงไม่รองรับ Vite 6 ตาม package contract. การพบ 0 advisories ไม่พิสูจน์ compatibility
- Fix: เลือก plugin version ที่รองรับ Vite 6 โดยไม่เปลี่ยน stack ใหญ่. Candidate ที่ Coordinator ตรวจจริงคือ [4.7.0](https://registry.npmjs.org/%40vitejs%2Fplugin-react/4.7.0): peers `^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`; query known advisories คืน 0 ไม่มี pagination. ยังเป็นข้อเสนอ ไม่ได้ติดตั้งหรือพิสูจน์ runtime
- If we skip it: dependency set ผิด peer contract และเสี่ยงติด install/build ก่อนถึง tracer bullet

### 2. C1-PF-REV-06 — PostgreSQL image ยังคงเป็น minor ที่มี known security fix ตามหลัง
- What this is: R02/result.md:56 ยังคงเสนอ `postgres:16.8-alpine` แม้ heading กล่าวถึง safe/advisory-free pins
- Problem: [CVE-2025-4207 ของ PostgreSQL](https://www.postgresql.org/support/security/CVE-2025-4207/) ระบุ versions ก่อน 16.9 ได้รับผลกระทบจาก GB18030 validation buffer over-read ซึ่งอาจทำให้ process หยุดภายใต้เงื่อนไขใน advisory. การ scan npm advisories ไม่ครอบคลุม PostgreSQL/container packages
- Fix: เสนอ current patched minor ของ major 16 พร้อม explicit tag, platform และแผน image scan/digest. [Upstream versioning](https://www.postgresql.org/support/versioning/) ระบุ current minor 16.15 ณ เวลาตรวจ; [Docker Hub tag 16.15-alpine](https://hub.docker.com/v2/repositories/library/postgres/tags/16.15-alpine) มี tag active และ linux/amd64 + linux/arm64(v8) จริง. ยังไม่ pull, ไม่ยืนยัน image CVEs ทั้งชุด และไม่สร้าง digest จำลอง
- If we skip it: เริ่มฐานข้อมูลด้วย minor ที่ทราบว่าขาด security fix แล้วโดยไม่มีเหตุผลที่ต้องใช้รุ่นนั้น

## Should fix

### 3. C1-PF-REV-07 — baseline ในผล R02 ไม่ตรง HEAD ที่รอ review
- What this is: R02/result.json:8 และ result.md:8 ระบุ HEAD เดิม `29b40db...` ขณะที่ HEAD ก่อนรับ R02 คือ `7d065e6...`
- Problem: ผู้ review ไม่อาจใช้ baseline field เป็นหลักฐานว่ารายงานตรวจจากเอกสารชุดล่าสุด; ไม่สรุปว่าเป็นเท็จหรือไม่ได้อ่านไฟล์ แต่ต้องแยก task baseline กับ observed HEAD
- Fix: ใน R03 รัน `git rev-parse HEAD`/status จริงและบันทึก observed HEAD พร้อม dirty paths; ถ้าตั้งใจใช้ task baseline เก่าให้แยก field/label ชัดเจน. เก็บ R02 เดิม ไม่ rewrite ประวัติ
- If we skip it: หลักฐานการเปลี่ยนแปลงและผลทดสอบในรอบถัดไปอาจผูกกับ commit ผิดชุด

## Next gate — เฉพาะ revision ที่ยังขาด
ให้ลุงอ่านเอกสารนี้ แล้วบันทึก R03 แก้เฉพาะ REV-05/06/07 พร้อมอ้างอิงจริง. คง policy ที่ตอบแล้วจาก R02 ไม่ต้องทำ preflight ทั้งชุดใหม่. ทุก runtime case ยัง NOT RUN; ยังไม่มี approval ให้ coding/install/pull/start/deploy/push. ผู้ใช้ยืนยัน technical choices/local build หลัง review พร้อม

Verdict: fix 1 and 2 first; correct provenance 3 in R03
Not checked: actual package install/build, full transitive/image security scan, application tests, image digests, load/mobile/production และ independent Senior Tester acceptance

## AI progress / การรักษางานเดิม
- Request: ผู้ใช้แจ้ง “ลุงทำเสร็จแล้ว”; Coordinator รับผลผ่าน results index ตามข้อตกลง
- AI contribution: อ่านผล R02 จากดิสก์, validate 16 cases, ตรวจ registry/GitHub API/PostgreSQL upstream/Docker Hub metadata จริง และเขียน review นี้
- Human decision: ยังไม่มี build approval ใหม่; ไม่ตีความการแจ้งจบเป็นสิทธิ์เริ่ม implementation
- เปลี่ยนเฉพาะ review และลิงก์ประกอบใน index; เก็บ producer R02 เดิม ไม่แก้คำตอบของลุงเป็นผลผ่าน
- docs/AI-PROGRESS.md และ docs/handoffs/ANTIGRAVITY-C1.md มี pending work เดิม จึงเก็บ progress รอบนี้ในรายงานแยก ไม่เขียนทับสองไฟล์นั้น
