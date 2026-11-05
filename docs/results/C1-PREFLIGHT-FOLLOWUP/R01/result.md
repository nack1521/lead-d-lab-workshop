# C1-PREFLIGHT-FOLLOWUP / R01 — รับรายงานและ Coordinator review

- บันทึกเมื่อ: 2026-11-05T13:32:29+07:00
- Producer ของรอบนำเข้า/review: lead-d-setup; ต้นทาง: Antigravity IDE ผ่านไฟล์แนบของผู้ใช้
- Baseline HEAD: `29b40dbdb55c518546dac266911e2d18a6ef7fa2`; ไม่ใช่ application build SHA
- สถานะ: **CHANGES_REQUESTED** (document/preflight review เท่านั้น)
- [ต้นฉบับคำตอบพร้อมรายละเอียดทั้ง 6 ข้อ](source-report.md) | [สรุปเครื่องอ่าน](result.json)
- ไม่ได้ dispatch agy, install dependencies, แก้ app/tests/config, deploy หรือ push ในรอบนี้. CLI binding OP-01 ยัง BLOCKED; การนำเข้ารายงานไม่ใช่การแก้ CLI

## ผลที่รับและตรวจจริง
รายงานตอบส่วนเติมทั้ง 6 หัวข้อ มี proposed exact versions, auth/rate budgets, Unicode/UX และ acceptance seams. การมีคำตอบครบไม่เท่ากับ technical decisions ได้รับอนุมัติหรือ runtime ผ่าน

Coordinator ตรวจซ้ำในเครื่องจริง:
- Git HEAD ตรงกับรายงาน; มี dirty เดิมสองไฟล์ `docs/AI-PROGRESS.md` และ `docs/handoffs/ANTIGRAVITY-C1.md`. คงไฟล์ทั้งสองไว้ ไม่ stage ปนกับงานใหม่
- `bun --version` exit0 → `1.4.4`
- `bun -e` รัน Intl.Segmenter แบบ th/grapheme exit0: น้ำ utf16=3/graphemes=1, family emoji utf16=11/graphemes=1, ธงไทย utf16=4/graphemes=1, 👩🏽‍💻 utf16=7/graphemes=1. นี่เป็นเพียง native runtime examples ไม่ใช่ app boundary/integration tests
- คำสั่ง `docker` แบบชื่อสั้นหาไม่พบใน shell ของ Coordinator; retry ด้วย `/Applications/Docker.app/Contents/Resources/bin/docker` สำเร็จ: image ls exit0 ไม่มีรายการ; info exit0 → server `29.9.2`. Docker engine พร้อมตอบในรอบนี้ ไม่ใช่ app/DB พร้อมใช้
- อ่าน upstream Vite advisory จริงตามลิงก์ใน finding 01

ยังไม่ได้ตรวจยืนยัน IDE skill activation/tool history, package compatibility ทั้งชุด, image multi-arch/digest หรือ app runtime; ส่วนเหล่านี้ยังเป็น self-report/UNVERIFIED

## Coordinator review
What this change does: รายงานนี้เติม C1 preflight เพื่อเลือก versions/security/Unicode contract และกำหนดการพิสูจน์ Mode A/B ก่อนขอเริ่ม build. ยังไม่สร้างแอปหรือรันทดสอบ C1

### Must fix ก่อนเริ่ม build

### C1-PF-REV-01 — ไม่รับ pin Vite 6.2.0 ทั้งชุดโดยอัตโนมัติ
- What this is: ต้นทาง §2.1 เสนอ Vite `6.2.0` และเรียก latest v6 stable โดยยังไม่มีหลักฐานรองรับคำว่า latest
- Problem: upstream [GHSA-356w-63v5-8wf4](https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4) ระบุ affected `>=6.2.0, <=6.2.5`: เมื่อเปิด dev server ให้ network และใช้ Node/Bun อาจอ่านไฟล์ที่ไม่ควรถูกเสิร์ฟได้. ยังไม่มีแอป/ไม่มีการทดสอบ exploit ในโปรเจกต์นี้
- Fix: เสนอ exact compatible versions ใหม่จาก registry/release notes พร้อม security-advisory review ทั้ง dependency/image set. `6.2.6` แก้เฉพาะ advisory นี้ ไม่ใช่ข้อสรุปว่าปลอดจาก advisories อื่น ณ ปัจจุบัน. อย่าเปลี่ยนเป็น latest ลอยหรืออัปเกรดเองก่อน approval
- If we skip it: เริ่ม project ด้วย pin ที่ทราบช่องโหว่แล้ว โดยเฉพาะเส้นทาง container/dev-server ที่อาจต้องเปิด host

### C1-PF-REV-02 — ระบุ receipt access หลัง close/session end ให้ครบ
- What this is: ต้นทาง §3 เสนอ revoke grant ทันทีเมื่อ session จบ/ปิดห้อง ขณะที่ §5–6 กำหนด unknown reconcile และ accepted replay หลัง close
- Problem: หาก ack หายแล้ว facilitator ปิดห้องจน grant ถูก revoke การ reconcile จะได้ unauthorized แทน receipt; ผู้เข้าร่วมจึงยืนยันไม่ได้ว่าบันทึกแล้วหรือยัง. รายงานยังไม่แยก question close, room/session end และ security revocation
- Fix: ระบุ lifecycle ให้ชัด: normal close หยุด new writes แต่ต้องมี authenticated read-own receipt/reconcile ตามขอบเขตและช่วงเวลาที่ตกลง; security revocation/expiry ยังต้องปิดสิทธิ์จริง. เสนอ policy/read-only window ให้ผู้ใช้ตัดสินใจ ไม่ทำ unauthenticated receipt endpoint หรือแอบต่ออายุ grant. เพิ่ม seams C1-10/C1-11/C1-13
- If we skip it: กรณี drop-ack พร้อมปิดห้องค้าง UNKNOWN และ core recovery flow ไม่ครบ

### Should fix ใน preflight revision

### C1-PF-REV-03 — ทำ Unicode fallback ให้เรียบง่ายและไม่หลอกเรื่องตัวนับ
- What this is: ต้นทาง §4.2 เสนอ fallback นับ codepoints แล้วรวม Thai marks บางช่วง
- Problem: การรวม marks ของไทยไม่ครอบคลุม ZWJ/flag/skin tone ที่ report เองระบุไว้. เช่น family emoji เป็น 1 grapheme แต่ codepoints หลายตัว ทำให้ live count ไม่ตรง server
- Fix: ใช้ fallback ที่พิสูจน์ segmentation เดียวกันได้ หรือแสดง approximate/unavailable count ชัดเจนและให้ server authoritative; ไม่ block/ตัด input จาก fallback ที่ไม่ตรง. ไม่จำเป็นต้องสร้าง Thai Unicode parser เอง. คง draft และแสดง inline error ตาม baseline
- If we skip it: ผู้ใช้เห็นจำนวนที่ขัดกับ validation โดยเฉพาะ browser ที่ไม่มี Intl.Segmenter

### C1-PF-REV-04 — Terminal non-save ต้องเป็น application contract ไม่ใช่ดู HTTP status อย่างเดียว
- What this is: ต้นทาง §5.2 ใช้ HTTP400/422 เป็นตัวอย่าง terminal rejection เพื่อแก้ draft และใช้ key ใหม่
- Problem: HTTP status จาก proxy/transport หรือ generic error ไม่ได้ยืนยันด้วยตัวเองว่า request เดิมจะไม่ commit ภายหลัง. ตัวอย่าง concrete คือ write อยู่ระหว่างดำเนินการ แต่ client ได้ error จากชั้นกลางและเปลี่ยน key ไปแล้ว
- Fix: ให้ terminal confirmed non-save มาจาก authoritative structured application outcome ที่รับรอง old request ไม่ commit ภายหลัง; status ที่ไม่เข้า contract ยังคง UNKNOWN และ reconcile key/payload เดิม. อย่าถือ error ทั้งกลุ่มเป็น permission ให้ key ใหม่
- If we skip it: client เปลี่ยน key และ draft ก่อนทราบผลเดิม ทำให้ recovery/immutable-answer contract สับสน

Verdict: แก้ C1-PF-REV-01/02 ก่อนอนุมัติ build และตอบ 03/04 ใน R02
Not checked: full dependency security scan, runtime C1, mobile/load/production และ independent QA

## Acceptance cases — ไม่มี runtime execution ในรอบนี้
ทุกเคสด้านล่าง actual = NOT RUN ทั้ง Mode A/B; ยังไม่มี application build/test artifacts, command/exit/evidence ของ app เป็น “ไม่มี/ไม่ได้รัน” ไม่ใช่ PASS. การแยก C1-01/02 หมายถึง setup คนละ mode ตาม handoff ไม่ได้สั่งให้ Mode A กลายเป็น Mode B

## C1-01
Expected: Mode A: native Bun + Docker PostgreSQL. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-02
Expected: Mode B: Docker-only fresh worktree ไม่พึ่ง host Bun. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-03
Expected: Anonymous join, optional/duplicate nickname, unchanged join retry. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-04
Expected: Rating + comment atomic commit และ rollback เมื่อ DB fail. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-05
Expected: Poll + comment และ invalid choice/type/rating rejection. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-06
Expected: Whitespace, grapheme limits, Thai/emoji และ safe DOM render. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-07
Expected: Sequential/concurrent retry once และ key/payload conflict. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-08
Expected: Accepted immutable; edited draft หลัง terminal non-save; unknown reconcile. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-09
Expected: Facilitator aggregate หลัง DB commit และไม่มี raw fields. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-10
Expected: Controlled close/submit race และ accepted replay หลัง close. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-11
Expected: Drop ack, reconnect/resync และ stale revision rejection. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-12
Expected: Restart API/DB ไม่ลบ volume และ persistence/receipts คงอยู่. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-13
Expected: Role/session isolation, missing/expired/revoked grant, pre-auth silence. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-14
Expected: HTTP/WS origin allow/deny/null/missing และ origin ไม่แทน auth. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-15
Expected: Production build, deep-link reload, labels/multiline Enter/error recovery. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## C1-16
Expected: Secret/raw text leak checks ใน aggregate/log/image และ setup docs. Actual: **NOT RUN** (Mode A/B).
Command/exit: ไม่ได้รัน app tests; evidence: ยังไม่มี. แผนเดิมอยู่ใน source-report.md §6 และ handoff §7

## Next gate และข้อความสั้นสำหรับลุง
1. อ่าน AGENTS.md และ docs/ANTIGRAVITY-RESULT-PROTOCOL.md; นำกติกาบันทึกผลไปใช้กับคำตอบถัดไป โดยเริ่ม C1-PREFLIGHT-FOLLOWUP/R02
2. ตอบ findings C1-PF-REV-01–04 เป็น preflight revision พร้อมแหล่งอ้างอิงจริง; เก็บคำตอบเต็มใน result.md + สรุป result.json และอัปเดต docs/results/INDEX.md สุดท้าย
3. รอบนี้อนุญาตเฉพาะเอกสารผลลัพธ์ ไม่มี approval ให้ application coding, install dependencies, pull/start containers, deploy หรือ push. หยุดรอผู้ใช้ตัดสินใจ technical choices/local build

## AI progress ของรอบนี้
- Request: ผู้ใช้ส่งผล follow-up และขอให้ลุงบันทึกคำตอบตามรหัสเคสเพื่อแจ้งจบสั้นๆ
- AI contribution: Coordinator นำเข้ารายงาน, ตรวจ native/Git/Docker/advisory จริง, จัด per-run result protocol และ static findings
- Human decision: อนุญาตให้จัด workflow เก็บผล; ยังไม่อนุมัติ technical proposal/local build
- Changed artifacts: AGENTS.md, TEAM-WORKFLOW.md, Operator role doc, result protocol/index และ C1-PREFLIGHT-FOLLOWUP/R01
- Limitations: ยังไม่ยืนยันว่า conversation ปัจจุบันของลุงอ่านกติกาใหม่แล้ว; CLI resume ยัง blocked. เก็บ progress รอบนี้แยกเพราะ AI-PROGRESS.md/handoff มี pending work เดิม และไม่เขียนทับ
