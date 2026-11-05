# WF-01-R1 — Optional nickname และข้อความประกอบคำตอบ

สถานะ: APPROVED FOR DESIGN EDIT — ผู้ใช้ขอเพิ่มใน P01/P03/P04 และปรับหน้าที่เกี่ยวข้องให้สอดคล้อง ไม่ใช่ approval ให้ implement แอป

## Scope
- File RUOnC9Q15LA7DCc6rzhZtN, page 1:2, existing root 7:2 เท่านั้น; แก้ในที่เดิม ไม่สร้างชุดหน้าจอซ้ำ ไม่แก้หน้าอื่น/global styles หรือ app code
- P01: nickname optional; เว้นว่างเข้าร่วมได้ ไม่ต้องใช้ชื่อจริง ไม่ใช่บัญชีหรือ identifier สำหรับ deduplication; ชื่อซ้ำไม่เป็นเหตุปฏิเสธ join
- P03/P04: multiline textbox เป็น optional comment ประกอบ rating/poll; ไม่เพิ่ม question type หรือบังคับข้อความเพื่อส่งคะแนน/โหวต
- ค่าเริ่มต้นสำหรับ design: nickname สูงสุด40 และ comment สูงสุด500 ตัวอักษร; whitespace-only ถือว่าไม่กรอก; เกินกำหนดแจ้ง inline ไม่ตัดเงียบ; ยังต้องทดสอบการนับ Unicode/IME ใน implementation
- Textbox มี label/helper/count, แจ้งไม่ใส่ชื่อหรือข้อมูลอ่อนไหว; score/choice ยังต้องเลือกตามเดิม
- P02/P10: fallback nickname และคง nickname เมื่อแก้รหัสห้อง; ไม่สร้าง participant ใหม่เพราะกด retry
- P05/P06: ส่ง selected answer และ comment เป็น submission เดียว; saved ต้องยืนยันทั้งชุด ไม่ใช่แค่คะแนน
- P07/P08: รักษา draft answer/comment ระหว่าง retry/reconnect ในแท็บเดิม; เมื่อ unknown ตรวจผล submission เดิมก่อนส่งซ้ำ; กลับคำถามชนิดเดิม P03/P04; ไม่รับรอง draft ข้าม refresh/ปิดแท็บในรอบนี้
- P09: closed ห้ามส่งหรือแก้ comment ใหม่ และแยก confirmed saved / confirmed no answer / unknown สำหรับ submission ทั้งชุด; draft ไม่ใช่คำตอบที่บันทึก
- Facilitator/HR: ผลรวมไม่แสดง nickname/raw comments; optional comment ว่างไม่ใช่คะแนน0/คำตอบไม่ครบ/ข้อมูลขาด; ไม่เพิ่ม comment wall, AI summary หรือ individual export โดยปริยาย
- Privacy notice สะท้อนความเสี่ยงระบุตัวตนจาก nickname/ข้อความ; ไม่มี absolute anonymity claim

## Acceptance / evidence
1. ช่องจริงใน native editable wireframe P01/P03/P04 ไม่ใช่ annotation อย่างเดียว
2. หน้าที่เกี่ยวข้องมีข้อความสอดคล้องกับ optional/atomic save/draft/reconcile/privacy
3. 19 screens เดิมยังอยู่; native nodes/fonts/grayscale และ sample data ตามเดิม
4. อ่าน target กลับและตรวจภาพ actual screenshots + Thai overflow; บันทึกข้อจำกัด design-only
5. QA ตรวจ revision artifacts; Coordinator บันทึก AI-PROGRESS และ checkpoint Git ตาม workflow ที่ผู้ใช้ขอ

ผู้ลงมือ design revision: Coordinator ผ่าน Figma MCP; Senior Tester ตรวจแยก ภายใต้ขอบเขต non-coding. การใช้ Plugin API สำหรับ design ไม่ใช่ application implementation
