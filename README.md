# Lead+D Lab — Project foundation

สถานะ: C0 setup/research; ยังไม่มี application code หรือ live deployment

## เริ่มอ่าน
1. [ข้อตกลง AI](AGENTS.md)
2. [ทีมและ workflow](docs/TEAM-WORKFLOW.md)
3. [Skills และข้อจำกัด](docs/SKILLS-REGISTER.md)
4. [Stack decision](docs/STACK-DECISION.md) / [Architecture research](docs/ARCHITECTURE-OPTIONS.md)
5. [AI progress สำหรับนำเสนอ](docs/AI-PROGRESS.md)
6. [Product review](docs/product/FOUNDATION-REVIEW.md) / [Senior test plan](docs/qa/FOUNDATION-TEST-PLAN.md)
7. [Antigravity C1 handoff](docs/handoffs/ANTIGRAVITY-C1.md)
8. [Setup verification](docs/SETUP-VERIFICATION.json)

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
