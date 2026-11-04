# WF-01 — ส่งมอบ low-fidelity wireframes

สถานะ: READY FOR HUMAN REVIEW — สร้างแล้วและตรวจ design artifacts แล้ว แต่ยังไม่ใช่ user acceptance หรือ release approval

Product สร้าง canvas; Senior Tester ตรวจภาพ/structure และ retest; Coordinator ตรวจ Figma สด แก้ annotation สองจุด และรวมเอกสารส่งมอบนี้หลัง Product documentation subprocess ถูก interrupt โดยไม่มีไฟล์ส่งมอบ ไม่อ้างว่า Product เขียนเอกสารนี้เอง

## เปิดงาน
- [พื้นที่ WF-01 ทั้งหมด](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-2)
- [Participant — 10 หน้าจอ](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-15)
- [Facilitator — 6 หน้าจอ](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-154)
- [HR — 3 หน้าจอ](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-Workshop-MVP?node-id=7-267)
- Page `1:2` — 02 Wireframes & Flows; root `7:2`; ไม่ใช้หน้า `1:3` ที่ URL เดิมเลือกไว้

## Inventory
19 screens, native editable nodes 330 รวม root; 101 FRAME, 195 TEXT, 3 COMPONENT, 22 INSTANCE, 9 RECTANGLE จาก actual read-back ไม่มี image-filled node ใน root จึงไม่ใช่ภาพแบนทับ UI. ใช้ Noto Sans Thai Bold/Regular ตาม initial font audit และ grayscale; ปุ่มใช้ local components บนหน้าเดียวกัน

| Screen | Node ID | ขนาด |
|---|---|---|
| P01 / Join | `7:19` | 390 × 844 |
| P02 / Waiting | `7:34` | 390 × 844 |
| P03 / Rating | `7:46` | 390 × 844 |
| P04 / Poll | `7:62` | 390 × 844 |
| P05 / Sending | `7:75` | 390 × 844 |
| P06 / Saved | `7:87` | 390 × 844 |
| P07 / Send error | `7:99` | 390 × 844 |
| P08 / Reconnect unknown | `7:113` | 390 × 844 |
| P09 / Closed | `7:126` | 390 × 844 |
| P10 / Join error | `7:140` | 390 × 844 |
| F01 / Lobby | `7:158` | 1040 × 780 |
| F02 / Live aggregate | `7:172` | 1040 × 780 |
| F03 / Zero responses | `7:197` | 1040 × 780 |
| F04 / Stale reconnect | `7:211` | 1040 × 780 |
| F05 / Close pending | `7:240` | 1040 × 780 |
| F06 / Session ended | `7:256` | 1040 × 780 |
| H01 / Post-session summary | `7:271` | 1040 × 820 |
| H02 / Empty summary | `7:299` | 1040 × 820 |
| H03 / Partial missing | `7:315` | 1040 × 820 |

Inventory พร้อม created IDs ทั้งหมดอยู่ [WF-01-NODES.json](WF-01-NODES.json)

## Flow และ state ที่สื่อในแบบ
- Participant: Join → Waiting → Rating/Poll → Sending → Saved; แยก error ที่ยืนยันปฏิเสธจาก reconnect/outcome unknown; join error และ closed มีคำอธิบายแยก
- ปิดห้องแล้วไม่เท่ากับคำตอบสำเร็จ/ล้มเหลว: P08 ตรวจคำตอบเดิมก่อน; P09 แยก confirmed saved, confirmed no answer และ unknown; ไม่ส่งซ้ำอัตโนมัติหรือแสดง saved โดยไม่มีการยืนยัน
- Facilitator: Lobby, live aggregate, zero responses, stale/reconnect, close pending และ ended; stale ไม่แสดงเป็น Live และ pending ไม่เท่ากับคำสั่งสำเร็จ
- HR: post-session summary, empty, partial/missing; แยกไม่มีข้อมูลจากศูนย์, ระบุ denominator เมื่อทราบ, ไม่แสดงรายบุคคล และระบุข้อจำกัด self-report
- นี่คือ annotated flows ไม่ใช่ clickable prototype; states บางส่วนอธิบายใน annotation ไม่ได้สร้างทุก combination เป็น frame แยก

## QA / verification จริง
- [Review รอบแรก](../qa/WF-01-DESIGN-REVIEW.md): พบตัวนับ role ไม่ตรงและ closed/reconnect specification ไม่ครบ
- [Targeted retest](../qa/WF-01-DESIGN-RETEST.md): ทั้งสอง finding RESOLVED เฉพาะ design artifact; คงรายงานเดิมเป็นประวัติ
- Coordinator นับ role ด้วย anchored screen-code regex ได้ P10/F6/H3; ไม่ใช้ substring P ที่อาจตรงคำ Post/Partial
- หลังแก้ข้อความเฉพาะ `7:124`, `7:136` เรียก Figma อ่านกลับจริง: 19 screens / 330 nodes; P08/P09 descendant bounds ไม่เกินหน้าจอ; actual read-back request `1a2cd083-6151-467e-8582-55aa9dc83b67`
- Coordinator และ QA โหลดภาพจริงหลังแก้ ไม่พบข้อความซ้อน/ล้นชัดเจนในส่วนที่ตรวจ; ภาพนิ่งและ bounds ไม่รับรอง clipping ทุกชนิดหรือ responsive behavior
- อ่าน `0:1` และ `1:3` หลังงานแล้ว metadata ยังไม่มี child elements เช่นเดียวกับการอ่านก่อนสร้าง; ไม่มี before/after property/global-style audit ครบถ้วน จึงไม่อ้าง preservation ของทุก property หรือทุก global style

## หลักฐาน
- [Initial structure / audit](evidence/WF-01/structure.json) — ก่อน targeted text fix; role summary แก้จากตัวนับที่ผิดแล้ว
- [Post-fix read-back summary](evidence/WF-01/qa-fix-readback.json) — ถอดจาก actual MCP returns พร้อม request IDs ไม่ใช่ raw response
- [Participant หลังแก้](evidence/WF-01/participant-after-fix.png), [Facilitator](evidence/WF-01/facilitator.png), [HR](evidence/WF-01/hr-summary.png)
- [Participant ก่อนแก้ annotation](evidence/WF-01/participant.png) เก็บเพื่อ trace review รอบแรก
- ตัวเลขในแบบเป็น design examples ไม่ใช่ผลผู้ร่วมจริง; ไม่มี signed screenshot URLs หรือ credentials ในเอกสารส่งมอบ

## Acceptance ของรอบนี้
| ข้อ | ผล |
|---|---|
| Native editable low-fi และ flow หลักสาม role | OBSERVED; บาง state เป็น annotation |
| Inventory และภาพตัวอย่างไม่มี overlap ชัดเจน | OBSERVED เฉพาะหลักฐานและพื้นที่ตรวจ |
| Scope เฉพาะหน้า 1:2 / preservation | โครงสร้างก่อน–หลังรองรับ; full property/global audit NOT REVIEWED |
| ไม่อ้าง DB/realtime สำเร็จจาก mock | ระบุ design example และข้อจำกัดชัดเจน |
| Evidence และลิงก์ส่งมอบ | มีในเอกสารนี้; Git backup ตรวจโดย Coordinator แยกหลัง commit |

## ยังต้องตัดสินใจก่อน implementation
1. รูปแบบคำถาม/เนื้อหาเริ่มต้นและกติกาแก้คำตอบ
2. ฐานคำนวณ response coverage และ minimum count สำหรับซ่อนกลุ่มเล็ก
3. สิทธิ์ facilitator/HR และการแจก access โดย participant ไม่สมัครบัญชี
4. นโยบายเก็บ/ลบข้อมูลและ privacy notice ที่ใช้งานจริง
5. focus/dialog/screen-reader specification และ loading/error combinations เพิ่มเติมใน slice ที่จะสร้าง

ยังไม่มี application code, API/DB/realtime implementation, runtime/load/security/mobile/accessibility test หรือ deployment ของแอปจาก WF-01. ไม่ถือว่าผ่าน test เหล่านั้น และยังไม่มี live URL/วิดีโอ

Next gate: ผู้ใช้ review flow/ทิศทางใน Figma; เลือกแก้ wireframe หรืออนุมัติรอบถัดไปก่อน visual polish / Antigravity implementation. ไม่ขยาย scope อัตโนมัติ
