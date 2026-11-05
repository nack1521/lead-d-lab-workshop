# WF-01-R1 — Targeted design review

ผู้ตรวจ: Senior Tester & Delivery (`lead-d-qa`) | เวลาบันทึกจากเครื่อง: 2026-11-05 07:50:15 +0700

What this change does: เพิ่ม nickname ที่ไม่บังคับในหน้า join และข้อความประกอบแบบหลายบรรทัดที่ไม่บังคับในหน้าตอบ พร้อมปรับคำอธิบายสถานะและความเป็นส่วนตัวในหน้าที่เกี่ยวข้อง การตรวจนี้จำกัดเฉพาะ revision WF-01-R1 ไม่ใช่ full review รอบเดิม

## หลักฐาน

- อ่าน `docs/handoffs/product-WF-01-R1.md` และ `docs/product/evidence/WF-01-R1/readback.json` ซึ่งระบุว่าเป็นผล Figma MCP ที่ Coordinator parse มา; read-back request `f066ccb4-1e2b-4dc1-857b-1fdc88785579` ไม่ใช่การเรียก Figma สดโดย QA
- โหลดภาพจริง `docs/product/evidence/WF-01-R1/participant.png`, `facilitator.png`, `hr-summary.png` ด้วย `vision_analyze`; crop ภาพ participant เพื่อดู P01/P03/P04 และ P07/P08 เพิ่มเติม
- Read-back ระบุ page `1:2`, root `7:2`, 19 screens (P10/F6/H3) และ 350 nodes; เป็นตัวเลขจาก read-back ไม่ใช่การนับสดโดย QA
- OBSERVED หมายถึงพบในภาพ/ข้อมูล read-back ที่ระบุเท่านั้น; PARTIAL คือมีหลักฐานบางส่วนหรือ spec ยังไม่ครบ; NOT REVIEWED คือไม่มีหลักฐานพอ ผลทั้งหมดเป็น design review ไม่ใช่ runtime PASS

## Concrete findings

### Must fix ก่อนส่งเป็น implementation specification

1. **P07 ยังไม่แยก identity ของ unchanged retry กับ edited new submission** — severity: High สำหรับความเสี่ยงด้าน correctness ของ specification; ยังไม่ใช่ข้อบกพร่อง runtime ที่พิสูจน์แล้ว. อ้างอิง P07 `7:99`, text `7:106` และ `7:112`, P08 `7:113` / `7:124`, `participant.png`, `readback.json:362–379`.
   - P07 ระบุแก้ draft ได้เมื่อยืนยันไม่บันทึกและยังเปิดรับ พร้อมระบุ “retry เดิมทั้งชุด ไม่สร้างคำตอบซ้ำ” แต่ไม่ได้แยกกติกา idempotency key เมื่อผู้ใช้แก้คะแนนหรือข้อความแล้วส่งอีกครั้ง
   - หากใช้ key เดิมกับ payload ที่เปลี่ยน server อาจปฏิเสธหรือคืนผลของคำขอเดิม; หากสร้าง key ใหม่ขณะผลเดิมยัง unknown อาจเกิดคำตอบซ้ำ ทั้งสองเป็นความเสี่ยงจากความกำกวม ไม่ใช่ผลทดสอบจริง
   - ข้อเสนอ: ระบุ unchanged retry ใช้ submission/key เดิมและ payload เดิม; แก้ไขและสร้าง submission/key ใหม่ได้เฉพาะหลังยืนยันว่ารายการเดิมถูกปฏิเสธ/ไม่ถูกบันทึกและคำถามยังเปิด; unknown ต้อง reconcile ก่อน ไม่ส่งซ้ำอัตโนมัติหรือสร้าง key ใหม่ โดย contract ฝั่ง server ต้องตรวจ mismatch และ atomicity

### Should fix

2. **กติกาข้อความที่มีแต่ช่องว่างยังไม่ปรากฏใน read-back ของช่อง** — severity: Medium; อ้างอิง P01 `7:19`, P03 `7:46`, P04 `7:62`, field text `18:28`, `18:38` และ `I18:39;18:38` ใน `readback.json:234–322`; handoff ข้อ 9.
   - ป้ายบอกเว้นว่างได้และแสดงขีดจำกัด แต่ข้อความที่ตรวจไม่ระบุ whitespace-only ว่าถือเป็นไม่กรอก ตาม handoff
   - เพิ่ม annotation ให้ครอบคลุมทั้ง nickname/comment รวมถึงเกิน 40/500 แจ้ง inline ไม่ตัดเงียบ; การนับ Unicode/IME ยังต้องกำหนดและทดสอบจริง ไม่อนุมานจาก wireframe

## ผลตามเกณฑ์

| ID | สถานะ | ผลจริง / reference |
|---|---|---|
| R1-01 Native fields | OBSERVED | ภาพ P01 มีช่อง nickname; P03/P04 มีช่องข้อความหลายบรรทัด ไม่ใช่ annotation อย่างเดียว; read-back ระบุ component/instance `18:24`, `18:34`, `18:39` ใน frames ที่คาดหวัง |
| R1-02 Optional / limit | PARTIAL | P01 ระบุ optional สูงสุด 40 และ P03/P04 optional 0/500; annotation ระบุเกิน limit แจ้งใต้ช่อง, P01 ไม่ตัดเงียบ; การไม่ตัดเงียบของ comment และ whitespace-only ยังไม่เห็นระบุชัดตาม finding 2; ยังไม่เห็นตัวอย่าง inline error จริง |
| R1-03 Privacy notice | OBSERVED | P01 `7:27` เตือน nickname/ข้อความอาจระบุตัวตนได้ ไม่รับรอง anonymous สมบูรณ์; P03/P04 เตือนไม่ใส่ชื่อบุคคลหรือข้อมูลอ่อนไหว เป็นข้อความ design ไม่ใช่หลักฐาน privacy enforcement |
| R1-04 Required answer | OBSERVED | P03 ระบุต้องเลือกคะแนน; P04 ต้องเลือกหนึ่งข้อ; ข้อความว่างส่งได้ และ P04 ไม่ส่งอัตโนมัติเมื่อเลือกหรือกด Enter ตาม `7:61`, `7:73` |
| R1-05 Atomic status P05–P06 | OBSERVED | P05 `7:82` ระบุส่งคำตอบและข้อความเป็นชุดเดียว/ยังไม่ยืนยัน; P06 `7:94–95` แสดง saved เมื่อยืนยันทั้งชุด และข้อความว่างยังสมบูรณ์ เป็น design intent ไม่พิสูจน์ DB transaction |
| R1-06 Draft / retry / reconnect P07–P08 | PARTIAL | P07 เก็บ draft ในแท็บ แก้เมื่อยืนยันไม่บันทึกและยังเปิด; P08 ตรวจ submission เดิมทั้งชุด, unknown ไม่ส่งซ้ำอัตโนมัติ และไม่รับรอง draft ข้าม refresh/ปิดแท็บ; identity ของ retry หลังแก้ยังคลุมเครือตาม finding 1 |
| R1-07 Closed P09 | OBSERVED | `7:133`, `7:136` แยก saved / ไม่มีคำตอบ / unknown ของทั้งชุด; ไม่รับคำตอบหรือข้อความใหม่และไม่ส่ง draft อัตโนมัติ |
| R1-08 P02/P10 nickname | OBSERVED | `7:42` ระบุ fallback “ผู้เข้าร่วม”, ชื่อซ้ำได้และไม่ใช้ชื่อเล่นนับผู้ตอบ; P10 `7:153` ระบุคง nickname เมื่อแก้รหัส และ retry ไม่สร้างผู้ร่วมซ้ำ เป็น annotation ยังไม่ได้ทดสอบจริง |
| R1-09 Facilitator / HR privacy | PARTIAL | ภาพ facilitator และ HR ที่โหลดไม่แสดง nickname หรือ raw comment รายบุคคล; `7:195`, `7:297` ระบุไม่แสดงในผลรวม แต่ภาพไม่พิสูจน์ access control, payload, logs หรือหน้าที่ไม่ได้ตรวจ |
| R1-10 Blank optional | OBSERVED | `7:195`, `7:298`, `7:331` ระบุข้อความ optional ว่างยังนับคำตอบตามปกติ ไม่ใช่ incomplete, partial หรือคะแนน 0; HR H03 ระบุ nickname/ข้อความว่างไม่เป็น partial หรือ 0 |
| R1-11 Bounds / Thai | PARTIAL | ภาพที่ตรวจอ่าน label และ annotation หลักได้; read-back มี `overflow`/`overlaps` ว่าง แต่ตรวจ descendant bounds เทียบ screen และ adjacent direct children เท่านั้น ไม่พิสูจน์ internal clipping ทุกชนิดหรือ responsive behavior |
| R1-12 Runtime / accessibility / security | NOT REVIEWED | ไม่มีการรัน app, DB/API/realtime, duplicate/idempotency, browser, Unicode/IME, keyboard หรือ screen reader |

## ข้อสรุป

ผู้ใช้สามารถ review ทิศทาง wireframe ได้โดยทราบ findings; ก่อนใช้เป็น implementation specification ให้แก้ความกำกวม idempotency และเติมกติกา whitespace/validation แล้วตรวจ artifact ใหม่ ไม่ใช่การอนุมัติ release หรือปิด ticket ผล scope/global-style ก่อน–หลังจากรอบเดิมยังมีข้อจำกัด และ bounds ไม่ใช่หลักฐานว่าไม่มี clipping ทุกกรณี

ไม่ได้แก้ Figma, app, shared docs, Git หรือ installs; สร้างเฉพาะรายงานนี้
