# UI-01 — Unslop และ Human-centered Design

สถานะ: **DRAFT / DOCUMENT-ONLY**. ผู้ใช้ย้ำว่าอยากได้ website ที่คนชอบและใช้ได้จริง ไม่ใช่หน้าตาที่ AI เลือกตามความเคยชิน. รอบนี้นำ Unslop มาใช้กับ audit/direction/specification ตั้งแต่ก่อน implementation โดยยังไม่แก้ Figma หรือเริ่ม coding

ผู้จัดทำ: lead-d-setup / Coordinator. อ่าน `.agents/skills/unslop/SKILL.md`, `PROJECT-SAFETY.md` และ `references/signs.md` จริง. นี่เป็นการ apply instructions กับเอกสาร ไม่ใช่ independent IDE activation หรือ rendered UI audit

## 1. แก้ความเข้าใจและเป้าหมาย
Unslop ไม่จำเป็นต้องถูกจำกัดเป็นงานเก็บ UI ตอนท้าย: ใช้หลัก audit/direction ป้องกัน template decisions ตั้งแต่ตอนนี้ได้. เมื่อมีแบบหรือ UI จริงจึงทำ visual audit และแก้เป็น passes ตามหลักฐาน

Unslop ช่วยเรื่อง craft และลดลักษณะสำเร็จรูป แต่ไม่ได้พิสูจน์ UX หรือรับประกันว่า “มนุษย์ชอบ”. ความชอบและการใช้งานต้องตรวจจากผู้ใช้เป้าหมาย ไม่ใช่จาก AI ให้คะแนนตัวเอง

ข้อเสนอ A/B/C เดิมเป็น exploration ไม่ใช่ตัวเลือกที่ผ่าน user validation. การเลือก teal แทน purple หรือถอด gradient อย่างเดียวไม่ทำให้ผลิตภัณฑ์ human-centered และไม่ใช่เหตุผลให้ยอมรับ A โดยอัตโนมัติ

## 2. Audit ของเอกสารปัจจุบัน (ไม่ใช่คะแนนของ UI)
| จุดตรวจ | สิ่งที่พบจากเอกสาร | สิ่งที่ต้องทำก่อนรับแบบ |
|---|---|---|
| Template look | direction แยก hierarchy/density แล้ว แต่ยังไม่มีหน้าจอ hi-fi ให้เทียบกับคำอธิบาย จึงยังตัดสินว่าเหมาะกับงานจริงไม่ได้ | ใช้ representative screens และงานของแต่ละ role เป็นตัวตัดสิน ไม่เลือกจาก palette อย่างเดียว |
| Surfaces/type/icons/spacing | มี guardrails เรื่อง neutral surfaces, Thai text, spacing/focus และไม่ใช้ decorative emoji | ตรวจ actual composition/line wrapping/contrast เมื่อมีแบบ; อย่าอ้างว่าเอกสารทำให้ visual pass แล้ว |
| Copy | state contract ถูกแยกไว้ แต่ศัพท์เทคนิคใน spec เช่น reconcile/idempotency ไม่ใช่คำที่ต้องใส่บนหน้าจอ | ใช้ภาษาคน เช่น “กำลังตรวจสอบว่าคำตอบบันทึกแล้วหรือยัง” และ “บันทึกคำตอบแล้ว”; ไม่แสดง saved หลอก |
| Components/charts | เอกสารไม่เสนอ card เท่ากันทุกใบหรือ charts ตกแต่ง แต่ยังไม่เห็นสัดส่วนบนหน้าใหม่ | ให้คำถาม/ผลหลักนำสายตา; context และตัวเลขรองเงียบกว่า; กราฟต้องตอบคำถามจริงและมี textual values |
| Heroes/visuals/motion | ไม่จำเป็นต่อ participant/facilitator/HR workflow ที่อนุมัติ | ไม่เพิ่ม landing hero, generated imagery หรือ animation เพื่อให้ดูออกแบบมา; ไม่มีภาพ/หน้าจอใหม่ให้ตรวจในรอบนี้ |

ยังไม่จัดระดับ heavy/light/no slop และไม่ประกาศผ่าน visual checklist เพราะไม่มี rendered new UI. Low-fi baseline ไม่ถูกตัดสินว่าแย่เพียงเพราะเป็นขาวดำ

## 3. Direction brief ตาม Unslop — ร่างให้ยืนยัน
- **Product:** รับคำตอบใน workshop ผ่านมือถือ ให้ผู้ดำเนินงานติดตามผลรวม และให้ HR อ่านบริบทหลังจบ โดยไม่เปิดเผย raw participant text
- **Character:** สุขุม ตรงไปตรงมา ไม่ตัดสินคน
- **World:** ห้อง workshop ของผู้จัดการ มีการ์ดคำถามและกระดานสรุป ไม่ใช่หน้าโฆษณา SaaS
- **Moments:** บนมือถือให้คำถามและตัวเลือกเด่น; บนจอ facilitator ให้ distribution พร้อมจำนวนผู้ตอบเป็นจุดหลัก; HR ให้ข้อมูลและข้อจำกัดอ่านคู่กัน
- **Signature:** สถานะที่ผูกกับคำถามปัจจุบันและบอกสิ่งที่เกิดขึ้นจริง—รอคำถาม, กำลังส่ง, กำลังตรวจสอบ, บันทึกแล้ว, ปิดรับแล้ว—พร้อม next action ที่ไม่สร้างคำตอบซ้ำ

ยังไม่ล็อก palette/brand หรืออนุมัติ visual direction จาก brief นี้. คง approved flow, screen IDs, privacy และ failure/reconnect semantics เดิม

## 4. วิธีใช้ Unslop ในงานต่อไป
1. อ่านหน้าจอ/แบบจริงและทำ audit ก่อนแก้ ไม่ใส่ทุกหน้าจอลง template เดียวกัน
2. ตกลง direction โดยดูงานที่คนต้องทำ พร้อมเหตุผลของ hierarchy/type/layout ไม่ใช่แค่เลือกสี
3. หลังอนุมัติขอบเขตออกแบบ ให้ปรับตาม passes: spacing → color → icons → copy → type → layout → details → visuals → motion. ถ้าหน้าจอดีอยู่แล้วแก้เฉพาะ finding ไม่เปลี่ยนเพราะอยากให้ต่าง
4. รักษาความอ่านง่ายภาษาไทย, label, focus, target size และสถานะสำคัญ แม้ aesthetic rule จะเสนอ hairline/ตัวหนังสือเล็กหรือ motion ที่ไม่เหมาะกับบริบท
5. เอา landing-page rules มาใช้เฉพาะเมื่อออกแบบ landing page จริง ไม่เพิ่ม hero/sidebar/illustration ให้ workshop screen โดยไม่มีหน้าที่
6. Hermes ทำ audit/specification; visual Figma edits ต้องมี scope และ implementation ทั้งหมดเป็น Antigravity หลัง build approval. ไม่รัน snapshot/story helpers ที่ไม่ได้ติดตั้ง ไม่ทำ Unslop story video แทนวิดีโอสัมภาษณ์

## 5. Human validation ที่ต้องมีภายหลัง (ยังไม่ได้ทำ)
ใช้ prototype ที่ได้รับอนุมัติหรือ UI ที่รันจริง ให้ผู้ใช้เป้าหมายทำงานโดยไม่ชี้นำก่อน เก็บสิ่งที่ทำได้/ผิด/ติดขัดและคำพูดจริง ไม่สร้างผลสัมภาษณ์สมมติ

| Role | งานที่ให้ลอง | สิ่งที่สังเกต/เก็บ |
|---|---|---|
| Participant | เข้าห้องโดยไม่ใส่ nickname, เลือกคำตอบ, ใส่/ไม่ใส่ comment | ทำสำเร็จโดยไม่ต้องช่วยหรือไม่, ปุ่มและ optional field เข้าใจไหม, เวลา/ข้อผิดพลาดที่วัดจริง |
| Participant | เห็น sending/unknown/closed แล้วอธิบายว่าเกิดอะไรและควรทำอะไร | แยก saved กับ unknown ได้ไหม, กดซ้ำหรือพยายามแก้คำตอบที่ accepted เพราะ UI ทำให้เข้าใจผิดหรือไม่ |
| Facilitator | ดูจำนวนตอบ, ปิดคำถาม, แยกจากจบ session | หา action ได้ไหม, เห็น stale data แล้วรู้หรือไม่, ไม่กด destructive action โดยไม่ตั้งใจ |
| HR | อ่าน summary และ partial/empty พร้อมอธิบายความหมาย | เข้าใจ denominator/ข้อมูลที่ขาดและข้อจำกัดไหม, ไม่ตีความ missing เป็น0หรือจัดอันดับคน |
| ทุก role | เปรียบเทียบตัวเลือกแบบโดยอ้างเหตุผล | ชอบ/ไม่ชอบเพราะอะไร, ความไว้วางใจ/ความชัดเจน ไม่สรุปจากคะแนนความสวยอย่างเดียว |

ยังไม่กำหนดตัวเลข task-time/success-rate เป้าหมายโดยไม่มี baseline; ตกลงเกณฑ์ก่อนทดสอบ. ใช้ synthetic fixtures ที่ติด label ในแบบและไม่นำชื่อ/ข้อความผู้เข้าร่วมจริงมาแปะ public evidence. การติดต่อผู้ทดสอบ/เก็บข้อมูลจริงต้องตกลง scope และ consent ก่อน

## 6. Completion และขอบเขตที่ยังคงเดิม
เอกสารรอบนี้เสร็จเมื่อ direction ถูกตรวจด้วยหลัก Unslop และมีเกณฑ์ human validation ที่ตรวจได้ ไม่ใช่เมื่อ AI ประกาศว่า human-friendly. ขั้นถัดไปคือยืนยัน direction และ scope ของ representative design/prototype ก่อนลงมือ; ยังไม่ทำ hi-fi/clickable prototype/user test/code หรือ publish ในรอบนี้

## AI progress / sources
- Request: ใช้ Unslop ออกแบบเพื่อมนุษย์ ไม่ตามรสนิยม template ของ AI
- Applied skill: Unslop ระดับ document audit/direction; writing-for-agents และ lead-d-workshop-cycle สำหรับข้อกำหนด/ขอบเขต
- Artifacts: addendum นี้ + pointer ใน UI-01 direction. การแก้ AGENTS.md ไม่สำเร็จเพราะ approval prompt หมดเวลา จึงคงไฟล์เดิมและไม่ retry/ใช้ทางอื่นแก้แทน. ไม่ rewrite ผล audit/usage ในอดีตว่าเคยใช้แล้ว
- Verification: ตรวจ source instructions และความสอดคล้องกับ flow/spec; visual usability/accessibility runtime และความชอบผู้ใช้ทั้งหมด **NOT RUN**
- Credit: Unslop by Damir Sokolovsky (@heydamir), https://github.com/heydamir/unslop, CC BY 4.0. Project safety adaptation ยังคงมีผล
