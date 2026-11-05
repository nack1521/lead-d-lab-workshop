# Results index — อ่านไฟล์นี้ก่อนเมื่อ “ลุงทำเสร็จแล้ว”

Paths ในตารางเริ่มจาก repository root. Latest run คือผลรอบล่าสุดที่บันทึกครบ ไม่ได้หมายถึง accepted/PASS. อ่านสรุป JSON ก่อน แล้วอ่าน detail/evidence เฉพาะเคสตาม [protocol](../ANTIGRAVITY-RESULT-PROTOCOL.md)

| Task | Latest run | Producer / provenance | Status | Summary JSON | Detail | Next gate |
|---|---|---|---|---|---|---|
| C1-PREFLIGHT-FOLLOWUP | R01 | lead-d-setup นำเข้าคำตอบลุงจาก user paste และ static review | CHANGES_REQUESTED | docs/results/C1-PREFLIGHT-FOLLOWUP/R01/result.json | docs/results/C1-PREFLIGHT-FOLLOWUP/R01/result.md | ลุงอ่าน protocol และตอบ findings ใน R02 แบบเอกสาร; ผู้ใช้ตัดสินใจก่อน build |

สถานะการตั้งกติกา: บันทึกใน repo แล้ว แต่ยังไม่มี acknowledgement ว่า IDE conversation ปัจจุบันอ่านแล้ว. รอบ R01 เป็น imported report ไม่ใช่การอ้างว่าลุงเขียน result ลงดิสก์เอง. Runtime C1-01–C1-16 ยัง NOT RUN ทั้งหมด

Legacy Operator evidence OP-00/OP-00B/OP-01 อยู่ docs/implementation/ ตามเดิม; ไม่ใช่ C1 runtime results และไม่ rewrite history
