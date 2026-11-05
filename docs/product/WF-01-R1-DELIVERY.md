# WF-01-R1 — Nickname และข้อความประกอบคำตอบ

สถานะ: BUILT / READY FOR HUMAN REVIEW — ขอบเขตนี้แก้ wireframe เท่านั้น ไม่ใช่ user acceptance, runtime PASS หรือ approval ให้เริ่ม implementation

## เปิดแบบที่ปรับแล้ว
- [P01 — Join + nickname](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-19)
- [P03 — Rating + textbox](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-46)
- [P04 — Poll + textbox](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-62)
- [ทั้งชุด](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-2) — page1:2 เดิม ไม่สร้างชุดหน้าจอซ้ำ

## สิ่งที่เพิ่มและการปรับให้สอดคล้อง
| ส่วน | พฤติกรรมที่กำหนดในแบบ |
|---|---|
| P01 / P10 | nickname optional, ไม่ต้องใช้ชื่อจริง, ชื่อซ้ำได้, ไม่ใช่บัญชีหรือ identity สำหรับนับผู้ตอบ; คง nickname เมื่อแก้รหัสห้อง |
| P02 | แสดง nickname ของตนเองได้; ไม่กรอกใช้ “ผู้เข้าร่วม”; ไม่มีรายชื่อผู้ร่วมอื่น |
| P03 / P04 | textbox หลายบรรทัดสำหรับข้อความประกอบ optional; ไม่ใช่คำถาม free-text ชนิดใหม่; rating/choice ยังจำเป็น |
| P05 / P06 | ส่งและยืนยันคำตอบ+comment เป็นชุดเดียว; ข้อความว่างก็สมบูรณ์; ไม่ใช้การกดปุ่มเป็น saved |
| P07 / P08 | คง draft ในแท็บ; unknown ตรวจ submission เดิมก่อน; unchanged retry ใช้ key+payload เดิม; แก้และใช้ key ใหม่ได้เฉพาะเมื่อยืนยันเดิมถูกปฏิเสธ/ไม่บันทึกและคำถามยังเปิด |
| P09 | ไม่รับคำตอบ/ข้อความใหม่ ไม่ส่งร่างค้าง; saved / not-saved / unknown ครอบคลุมทั้งชุด |
| F02 / H01 / H03 | ไม่เผย nickname หรือข้อความดิบในผลรวม; ไม่กรอก optional ไม่เป็นคะแนน0/partial/คำตอบไม่ครบ |

ค่าเริ่มต้นเพื่อ design review: nickname40 และ comment500 ตัวอักษร; ว่างหรือ whitespace-only ถือว่าไม่กรอก; เกินกำหนดแจ้ง inline ไม่ตัดเงียบ. มี privacy reminder ไม่ใส่ชื่อบุคคลหรือข้อมูลอ่อนไหว และแจ้งว่าชื่อเล่น/ข้อความอาจระบุตัวตนได้. ค่านี้เลือกโดย Coordinator ไม่ใช่ตัวเลขที่ผู้ใช้ระบุ ผู้ใช้ปรับได้ก่อน implementation

ไม่เพิ่ม comment wall, AI summarization, raw comment export หรือสิทธิ์เข้าถึงข้อมูลดิบโดยปริยาย. การเก็บ draft ข้าม refresh/ปิดแท็บยังไม่รับรอง ไม่เพิ่ม persistent browser storage โดยไม่ตัดสินใจ privacy/retention

## Verification
- Coordinator ทำ design mutation ผ่าน Figma MCP ภายใต้คำขอแก้ของผู้ใช้; Senior Tester ตรวจแยก ไม่อ้างว่า Product Bot เป็นผู้ลงมือ revision นี้
- Actual read-back:19screens เดิม P10/F6/H3,350nodes,105FRAME/207TEXT/5COMPONENT/24INSTANCE/9RECTANGLE; ไม่มี image-filled UI node; Noto Sans Thai Bold/Regular ตามแบบเดิม
- เพิ่ม20 native nodes โดยใช้ nickname component + instance(P10) และ textarea component + instance(P04); field IDs18:24,18:29,18:34,18:39
- ตรวจ descendant bounds เทียบ screen และ direct sibling order แล้ว overflow/overlaps ว่าง; อ่านภาพจริงทั้งสาม role. ไม่ใช่หลักฐาน responsive/internal clipping ทุกชนิด
- QA review พบ retry/key ambiguity และ whitespace omission; Coordinator แก้ annotation แล้วอ่านกลับใหม่: request d801c3ef-8484-42e6-af92-f7773002acad. ดู review และ targeted retest แยกจากกัน ไม่ลบประวัติ findings

## หลักฐาน
- [Approved revision brief](../handoffs/product-WF-01-R1.md)
- [Read-back ก่อน QA fixes](evidence/WF-01-R1/readback.json) และ [หลังแก้](evidence/WF-01-R1/readback-final.json)
- [Participant หลังแก้ครบ](evidence/WF-01-R1/participant-final.png), [Facilitator](evidence/WF-01-R1/facilitator.png), [HR](evidence/WF-01-R1/hr-summary.png)
- [Participant ก่อน QA fixes](evidence/WF-01-R1/participant.png) เก็บคู่กับ [review](../qa/WF-01-R1-DESIGN-REVIEW.md)
- [Targeted retest](../qa/WF-01-R1-DESIGN-RETEST.md): finding1–2 RESOLVED เฉพาะระดับ design/spec; runtime ยังไม่ทดสอบ

## Contract ที่ Antigravity ต้องพิสูจน์ภายหลัง — ยังไม่ implement
- participant identity/session grant แยกจาก nickname; join retry ต้องไม่เพิ่มผู้ร่วมซ้ำ
- response มี answer และ nullable comment ใน submission เดียว; DB transaction/ack ต้องไม่ให้คะแนน saved แต่ comment หาย; validation ต้องตรงกัน frontend/backend
- unchanged retry: keyเดิม+payloadเดิม; same key/different payload ต้องปฏิเสธอย่างชัดเจน; edited new submission ใช้ keyใหม่ได้หลังยืนยัน rejection/terminal non-save เท่านั้น ไม่ใช่เพียง GET ไม่พบชั่วคราว
- unknown ต้อง reconcile/in-flight operation ให้จบก่อนอนุญาตแก้และส่งใหม่; server unique constraint ตาม participant+question และ close/submit ordering ต้องป้องกันการแข่งขัน ไม่พึ่ง UI ปุ่มอย่างเดียว
- normalize whitespace-only เป็น absence, ห้ามแปลง optional ว่างเป็นคะแนน0; กติกา Unicode/emoji/Thai IME/ความยาวต้องกำหนดตรงกันและ test
- Escape/render text เป็นข้อความ ไม่ใช้ raw HTML; ไม่ให้ nickname/comment หลุด aggregate API, logs หรือ exports; access/retention ต้องตัดสินใจก่อนใช้จริง
- ทดสอบ mobile keyboard, multiline Enter, focus/labels, live character count, inline error และ draft/reconnect ด้วย runtime จริง

นี่คือ native editable low-fi/annotated specification ไม่ใช่ clickable prototype. ไม่มี app/test code, DB/API/realtime, security/load/accessibility runtime หรือ deployment ในรอบนี้; full global-property before/after audit ยังไม่ทำ. รอผู้ใช้ review ก่อนเริ่มงานรอบถัดไป
