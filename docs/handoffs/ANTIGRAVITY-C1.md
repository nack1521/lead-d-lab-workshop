# Antigravity C1 — preflight และ runtime spike brief

สถานะ: backend stack เลือกแล้วตาม docs/STACK-DECISION.md; implementation spike ยังรอยืนยัน scope/test seams และพร้อมเครื่องมือ
Workspace: /Users/aiink/Nack/Lead+D-Lab
เจ้าของ: ผู้ใช้; Coordinator: lead-d-setup

## ขั้นที่ทำได้ก่อน coding เมื่อผู้ใช้เปิด IDE
อ่าน AGENTS.md, docs/TEAM-WORKFLOW.md, docs/SKILLS-REGISTER.md และ docs/ARCHITECTURE-OPTIONS.md
ตรวจ Customizations/skill discovery ว่าพบ tdd, codebase-design, diagnosing-bugs, ponytail และ unslop จาก .agents/skills
รายงานชื่อ/path ที่อ่านได้จริง ถ้าไม่พบอย่าแก้ global IDE configuration ให้แจ้ง blocker
ขณะนี้ไม่รัน upstream helper scripts, ไม่ deploy, ไม่ push, ไม่ติดตั้ง credentials; stack ที่เลือกคือ React Cloudflare + Elysia/Bun Railway + PostgreSQL ไม่มี Redis/BullMQ ก่อน implementation ให้ยืนยัน local tooling และ test seams กับผู้ใช้

## หลังเลือก stack และอนุมัติ spike
เป้าหมาย: พิสูจน์ runtime + persistence + WebSocket โดยใช้ระบบเล็กที่สุด ไม่สร้าง dashboard สวยก่อนรู้ว่าฐานทำงาน
- บันทึก exact runtime/dependency versions และ lockfile
- รองรับ native Bun + Docker PostgreSQL เป็นโหมดหลัก และ Docker-only สำหรับ fresh clone ตาม docs/REPRODUCIBLE-SETUP-REQUIREMENTS.md; ต้องทดสอบทั้งสอง ไม่อ้างจาก README อย่างเดียว
- local health route, DB migration/insert/read, WebSocket subscribe/broadcast ระหว่าง client แยกกัน
- restart backend แล้วอ่านข้อมูลที่ commit กลับได้
- rejected duplicate และ reconnect snapshot/version ทดสอบได้
- production build frontend และ deep-link routing ใช้ได้
- ทดสอบ topology ที่เลือก: direct CORS หรือ same-origin proxy; HTTP OPTIONS/error + WS Origin rejection
- วาง test seam ให้ผู้ใช้ยืนยันก่อนเขียน failing tests ตาม tdd
- ส่ง source diff, test commands/exit codes, environment ที่ไม่เป็น secret, evidence และ known limitations

Scope: implementation ทั้งหมดทำใน Antigravity IDE; Hermes review/spec/test execution จากเครื่องมือที่มีอยู่เท่านั้น
Cloud verification เป็น gate ถัดไปหลังผู้ใช้อนุมัติ provider/account/ค่าใช้จ่าย ไม่สร้างทรัพยากรเพียงเพราะ brief นี้กล่าวถึง deployment
