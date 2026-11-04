# WF-01 — Targeted design retest

ผู้ตรวจ: lead-d-qa | เวลาบันทึก: 2026-11-04 17:38:04 +0700
ขอบเขต: ตรวจซ้ำเฉพาะ findings 1–2 จาก `docs/qa/WF-01-DESIGN-REVIEW.md` บน design artifacts ไม่ใช่ full review หรือการทดสอบแอป

| Finding | ผล retest | หลักฐานและข้อสังเกต |
|---|---|---|
| 1. จำนวน participant screens ขัดกัน | RESOLVED — ระดับ design artifact | `docs/product/evidence/WF-01/structure.json:339–342,367` แสดง P=10, F=6, H=3 และ screenCount=19; read-back summary `qa-fix-readback.json:14–30` แสดงจำนวนเดียวกัน รวม 19 ตรงกัน ตามข้อมูลผู้ใช้แก้ตัวนับโดย anchored role code regex; รอบนี้ QA อ่านผลที่แก้แล้ว ไม่ได้รัน regex ซ้ำหรือนับ node ใหม่ |
| 2. closed/reconnect ไม่แยกผลคำตอบ | RESOLVED — ระดับ design artifact | โหลดภาพจริง `participant-after-fix.png` และ crop P08/P09 ด้วย `vision_analyze`; P08 node `7:113` ระบุตรวจคำตอบเดิม, ห้องปิดไป P09 พร้อมผลตรวจ, unknown ให้ตรวจใหม่ และห้ามส่งซ้ำอัตโนมัติหรือแสดง saved โดยไม่ยืนยัน. P09 node `7:126` แยกยืนยันบันทึกแล้ว / ยืนยันไม่มีคำตอบ / ยังตรวจไม่ได้ และระบุว่าห้องปิดไม่เท่ากับคำตอบสำเร็จหรือล้มเหลว. ข้อความตรงกับ read-back nodes `7:124`, `7:136` ใน `qa-fix-readback.json:31–43` |

## ที่มาและข้อจำกัด

- `qa-fix-readback.json` ระบุว่าเป็น summary ที่ Coordinator ถอดจาก Figma MCP returns ไม่ใช่ raw API output; mutation request `7d2608d7-c1fb-4fba-a4e0-d6536f7d27a5`, read-back request `1a2cd083-6151-467e-8582-55aa9dc83b67`, screenshot request `87259255-1668-4893-b73a-b0d95fa931f3`. QA อ่านไฟล์ summary และภาพ ไม่ได้เรียก Figma สด
- รายงานเดิมคงไว้เป็นหลักฐานประวัติ ไม่แก้ย้อนหลัง ผลนี้ไม่ลบข้อจำกัด scope: ยังไม่มีภาพ/property comparison ก่อน–หลังครบถ้วนหรือ global-style/library audit; `selectedScreenBoundsOverflow` ว่างเฉพาะ bounds ของ P08/P09 ไม่พิสูจน์ว่าไม่มี clipping ทุกชนิด
- ผล resolved ใช้เฉพาะ design artifact และ annotation ไม่ยืนยัน prototype หรือพฤติกรรมแอปจริง ไม่อ้าง runtime PASS; ผู้ใช้เป็นผู้ review/ตัดสินใจ และ Coordinator รวมผล delivery ต่อไป
- ไม่ได้แก้ Figma, ติดตั้ง, ใช้ git หรือแก้ application code; งานนี้สร้างเฉพาะรายงาน retest ฉบับนี้
