# Skill register — reviewed local snapshot

## ผลการจัดชุด
ตรวจ README และ instructions ของ candidates จาก repository ทั้ง 5; สำเนา upstream อยู่ `.research/upstream/` (ไม่อยู่ใน auto-discovery และถูก gitignore)
เลือก 12 third-party skills: 7 non-coding ใน `.hermes/skills` และ 5 coding ใน `.agents/skills` ตามรายการ `skills-lock.json`
การตรวจนี้เป็น instruction/dependency/scope review ไม่ใช่ security certification ของทุกไฟล์หรือการพิสูจน์ผล benchmark ของผู้ขาย
ไม่รัน installer, hooks, proxy, telemetry, cloud routing หรือ executable helper จาก upstream

| Repository | ใช้จริง | เหตุผล/สถานะ |
|---|---|---|
| mattpocock/skills | grill-me, grilling, handoff, writing-for-agents, to-tickets; tdd, codebase-design, diagnosing-bugs | เก็บ decision, ส่งงาน, แบ่ง vertical slice และรักษา test/debug discipline |
| JuliusBrussee/caveman | caveman instruction-only, optional | ไม่ติดตั้ง CLI/proxy/routing/telemetry; ไม่เปิด ultra/megacave และไม่อ้าง token savings ที่ไม่ได้วัด |
| DietrichGebert/ponytail | ponytail ฝั่ง IDE; ponytail-review ฝั่ง Hermes | คุม scope และ review correctness ก่อนความสั้น; ไม่มี hooks/statusline/dashboard |
| cursor/plugins | **deferred — ไม่ติดตั้ง** | ตรวจ agent-compatibility แล้วพึ่ง named Cursor subagents/CLI; ไม่คัดลอกมาหลอกว่าทำงานใน Antigravity; MVP ยังไม่มี repo/app ให้ scan |
| heydamir/unslop | unslop ฝั่ง IDE | เก็บ instructions/references/artwork พร้อมเครดิต CC BY 4.0; ตัด executable snapshot/story helpers และ host-specific metadata; ดู PROJECT-SAFETY.md |

## Adaptations ที่มีเหตุผล
- handoff: แก้ OS temp เป็น `docs/handoffs/` ตามขอบเขตผู้ใช้
- to-tickets: local tracker ที่ `docs/tasks/`, ไม่มี setup dependency หรือ external publishing โดยอัตโนมัติ
- grill-me: ใช้ host skill loader/read-file แทนชื่อ tool เฉพาะ platform และยึด decisions เฉพาะ current cycle
- ponytail-review: รายงานภาษาไทย; findings เท่านั้น ไม่แก้โค้ด
- tdd: review gate อ้าง ponytail-review ที่ติดตั้งแล้ว; codebase-design dependency ถูกจัดมาด้วย
- unslop: ใส่ project safety pointer และระบุ helper scripts ที่ไม่ได้ติดตั้ง; mock design ห้ามใช้แทน runtime evidence; video story ไม่ใช่วิดีโอส่งสัมภาษณ์
- แยก TDD เป็น primary methodology, Ponytail เป็น simplicity constraint; ไม่เปิดทุก skill ทุก task

## Host compatibility
Hermes CLI `skills trust <project>` รายงาน 12 project skills สำหรับทั้ง 3 profiles แต่ smoke test ผ่าน canonical Bot Chat พบว่า skills_list ยังไม่เห็น project-local skills. ไม่ถือ trust output เป็น runtime proof
แก้โดยติดตั้งสำเนา non-coding เฉพาะบทบาทที่ `~/.hermes/profiles/<profile>/skills/lead-d/`:
- lead-d-setup: grill-me, grilling, handoff, writing-for-agents, to-tickets, caveman, ponytail-review
- lead-d-product: grill-me, grilling, handoff, writing-for-agents, caveman
- lead-d-qa: handoff, ponytail-review, caveman
ทดสอบซ้ำจริง: Product skills_list พบครบชุดและ skill_view handoff ยืนยัน docs/handoffs; QA พบครบชุดและ skill_view ponytail-review ยืนยันภาษาไทย/changes no code
Project copy เป็น source of truth; profile mirrors ต้อง sync หลัง review การแก้ไข พร้อมตรวจ hash ไม่ปล่อยให้ drift
Hermes มี built-in `/handoff` ชนชื่อ: ใช้ `/skill handoff` หรือ skill_view(name="handoff") ไม่ใช่ slash alias `/handoff`
มี project workflow skill เพิ่มใน profile Coordinator ชื่อ lead-d-workshop-cycle (ไม่ใช่หนึ่งใน 12 third-party skills)
Hermes ค้นพบทั้ง `.hermes/skills` และ `.agents/skills`; การแยกโฟลเดอร์ไม่ใช่ security sandbox ข้อจำกัด non-coding อยู่ใน AGENTS.md และ SOUL ของ bots
Antigravity docs ระบุ project skill path `.agents/skills/` และรองรับ `.agent/skills/` แบบ legacy; จัดไฟล์ตาม docs แล้ว แต่ยังไม่ได้ยืนยันว่า IDE ที่ติดตั้งอยู่โหลดและใช้ได้จริง
การทดสอบใน IDE: เปิด workspace นี้ → Customizations → ตรวจ tdd/codebase-design/diagnosing-bugs/ponytail/unslop → ให้รายงานชื่อ skill และ path โดยยังไม่แก้ source code

## Use and update policy
- Skills โหลดเมื่อเกี่ยวข้องเท่านั้น; ลูกบอต non-coding ไม่เขียนโค้ดแม้ skill เรียกให้ทำ
- ตรวจ helper script ก่อนรันทุกครั้ง โดยเฉพาะ network access, file deletion และ output path; คำสั่ง optional helpers ใน upstream ไม่ใช่ approval
- ไม่ติดตั้ง global และไม่แก้ default/ทีมเอกสาร profiles
- เก็บ commit SHA และ SHA-256 ใน `skills-lock.json`; upstream เปลี่ยนต้อง review diff แล้ว update lock ไม่ auto-update
- เก็บ UPSTREAM-LICENSE ทุกชุด; Unslop credit: Damir Sokolovsky (@heydamir), https://github.com/heydamir/unslop, CC BY 4.0
- Caveman NOTICE เก็บใน skill directory; โค้ด runtime/engine ที่อ้างใน NOTICE ไม่ได้ติดตั้ง

Sources: https://antigravity.google/docs/ide/skills/ ; https://hermes-agent.nousresearch.com/docs/user-guide/profiles ; upstream URLs+commits ใน skills-lock.json
