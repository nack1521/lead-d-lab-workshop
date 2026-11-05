# WF-01-R1 — Targeted retest findings 1–2

ผู้ตรวจ: Senior Tester & Delivery (`lead-d-qa`) | เวลาบันทึก: 2026-11-05 07:53:40 +0700

| Finding จาก review เดิม | ผล | หลักฐานที่ตรวจจริง |
|---|---|---|
| 1. retry/key และ payload กำกวม | RESOLVED — ระดับ design/spec เท่านั้น | อ่าน `docs/product/evidence/WF-01-R1/readback-final.json:79–85` และโหลดภาพจริง `participant-final.png` พร้อม crop P07/P08: P07 ระบุ retry ไม่แก้ใช้ key และ payload เดิม; หลังแก้ใช้ key ใหม่ได้เมื่อยืนยันว่าเดิมถูกปฏิเสธหรือไม่บันทึกและคำถามยังเปิด; P08 ระบุ unknown ห้ามส่งอัตโนมัติหรือสร้าง key ใหม่. `docs/product/WF-01-R1-DELIVERY.md:39–43` ระบุ contract เพิ่มว่า non-save ต้องเป็น terminal ไม่ใช่ GET ไม่พบชั่วคราว; same key/different payload ต้องปฏิเสธ และต้อง reconcile in-flight ก่อนแก้/ส่งใหม่ |
| 2. whitespace-only และห้ามตัดเงียบ | RESOLVED — ระดับ design/spec เท่านั้น | ภาพจริง crop P01/P03/P04 แสดงว่าง/ช่องว่างล้วนเท่ากับไม่กรอก; P01 ระบุเกิน 40 แจ้งใต้ช่องไม่ตัดเงียบ; P03/P04 ระบุเกิน 500 แจ้งใต้ช่องไม่ตัดเงียบ. Read-back `:54–77` ยืนยัน helper nickname component/instance `18:28`, `I18:29;18:28` และ comment component/instance `18:38`, `I18:39;18:38` พร้อม annotations `7:61`, `7:73` |

หลักฐาน: `readback-final.json` ระบุว่า parse จาก MCP returns ของ Coordinator, read-back request `d801c3ef-8484-42e6-af92-f7773002acad`, screenshot request `24aca68f-be5a-4926-bde5-58a798ea1df3`; QA อ่านไฟล์และโหลดภาพ ไม่ได้เรียก Figma สด. Read-back ระบุ 19 screens / 350 nodes และ overflow/overlaps ว่าง แต่ bounds ไม่พิสูจน์ internal clipping หรือ accessibility ทั้งหมด

ข้อจำกัด: การทดสอบ actual inline error variants, Unicode/IME และ mobile runtime ยัง NOT RUN; ไม่ใช่ runtime PASS และไม่พิสูจน์ server contract/atomicity จริง. `docs/qa/WF-01-R1-DESIGN-REVIEW.md` คงไว้เป็นประวัติ ไม่แก้ย้อนหลัง; ยังมีข้อจำกัด scope/global styles ก่อน–หลังจาก review เดิม. ไม่ได้แก้ Figma/app/เอกสารอื่น หรือใช้ git/install
