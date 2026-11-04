# WF-01 — Design review checklist

สถานะ: เตรียม checklist เท่านั้น — ยังไม่เห็นหรือ review ผลงาน Figma จริง ทุกรายการ NOT REVIEWED

## ขอบเขตและแหล่งอ้างอิง

- อ่าน `docs/handoffs/product-WF-01.md` และ `docs/product/FIGMA-DISCOVERY.md` สำหรับรายการตรวจ; discovery เป็น draft ขณะที่ handoff ระบุ scope WF-01 ที่ผู้ใช้อนุมัติแล้ว การอนุมัติหน้า canvas ไม่เท่ากับการอนุมัติ product/privacy decisions ทั้งหมด
- เป้าหมาย design file `RUOnC9Q15LA7DCc6rzhZtN`, page `1:2` — `02 Wireframes & Flows` เท่านั้น; node `1:3` ใน URL เดิมไม่ใช่หน้าที่อนุมัติให้แก้
- รายการตรวจด้านล่างใช้ตรวจ wireframe ภายหลัง ไม่ใช่การยืนยันการทำงานจริงของแอปหรือ accessibility certification หาก state แสดงด้วย annotation แทน frame แยก ต้องระบุ state, action และ transition ได้ชัดพอที่จะตรวจ
- ยังไม่เปิดหรือแก้ Figma ในงานจัดทำ checklist นี้; ไม่อ้างอิงสภาพ canvas ปัจจุบันจาก metadata เก่า และไม่อ้างว่าผลงานเสร็จ

## วิธีใช้ในการ review ภายหลัง

เมื่อ Product ส่งงานพร้อมสิทธิ์เข้าดู ให้ตรวจแบบ read-only จาก frame/node IDs, screenshots และ delivery inventory ของ build/design version เดียวกัน บันทึกวันที่/เวลาและ timezone, ผู้ตรวจ, file/page/frame/node, ลิงก์หรือ evidence ที่ไม่เปิดเผย credentials, actual และข้อจำกัดสำหรับแต่ละ ID หากหลักฐานไม่พอ ให้บันทึกว่าไม่สามารถสรุปได้ ไม่อนุมานจากข้อความใน handoff เพียงอย่างเดียว

ตรวจ page scope จากหลักฐาน structure ก่อน/หลังของ pages `0:1`, `1:3` และเนื้อหาเดิมใน `1:2` รวมถึง affected node IDs; screenshot เฉพาะหน้าที่สร้างใหม่ไม่เพียงพอยืนยันว่าอย่างอื่นไม่เปลี่ยน โดยเฉพาะ properties ที่ metadata ไม่แสดง ต้องระบุช่องว่างของหลักฐาน

ต่อแถวหลัง review ให้รายงาน actual, evidence, severity เมื่อพบปัญหา และสถานะตามผลตรวจจริง; ส่ง findings ให้ Coordinator และให้ผู้ใช้ตัดสินใจ ไม่ปิด ticket เอง. Design review ไม่แทน runtime QA; ทดสอบแอปจริงภายหลังและบันทึกผลแยก

## Checklist — ทุกข้อยัง NOT REVIEWED

### ขอบเขตและหลักฐาน

| ID | สิ่งที่ตรวจและเกณฑ์สังเกตได้ | สถานะ |
|---|---|---|
| WF-SCOPE-01 | Inventory และ node IDs ชี้ไปยัง file `RUOnC9Q15LA7DCc6rzhZtN` และพื้นที่ WF-01 ที่ระบุชื่อชัดเจนบน page `1:2` เท่านั้น ไม่สับสนกับ `1:3` จาก URL เดิม | NOT REVIEWED |
| WF-SCOPE-02 | เทียบหลักฐานก่อน/หลังและ affected IDs ว่า pages `0:1`, `1:3` และเนื้อหาเดิมบน `1:2` ไม่ถูกแก้หรือลบ; ระบุ property ใดที่หลักฐานตรวจไม่ได้ | NOT REVIEWED |
| WF-SCOPE-03 | Components/nodes ที่สร้างอยู่ใน page ที่อนุมัติ; หลักฐานไม่แสดงการสร้าง file-global tokens/styles หรือ publish library; ระบุข้อจำกัดการตรวจ | NOT REVIEWED |
| WF-SCOPE-04 | พื้นที่ที่สร้างเป็น low-fidelity ขาว/เทา/ดำ ไม่เพิ่ม polished branding หรือ features นอก scope; ไม่มี shimmer/placeholder ที่สื่อว่างานยังประมวลผล | NOT REVIEWED |
| WF-SCOPE-05 | Inventory ของ frame, ชื่อ, ขนาด และ IDs ตรงกับ read-back ที่ตรวจได้; screenshot มีภาพรวมและตัวอย่างแต่ละ role/state พอระบุ frame และตรวจการซ้อน/ถูกตัด | NOT REVIEWED |

### Participant — mobile

| ID | สิ่งที่ตรวจและเกณฑ์สังเกตได้ | สถานะ |
|---|---|---|
| WF-P-01 | Join แสดงบริบท session, วิธีเข้าด้วยลิงก์/รหัส และ data notice ก่อนตอบ; ไม่ขอข้อมูลส่วนบุคคลเพิ่มเติมโดยไม่มีเหตุผลใน scope | NOT REVIEWED |
| WF-P-02 | แยกสถานะตรวจรหัส, รหัสผิด/ไม่พบ, service error พร้อม retry และ session ปิด; ไม่มีข้อความที่ทำให้เข้าใจว่า join สำเร็จในกรณีผิดพลาด | NOT REVIEWED |
| WF-P-03 | Waiting บอก session และสถานะรอคำถาม; แยก loading, disconnected/reconnecting, recovered และ closed; ไม่มีปุ่มส่งที่ดูใช้งานได้ขณะยังไม่มีคำถามเปิด | NOT REVIEWED |
| WF-P-04 | Rating และ single-choice poll ระบุคำถาม ความหมายของ scale/ตัวเลือก ตัวเลือกที่เลือก และปุ่มส่ง; สถานะยังไม่เลือก/เลือกแล้ว/validation error แยกกัน และแตะตัวเลือกไม่ถูกสื่อว่าส่งอัตโนมัติ | NOT REVIEWED |
| WF-P-05 | Sending/pending มีข้อความกำลังส่งหรือกำลังตรวจสอบ และต่างจาก saved อย่างชัดเจน; ไม่แสดงว่าบันทึกแล้วขณะยังรอการยืนยัน | NOT REVIEWED |
| WF-P-06 | Outcome unknown จาก network หลุดแสดงว่ายังยืนยันผลไม่ได้ พร้อมแนวทางตรวจสถานะหลัง reconnect ก่อนเสนอ retry; ไม่เดาว่าสำเร็จหรือล้มเหลว และไม่สื่อว่าต้องส่งซ้ำทันที | NOT REVIEWED |
| WF-P-07 | Saved ใช้ข้อความยืนยันบันทึกเฉพาะเมื่อระบบยืนยันตาม annotation/flow; แยก recovered saved, ไม่บันทึกพร้อม retry และ closed without save | NOT REVIEWED |
| WF-P-08 | เมื่อคำถามหรือ session ปิดระหว่างส่ง แสดง closed และผลคำตอบตามที่ยืนยันได้; ถ้ายังไม่ทราบผลให้แยก checking/final status unavailable ไม่สรุปตามเวลา UI | NOT REVIEWED |
| WF-P-09 | เส้นทางหลัง saved ไป waiting/คำถามถัดไปหรือ ended ตาม state ที่ระบุ; หน้า ended ไม่แสดง HR link ให้ participant | NOT REVIEWED |

### Facilitator — desktop

| ID | สิ่งที่ตรวจและเกณฑ์สังเกตได้ | สถานะ |
|---|---|---|
| WF-F-01 | Lobby แสดงคำแนะนำ join และสถานะไม่มีผู้เข้าร่วมอย่างชัดเจน; ตัวเลขผู้ join ไม่ติดป้ายเป็นผู้ตอบหรือผู้ที่ออนไลน์ | NOT REVIEWED |
| WF-F-02 | มี control เปิด/ปิดคำถาม และ state ระหว่างส่งคำสั่ง, สำเร็จ, ล้มเหลวพร้อมแนวทาง retry; ไม่แสดงว่าเปิดหรือปิดแล้วก่อนยืนยัน | NOT REVIEWED |
| WF-F-03 | Live aggregate แสดงคำถามปัจจุบัน จำนวนผู้ตอบ การกระจายและฐานที่ใช้; zero responses ถูกระบุเป็นไม่มีคำตอบ ไม่สื่อว่าได้คะแนนศูนย์ | NOT REVIEWED |
| WF-F-04 | Stale/reconnecting/read error มีคำเตือนติดกับข้อมูลที่อาจเก่า และระบุการตรวจสถานะล่าสุด; ไม่ใช้ label live โดยไม่เตือน และไม่ชวนส่ง control ซ้ำก่อน reconcile | NOT REVIEWED |
| WF-F-05 | หลังปิดคำถามแสดงผลที่ยืนยัน/สถานะกำลังโหลดผล และการเปิดข้อถัดไป; จบ session มี confirmation, pending, error/unknown และ ended หลังยืนยัน | NOT REVIEWED |
| WF-F-06 | หน้าควบคุมและ aggregate ไม่แสดงชื่อหรือคำตอบรายบุคคลโดยไม่มีข้อกำหนดที่อนุมัติ | NOT REVIEWED |

### HR — desktop

| ID | สิ่งที่ตรวจและเกณฑ์สังเกตได้ | สถานะ |
|---|---|---|
| WF-HR-01 | Summary แสดงบริบท session และแยก loading, not ready, access denied/expired และ load error จากสถานะไม่มีคำตอบ | NOT REVIEWED |
| WF-HR-02 | Empty และ partial/missing data แสดงข้อความต่างกัน; ไม่มีข้อมูลไม่ถูกตีความเป็นคะแนนศูนย์ จุดอ่อน หรือข้อสรุปแทนทั้งกลุ่ม | NOT REVIEWED |
| WF-HR-03 | จำนวนผู้ตอบและฐานของแต่ละคำถามระบุชัด; หาก denominator ไม่ทราบ แสดงว่าฐานไม่ทราบและไม่แสดงเปอร์เซ็นต์ที่เดาเอง | NOT REVIEWED |
| WF-HR-04 | Low-count/suppressed state อธิบายว่าซ่อนรายละเอียดเพื่อความเป็นส่วนตัว โดยไม่ใส่ threshold ที่ยังไม่ได้อนุมัติเป็นกติกาจริง และไม่อนุมานข้อมูลที่ถูกซ่อน | NOT REVIEWED |
| WF-HR-05 | Summary จำกัดข้อมูลระดับกลุ่ม: ไม่แสดงคำตอบรายบุคคล, internal participant/session IDs, join code หรือ control credential โดยอัตโนมัติ | NOT REVIEWED |
| WF-HR-06 | ข้อความอธิบาย self-report และข้อจำกัดชัดเจน: ไม่อ้าง anonymous สมบูรณ์ ไม่สรุปเหตุและผลหรือความสามารถจริง และไม่ใช้ข้อมูลชุดเดียวตัดสินจ้าง/เลื่อนตำแหน่ง | NOT REVIEWED |

### ข้อมูลตัวอย่าง ภาษาไทย และ accessibility ในระดับ design

| ID | สิ่งที่ตรวจและเกณฑ์สังเกตได้ | สถานะ |
|---|---|---|
| WF-DATA-01 | ทุก sample count, chart และ aggregate ติดป้ายชัดเจนว่าเป็นข้อมูลตัวอย่างเพื่อออกแบบ; ป้ายอยู่ใกล้ข้อมูลหรือครอบคลุมพื้นที่นั้นอย่างไม่กำกวม | NOT REVIEWED |
| WF-DATA-02 | Flow arrows/annotations และตัวอย่าง saved/live ไม่อ้างว่า realtime, API หรือฐานข้อมูลทำงานแล้ว; chart placeholder ระบุว่าเป็นตัวอย่าง wireframe ไม่ใช่ผล runtime | NOT REVIEWED |
| WF-TH-01 | ภาษาไทยในทุก role/state อ่านได้ ไม่ทับ/ถูกตัด; ชื่อปุ่ม คำถาม error และข้อความยาวตัดบรรทัดโดยไม่เสียความหมาย | NOT REVIEWED |
| WF-TH-02 | ลำดับหัวข้อ คำอธิบาย และ action ชัดเจน; คำว่า “กำลังส่ง”, “ยังยืนยันการบันทึกไม่ได้”, “บันทึกคำตอบแล้ว” และ “ปิดรับคำตอบแล้ว” หรือข้อความเทียบเท่า สื่อสถานะไม่สับสน | NOT REVIEWED |
| WF-A11Y-01 | Wireframe มี text label สำหรับ control/error/status และข้อมูลกราฟ ไม่พึ่งสีอย่างเดียว; มีพื้นที่และ annotation รองรับข้อความไทยยาวใน mobile | NOT REVIEWED |
| WF-A11Y-02 | ถ้ามี interactive specification ให้ระบุลำดับ focus, ชื่อ controls, dialog และข้อความสถานะสำคัญเพียงพอสำหรับ implementation; การเห็น annotation ไม่ใช่หลักฐานว่า keyboard/screen reader ใช้งานได้จริง | NOT REVIEWED |

## Decisions ที่ยังเปิดและข้อจำกัด

เกณฑ์ denominator, minimum count, retention/deletion, data notice, สิทธิ์ HR, กติกาแก้คำตอบและรายละเอียด auth ยังต้องอ้างอิงการตัดสินใจที่ผู้ใช้อนุมัติเมื่อ review; ไม่กำหนดค่าหรือสมมติว่าอนุมัติแล้วจาก wireframe ตัวอย่าง

ยังไม่มี visual inspection, scope verification หรือ findings จาก Figma ในงานนี้ และไม่มีผลทดสอบ application/API/DB/realtime/security หรือ mobile/assistive technology จริง ทุก checklist ID จึงคงสถานะ NOT REVIEWED
