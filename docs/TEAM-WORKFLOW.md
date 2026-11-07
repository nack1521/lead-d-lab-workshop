# Lean team — Cycle-based workflow

## Current coding channel
ผู้ใช้เลือกและอนุมัติ **DeepSeek Harness เป็นหลัก / Antigravity เป็น fallback เมื่อ budget หมด** วันที่2026-11-07. ผู้ใช้สั่ง primary tool เอง; Operator standby ไม่ auto-dispatch ลุง. Current C1 handoff: [C1 local build](handoffs/C1-LOCAL-BUILD.md); ก่อนสลับอ่าน [coding workflow / checkpoint](CODING-WORKFLOW.md). Historical Antigravity-only/channel blockers ไม่ขวาง primary และไม่อนุญาตให้มี writer สองตัวพร้อมกัน. UI05 accepted/C1 local approval/stack/case matrixเดิมคงเดิม; ยังไม่มีหลักฐานเริ่ม DeepSeek session จากการปรับเอกสารนี้

สถานะ: ทีม A/stack ตาม docs/STACK-DECISION.md; flow WF-01-R1 เป็น baseline ที่ผู้ใช้ยืนยันแล้ว. C1 preflight R03 ผ่าน targeted metadata review ตามประวัติ; **ผู้ใช้รับ UI05 R02 และอนุมัติ C1 local build แล้ว** ดู [approval/start record](implementation/C1-LOCAL-BUILD-APPROVAL-R01.md) และ [current C1 handoff](handoffs/C1-LOCAL-BUILD.md). Coding-tool execution ยังต้อง verify แยก ไม่ถือว่ามี running app หรือ runtime PASS. ผู้ใช้อนุมัติปรับ AGENTS.md เรื่อง Unslop แล้ว และเลือก character ผ่อนคลาย/อบอุ่น/โปร่งพร้อมภาพ reference; ดู [UI-01-R1 — reference & scale](product/UI-01-R1-REFERENCE-AND-SCALE.md). ผู้ใช้ **ปฏิเสธUI-02ทั้งหมด** ว่าเป็นAI slop; เก็บ [UI-02](product/UI-02-DELIVERY.md) เป็นประวัติ ไม่ใช้เป็นฐานvisualต่อ. [UI-03](product/UI-03-RESET-PROPOSALS.md) เก็บเป็นexplorationhistory. ผู้ใช้เลือก **Soft Monochrome + Selective Glass** จากภาพFastworkแล้ว; มี [UI-04](product/UI-04-SELECTIVE-GLASS.md) P01/P03/F02/H01ในกลุ่มใหม่page1:2 **ผู้ใช้อนุมัติdraftแล้ว (APPROVED_DRAFT / VISUAL_BASELINE)**; ไม่ครอบคลุมหน้าหรือstateที่ยังไม่ได้แสดง ไม่ใช่runtime/usabilityPASSและไม่อนุมัติC1coding. [Component/state contract](product/UI-01-COMPONENT-STATES.md) คงเดิม. [UI-05 component/state pack](product/UI-05-STATE-PACK.md) มี3 local sets/19 variants และ19 state viewsใหม่ อ้าง4 approved viewsเดิม ครบ19 canonical codes; canonical Product/QA review R01 กลับมาครบและเป็น **CHANGES_REQUESTED** ทั้งสองฝ่าย ดู [ผลรวม5ประเด็น: 3Major/2Minor](implementation/evidence/UI-05-REVIEW-R01-CONSOLIDATED.md). R01 findings/รายงานเก็บตามเดิม; ผู้ใช้อนุมัติ **R02 design/spec fixes + fresh-attempt policy** แล้ว ดู [R02 current amendment](product/UI-05-R02-TARGETED-FIXES.md). แก้ draft ในกลุ่มใหม่และ canonical Product/QA targeted retest ครบแล้ว ทั้งสอง READY_FOR_HUMAN_STATE_REVIEW; ดู [R02 review summary](implementation/UI-05-R02-REVIEW-SUMMARY.md). Findingsเดิม RESOLVED_STATIC ในขอบเขตdesign/spec และผู้ใช้รับ UI05R02แล้วตามcurrentapprovalrecord; runtimeC1ยังNOT RUNจนมีexecutionจริง. [Product handoff](handoffs/product-UI-05.md) ชี้currentstartauthorization. อนุมัติเฉพาะC1localimplementation ไม่ใช่cloudresource/deploy/push/publication.

## Ownership
| ผู้รับผิดชอบ | หน้าที่ | ผลลัพธ์/พื้นที่เขียน |
|---|---|---|
| ผู้ใช้ | Product owner, ผู้ตัดสินใจ technical trade-offs, ควบคุม active coding tool/เลือก fallback, อนุมัติ release | คำตัดสินใจและ demo จริง |
| lead-d-setup | Project Lead **และ Coordinator** คนเดียว | task briefs, shared docs, ADR, AI-PROGRESS |
| lead-d-product | Product & UX | docs/product/, docs/handoffs/product-* |
| lead-d-qa | **Senior Tester & Delivery** | docs/qa/, docs/handoffs/qa-* |
| DeepSeek Harness (หลัก) / Antigravity IDE (fallback) | active writer เพียงตัวเดียวทำ implementation/tests/migrations/CI/deploy config | source/test/config ตาม brief ที่อนุมัติ + checkpoint ก่อนสลับ |
| lead-d-impl | Antigravity fallback Operator เท่านั้น; standby จนผู้ใช้เลือก fallback | dispatch/evidence ไม่เขียน app code และไม่ควบคุม primary เอง |

## Cycle
1. **Brief — Lead + ผู้ใช้:** กำหนด outcome เดียว, in/out scope, dependencies, risk, acceptance criteria. Exit: มี task ID และไม่ตัดสินใจแทนผู้ใช้ในเรื่องที่ยังเปิดอยู่
2. **Design & test-first plan — Product + QA:** ทำขนานได้เมื่ออ่าน brief เดียวกัน Product ระบุ flow และ states; QA ระบุ seams/cases/expected outcome โดยยังไม่เขียน test code. Exit: criteria ตรวจได้และมี privacy/security cases
3. **Human approval — ผู้ใช้:** อนุมัติ scope, UI direction, test seams, ค่าใช้จ่ายหรือ deployment ถ้ามี. Lead เปลี่ยน DRAFT → READY
4. **Build — Active coding tool:** ผู้ใช้ส่ง current handoff ให้ DeepSeek Harness เป็นหลัก หรือ Antigravity หลังยืนยัน fallback/checkpoint. เขียน failing test → minimal implementation ทีละ vertical slice; review/refactor เมื่อ tests green. จำกัดเฉพาะ task และ writer เดียว. Exit: diff/commit reference, commands+exit codes, logs, known gaps
5. **QA — Senior Tester:** ตรวจ build ปัจจุบันจริง ไม่เชื่อ self-report อย่างเดียว. Exit: criterion ทุกข้อมี PASS/FAIL/BLOCKED/NOT RUN และหลักฐาน
6. **Fix & retest loop:** QA ส่ง repro → Lead triage → ผู้ใช้ให้ active coding tool แก้ → QA retest และ regression. ทำซ้ำจน critical criteria ผ่าน หรือผู้ใช้ปรับ scope อย่างชัดเจน
7. **Human accept:** ผู้ใช้ทดลองและยอมรับ; Lead เท่านั้นที่ปิดเป็น ACCEPTED. ปัญหา security/data loss/core flow เปิดอยู่ไม่ผ่าน release gate
8. **Evidence & retro:** Lead บันทึก AI contribution, human decision, evidence, limitations และ lesson. เก็บ full commit history; commit ไม่เท่ากับ publish; push/deploy ต้องขอ approval
9. **Next cycle:** เลือกงานต่อไปจาก dependencies ที่พร้อม ไม่เปิดหลาย implementation ที่แก้ไฟล์เดียวกัน

States: DRAFT → READY → BUILDING → QA → ACCEPTED; QA → CHANGES_REQUESTED → BUILDING; BLOCKED ต้องระบุ blocker และเจ้าของ
WIP: implementation หนึ่ง task ต่อครั้งสำหรับ MVP; Product/QA วิจัยหรือออกแบบในพื้นที่ตนขนานได้
ข้อความระหว่าง bots: task ID + concrete ask + allowed files + evidence path; ไม่ส่งบทสนทนาส่วนตัวทั้งฉบับ ไม่ ping-pong acknowledgements
การประสานผ่าน local documents เป็นแหล่งความจริง ไม่พึ่ง bot memory อย่างเดียว

เมื่อส่งมอบคำตอบของ active coding tool หรือรับแจ้ง “DeepSeek/ลุง/ตัวเขียนโค้ดทำเสร็จแล้ว” ใช้ [Result protocol](ANTIGRAVITY-RESULT-PROTOCOL.md) และ [Results index](results/INDEX.md) ตาม task/run/case เดิม ไม่ reset ผลเมื่อเปลี่ยน tool; ไม่แทน independent QA หรือ human gate

## Release definition of done
- ผู้ใช้ใหม่เข้าผ่านมือถือได้จริง; facilitator คุมได้; HR เห็นข้อมูลที่บันทึกจริง
- 30 concurrent simulated participants ผ่านเกณฑ์ที่ตกลง; เก็บจำนวนและ latency จากการรันจริง
- Duplicate/reconnect/restart ไม่ทำคำตอบหายหรือนับซ้ำ; role/session isolation ผ่าน
- บันทึกและอ่านกลับจาก persistent DB ได้ ไม่ใช่ mock chart
- README/setup/environment/deployment ตรงกับการทดลอง; ไม่มี secrets และ private interview PDF ใน public repo
- Live link ทดลอง facilitator+participant ได้, public repository มี full history, unlisted 5–8 minute one-take video เห็นใบหน้าและจอ

## Suggested cycles (ยังไม่ใช่งาน implementation ที่อนุมัติ)
C0: Skills/team/research foundation — รอบนี้
C1: ใช้ active coding tool ทำ local runtime/persistence/realtime proof ตาม C1-01–C1-16; current local-build approval มีผลแล้ว ไม่ใช่ deployment approval
C2: Session create/join + persisted rating + live result เป็น vertical slice แรก
C3: Facilitator control, reconnect, duplicate prevention และ isolation
C4: HR dashboard: response coverage, strengths/gaps และ organisational blockers พร้อมข้อจำกัดข้อมูล
C5: hardening/load/mobile QA, release และ rehearsal/video
