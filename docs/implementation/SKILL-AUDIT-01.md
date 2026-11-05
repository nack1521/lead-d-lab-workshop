# SKILL-AUDIT-01 — ติดตั้ง, โหลด, ใช้ และหลักฐาน

ตรวจเมื่อ 2026-11-05T13:54:26+07:00 โดย lead-d-setup ตามคำขอผู้ใช้ก่อนส่ง R03 ให้ลุง. รอบนี้ **ยังไม่ส่งคำสั่งให้ลุง ไม่เริ่ม build และไม่ติดตั้ง skill เพิ่ม**

## ผลตรวจจริง
- ขอบเขตหลัก: curated project skills ที่ผู้ใช้เคยให้จัดจาก 5 repositories ตาม docs/skills-lock.json ไม่ใช่การอ้างว่าตรวจ bundled/optional skills ทั้งเครื่องครบทุกชุด
- พบ SKILL.md ครบ **12 skills**: Hermes non-coding 7 และ Antigravity coding 5
- คำนวณ SHA-256 จริงของ locked files: **43/43 ตรง** ไม่มีไฟล์หายหรือ hash mismatch
- ตรวจ profile mirror ที่มีอยู่จริงของ lead-d-setup/product/qa/impl รวม **22 copies**: SKILL.md ตรงกับ project source ทุก copy. ไม่แก้ profile อื่น
- เรียก skills_list ของ Coordinator จริง: พบ non-coding ทั้ง 7; เรียก skill_view อ่าน instructions ได้จริงในรอบ audit นี้. การโหลดเพื่อ audit ไม่ถูกนับย้อนเป็นการใช้งานก่อนหน้า
- ตรวจ SQLite แบบ read-only เฉพาะ project sessions ของ 4 profiles และเฉพาะ skill_view metadata; ตัดประวัติก่อน user request เวลา **2026-11-05T13:50:00+07:00** จึงไม่ปน audit-only calls ใหม่. ไม่ export บทสนทนา, auth/config หรือ raw tool output
- หลักฐานเครื่องอ่าน: [audit.json](evidence/SKILL-AUDIT-01/audit.json)

## นิยามสถานะ
1. **Installed:** ไฟล์อยู่จริงและตรง manifest
2. **Discovered/read-loaded:** host แสดงชื่อและอ่าน instruction ได้จริง ไม่เท่ากับทำงานตามทุกขั้นตอน
3. **Applied:** มีชิ้นงาน/วิธีดำเนินงานที่ตรวจเชื่อมกับ skill ได้
4. **Runtime-verified:** มี execution evidence ของ behavior จริง เช่น RED/GREEN ไม่ใช่ข้อความว่ารองรับ

ประวัติที่ค้นไม่พบหมายถึง “ไม่พบในขอบเขต retained project-session records ที่ตรวจ” ไม่ใช่คำยืนยันว่าไม่เคยใช้. สอง tool results ของ writing-for-agents ใน Coordinator จับคู่/parse เป็น JSON ไม่ได้ จึงไม่ใช้เป็นหลักฐาน success

## Hermes non-coding: 7 skills
| Skill | Installed/current Coordinator loader | หลักฐานก่อน audit | ใช้เมื่อใดต่อไป |
|---|---|---|---|
| writing-for-agents | ผ่าน | พบ successful/unchanged loader results: setup4, product5, qa1; ใช้จัด AGENTS/protocol/docs ในงานก่อนหน้าและรอบนี้ | ทุกครั้งที่เขียนหรือแก้ instructions/AGENTS/skill |
| ponytail-review | ผ่าน | พบ setup3, product1, qa5; มี Coordinator R01/R02 review และ QA reports ประกอบ ไม่ใช่ runtime PASS | review correctness/security/ความเล็กของข้อเสนอและ diff |
| handoff | ผ่าน | พบ Product loader success1 จากประวัติ; เป็นหลักฐานโหลด ไม่ยืนยันทุกขั้นตอนของการสร้าง handoff | ส่งต่อ task/context; ใส่ suggested skills และชี้ canonical artifacts |
| grill-me | ผ่าน | ไม่พบ pre-audit invocation ใน records ที่ตรวจ; รอบนี้อ่านเพื่อ audit เท่านั้น | entry point ไป grilling เมื่อมี decisions ที่ควรถาม ไม่เรียกซ้ำเป็น interview อีกชุด |
| grilling | ผ่าน | ไม่พบ pre-audit invocation; รอบนี้อ่านเพื่อ audit เท่านั้น | stress-test เฉพาะ decision ที่ยังไม่ตกลงใน current cycle; facts ให้ค้นเอง |
| to-tickets | ผ่าน | ไม่พบ pre-audit invocation; ยังไม่ยืนยันว่ามี ticket breakdown ที่เกิดจาก skill | แบ่ง approved plan เป็น vertical slices พร้อม blockers; ยังคงถามยืนยัน breakdown ตาม skill |
| caveman | ผ่าน | ไม่พบ pre-audit invocation; ไม่มีหลักฐาน tracked persistent voice mode | ใช้ concise Thai เมื่อเหมาะ ไม่ตัดหลักฐาน/คำเตือนและไม่เปิด proxy/CLI/global routing |

## Antigravity: 5 skills
ทุกชุดมีไฟล์จริงและผ่าน locked hashes. C1 source report อ้าง discovery/activation ทั้ง 5 แต่ Coordinator ยังไม่มี independent IDE activation trace จึงบันทึก **SELF_REPORTED / UNVERIFIED** ไม่อ้างว่าใช้ครบแล้ว. รอบนี้ Coordinator อ่าน instructions เพื่อ audit เท่านั้น ไม่ทำ coding แทนลุง

| Skill | การใช้จริงที่พิสูจน์ได้ ณ audit | เหมาะกับขั้นตอนใด |
|---|---|---|
| ponytail | ยังไม่มี independent trace ของการ apply ใน IDE; ไม่ใช้ข้อความ “activate แล้ว” แทนหลักฐาน | เหมาะทันทีใน R03 เพราะเป็นการเลือก dependency set ที่เล็กและเข้ากันได้ |
| codebase-design | ยังไม่ยืนยันการใช้กับ implementation จริง | เมื่อกำหนด module interfaces/test seams หรือปรับโครงสร้าง; ไม่ต้องสร้าง architecture เพิ่มในงานเช็ก registry |
| tdd | **NOT RUN** สำหรับ RED/GREEN ของแอป เพราะยังไม่อนุมัติ build | หลังอนุมัติ C1: failing behavior test → minimal implementation → regression/review; setup/install error ไม่ใช่ business RED |
| diagnosing-bugs | ยังไม่ยืนยันว่าผ่าน diagnosis loop กับ bug ของแอป | เมื่อมี failing behavior จริง: reproduce/tight loop → hypothesis/probe → fix/regression; ไม่เดา root cause จาก error อย่างเดียว |
| unslop | ไม่มีหลักฐาน UI polish runtime; UI implementation ยังไม่มี | เมื่อมีหน้าจอที่ต้อง audit/polish: ใช้ audit/direction ก่อนแก้ตาม visual gate; ไม่เรียก snapshot/story helpers ที่ไม่ได้ติดตั้ง |

**Cursor/plugins:** deferred/ไม่ได้ติดตั้งตาม register เพราะพึ่ง Cursor-specific agents/CLI. Approval ใช้ skills ที่ติดตั้งอยู่ไม่ถูกตีความเป็นให้ติดตั้งชุดนี้เพิ่มหรือข้าม compatibility review

## Standing approval ของผู้ใช้
ผู้ใช้อนุมัติเมื่อ 2026-11-05: ใช้ทุก skill ที่ติดตั้งอยู่เมื่อเหมาะกับขั้นตอนนั้นได้โดยไม่ต้องถามอนุญาตใช้ซ้ำ. เลือกจาก trigger และสิ่งที่ต้องทำจริง ไม่เปิดทุก skill ทุก task และไม่สร้างงานเพื่อให้ดูว่าใช้ครบ

บันทึกกติกาใน AGENTS.md และ SKILLS-REGISTER.md แล้ว; result protocol เพิ่ม skill_usage สำหรับรอบใหม่ ให้แยก read-loaded/activated-with-evidence/applied-to และระบุหลักฐาน/ข้อจำกัด. ไม่ rewrite R01/R02 ให้ดูว่าเคยมี evidence ที่ไม่มีจริง

คำอนุมัตินี้ไม่เปลี่ยน scope ของแต่ละบทบาท ไม่อนุมัติ build/install/deploy/push/paid services/destructive operations หรือ optional upstream helpers โดยอัตโนมัติ. ไม่เปลี่ยน bundled/default/ทีมเอกสาร profiles และไม่แก้ curated skill files/locks ในรอบนี้

## Gate ก่อนส่งงานต่อ
- พร้อมด้าน instruction availability ของ Coordinator และความครบของ project files
- ยังไม่รับรอง IDE activation ทั้ง 5 หรือ runtime ของ app; ให้ลุงรอบถัดไปอ่าน AGENTS/result protocol และบันทึก skill_usage พร้อม actual read/activation evidence เฉพาะที่มีจริง. ถ้า host ไม่มี activation event ให้ระบุ READ_LOADED ไม่เดา
- R03 เหมาะกับ ponytail ฝั่ง IDE; Hermes ใช้ writing-for-agents/handoff/ponytail-review ตามงานจริง. TDD/debug/UI polish ใช้เมื่อถึงพฤติกรรมของตน ไม่ใช่ blocker ให้ทำ preflight ซ้ำทุกข้อ
- ยังไม่ส่ง R03 ตามที่ผู้ใช้ขอให้ตรวจ skills ก่อน. Build approval และ findings REV-05/06/07 คงเดิม

## AI progress รอบนี้
Request: ตรวจ skills ที่เคยจัดและบันทึก standing approval. AI contribution: manifest/hash/mirror verification, runtime loader checks, pre-audit metadata scan, applicability mapping และ durable project rules. Human decision: อนุมัติใช้ skill ที่เกี่ยวข้องโดยไม่ขอซ้ำ แต่ยังไม่มี local-build approval. หลักฐานอยู่ audit.json; docs/AI-PROGRESS.md และ handoff ที่มี pending work เดิมไม่ถูกแก้ทับ

## Sources
- docs/SKILLS-REGISTER.md และ docs/skills-lock.json; local SKILL.md ของ 12 ชุด
- https://hermes-agent.nousresearch.com/docs/user-guide/features/skills — on-demand loading/progressive disclosure
- C1-PREFLIGHT-FOLLOWUP/R01/source-report.md §1.3 — IDE self-report ไม่ใช่ independent trace
