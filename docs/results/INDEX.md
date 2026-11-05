# Results index — อ่านไฟล์นี้ก่อนเมื่อ “ลุงทำเสร็จแล้ว”

Paths ในตารางเริ่มจาก repository root. Latest run คือผลรอบล่าสุดที่บันทึกครบ ไม่ได้หมายถึง accepted/PASS. อ่านสรุป JSON ก่อน แล้วอ่าน detail/evidence เฉพาะเคสตาม [protocol](../ANTIGRAVITY-RESULT-PROTOCOL.md)

| Task | Latest run | Producer / provenance | Status | Summary JSON | Detail | Next gate |
|---|---|---|---|---|---|---|
| C1-PREFLIGHT-FOLLOWUP | R02 | Antigravity IDE (Direct IDE response) | READY_FOR_REVIEW | docs/results/C1-PREFLIGHT-FOLLOWUP/R02/result.json | docs/results/C1-PREFLIGHT-FOLLOWUP/R02/result.md | ผู้ใช้พิจารณาและอนุมัติ technical choices / local build |

สถานะการตั้งกติกา: Antigravity ใน IDE อ่าน AGENTS.md และ protocol แล้ว บันทึกรอบ R02 ลงดิสก์จริงโดยตรง; Runtime C1-01–C1-16 ยัง NOT RUN ทั้งหมด

Coordinator review ของ **R02**: **CHANGES_REQUESTED** — ดู [ผลตรวจแยกจาก producer](../implementation/C1-PREFLIGHT-R02-COORDINATOR-REVIEW.md). ต้องแก้ REV-05 (Vite/plugin peer), REV-06 (PostgreSQL security minor) และแก้ provenance REV-07 ใน R03 ก่อนขอเริ่ม build; runtime ทุกเคสยัง NOT RUN

Legacy Operator evidence OP-00/OP-00B/OP-01 อยู่ docs/implementation/ ตามเดิม; ไม่ใช่ C1 runtime results และไม่ rewrite history
