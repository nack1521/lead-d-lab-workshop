# Lean team — Cycle-based workflow

สถานะ: ทีม A/stack ตาม docs/STACK-DECISION.md; ผู้ใช้ยืนยัน flow WF-01-R1 เป็น baseline แล้ว และให้เตรียม C1 handoff สำหรับ IDE read-only preflight. Scope Figma ยังคง page1:2; ไม่มี approval ให้เขียนหน้าอื่น, เริ่ม app implementation โดยอัตโนมัติ หรือสร้าง cloud resource/deploy. Public repository ใช้ตาม approval เดิม

## Ownership
| ผู้รับผิดชอบ | หน้าที่ | ผลลัพธ์/พื้นที่เขียน |
|---|---|---|
| ผู้ใช้ | Product owner, ผู้ตัดสินใจ technical trade-offs, ควบคุม Antigravity, อนุมัติ release | คำตัดสินใจและ demo จริง |
| lead-d-setup | Project Lead **และ Coordinator** คนเดียว | task briefs, shared docs, ADR, AI-PROGRESS |
| lead-d-product | Product & UX | docs/product/, docs/handoffs/product-* |
| lead-d-qa | **Senior Tester & Delivery** | docs/qa/, docs/handoffs/qa-* |
| Antigravity IDE | implementation ทั้งหมดรวม tests, migrations, CI/deploy config | source/test/config ตาม brief ที่อนุมัติ |

## Cycle
1. **Brief — Lead + ผู้ใช้:** กำหนด outcome เดียว, in/out scope, dependencies, risk, acceptance criteria. Exit: มี task ID และไม่ตัดสินใจแทนผู้ใช้ในเรื่องที่ยังเปิดอยู่
2. **Design & test-first plan — Product + QA:** ทำขนานได้เมื่ออ่าน brief เดียวกัน Product ระบุ flow และ states; QA ระบุ seams/cases/expected outcome โดยยังไม่เขียน test code. Exit: criteria ตรวจได้และมี privacy/security cases
3. **Human approval — ผู้ใช้:** อนุมัติ scope, UI direction, test seams, ค่าใช้จ่ายหรือ deployment ถ้ามี. Lead เปลี่ยน DRAFT → READY
4. **Build — Antigravity IDE:** ผู้ใช้ส่ง handoff ให้ IDE เขียน failing test → minimal implementation ทีละ vertical slice; review/refactor เมื่อ tests green. จำกัดการแก้เฉพาะ task. Exit: diff/commit reference, commands+exit codes, logs, known gaps
5. **QA — Senior Tester:** ตรวจ build ปัจจุบันจริง ไม่เชื่อ self-report อย่างเดียว. Exit: criterion ทุกข้อมี PASS/FAIL/BLOCKED/NOT RUN และหลักฐาน
6. **Fix & retest loop:** QA ส่ง repro → Lead triage → ผู้ใช้ให้ Antigravity แก้ → QA retest และ regression. ทำซ้ำจน critical criteria ผ่าน หรือผู้ใช้ปรับ scope อย่างชัดเจน
7. **Human accept:** ผู้ใช้ทดลองและยอมรับ; Lead เท่านั้นที่ปิดเป็น ACCEPTED. ปัญหา security/data loss/core flow เปิดอยู่ไม่ผ่าน release gate
8. **Evidence & retro:** Lead บันทึก AI contribution, human decision, evidence, limitations และ lesson. เก็บ full commit history; commit ไม่เท่ากับ publish; push/deploy ต้องขอ approval
9. **Next cycle:** เลือกงานต่อไปจาก dependencies ที่พร้อม ไม่เปิดหลาย implementation ที่แก้ไฟล์เดียวกัน

States: DRAFT → READY → BUILDING → QA → ACCEPTED; QA → CHANGES_REQUESTED → BUILDING; BLOCKED ต้องระบุ blocker และเจ้าของ
WIP: implementation หนึ่ง task ต่อครั้งสำหรับ MVP; Product/QA วิจัยหรือออกแบบในพื้นที่ตนขนานได้
ข้อความระหว่าง bots: task ID + concrete ask + allowed files + evidence path; ไม่ส่งบทสนทนาส่วนตัวทั้งฉบับ ไม่ ping-pong acknowledgements
การประสานผ่าน local documents เป็นแหล่งความจริง ไม่พึ่ง bot memory อย่างเดียว

## Release definition of done
- ผู้ใช้ใหม่เข้าผ่านมือถือได้จริง; facilitator คุมได้; HR เห็นข้อมูลที่บันทึกจริง
- 30 concurrent simulated participants ผ่านเกณฑ์ที่ตกลง; เก็บจำนวนและ latency จากการรันจริง
- Duplicate/reconnect/restart ไม่ทำคำตอบหายหรือนับซ้ำ; role/session isolation ผ่าน
- บันทึกและอ่านกลับจาก persistent DB ได้ ไม่ใช่ mock chart
- README/setup/environment/deployment ตรงกับการทดลอง; ไม่มี secrets และ private interview PDF ใน public repo
- Live link ทดลอง facilitator+participant ได้, public repository มี full history, unlisted 5–8 minute one-take video เห็นใบหน้าและจอ

## Suggested cycles (ยังไม่ใช่งาน implementation ที่อนุมัติ)
C0: Skills/team/research foundation — รอบนี้
C1: ตัดสินใจ stack และให้ Antigravity ทำ runtime/deployment compatibility spike ใน local ก่อน
C2: Session create/join + persisted rating + live result เป็น vertical slice แรก
C3: Facilitator control, reconnect, duplicate prevention และ isolation
C4: HR dashboard: response coverage, strengths/gaps และ organisational blockers พร้อมข้อจำกัดข้อมูล
C5: hardening/load/mobile QA, release และ rehearsal/video
