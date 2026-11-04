# C0 — Foundation Review: Product & UX

สถานะ: ทบทวนเอกสารและเสนอ requirements เท่านั้น ยังไม่ใช่ scope ที่ผู้ใช้อนุมัติหรือผล QA ของแอป

## 1. หลักฐานที่อ่านและขอบเขตงาน

อ่านไฟล์ใน workspace ผ่านเครื่องมือ read_file:
- `AGENTS.md` — บทบาท ขอบเขต non-coding ความปลอดภัย และ approval gates
- `docs/TEAM-WORKFLOW.md` — ownership, cycle, release definition of done
- `docs/SKILLS-REGISTER.md` — provenance และข้อจำกัดของ skills; การค้นพบ coding skill ไม่ได้อนุญาตให้ Hermes เขียนโค้ด
- `Full Stack Case Interview.pdf` — อ่านข้อความที่สกัดจาก PDF; ไม่ได้ตรวจภาพหรือ layout ทุกหน้า

งาน C0 นี้สร้างเอกสารไฟล์นี้เท่านั้น ไม่เรียกบอตอื่น ไม่แก้ไฟล์อื่น และไม่ดำเนินการ implementation หรือ publication คำขอส่งมอบออนไลน์ใน PDF ไม่ใช่ approval ให้ deploy/push/publish ในรอบนี้

### ยืนยันบทบาทและอำนาจตัดสินใจ
- `lead-d-product`: Product & UX รับผิดชอบ requirements, journey, UX states และ acceptance criteria; ส่ง findings ไม่ปิด ticket เอง
- `lead-d-setup`: Project Lead และ Coordinator เพียงคนเดียว รับผิดชอบจัดลำดับงาน รวมผล ติดตาม gate และบันทึก progress
- ผู้ใช้: ผู้อนุมัติสุดท้าย รวมถึง scope, technical trade-offs และการยอมรับผลงาน
- Hermes ทำ non-coding เท่านั้น ห้ามสร้างหรือแก้ application code, automated test code, migrations, CI หรือ deployment scripts แม้ skill จะเสนอให้ทำ
- Implementation ทั้งหมดทำใน Antigravity IDE ภายใต้การกำกับของผู้ใช้ หลัง Human Approval; เอกสารนี้ไม่ใช่คำสั่งเริ่ม build

## 2. ข้อเท็จจริงจากโจทย์

โจทย์คือ workshop ประมาณ 30 ผู้จัดการใหม่ ระยะเวลา 3 ชั่วโมง ใช้โทรศัพท์ตอบระหว่างกิจกรรม Facilitator ควบคุม session และเห็นผลสด ส่วน HR อ่าน dashboard หลังจบเพื่อเข้าใจจุดแข็ง จุดที่ต้องพัฒนา และอุปสรรคจากองค์กร

ต้องบันทึกข้อมูลจริงในฐานข้อมูลจริง โดยใช้ผู้เข้าร่วมสมมติ ไม่ใช่ hard-coded หรือ mock results กิจกรรมทำให้เรียบง่ายได้ Payments, participant accounts และ native mobile app อยู่นอกขอบเขต; AI เป็นตัวเลือก ไม่ใช่ข้อบังคับ

ผลส่งมอบท้ายโครงการตามโจทย์คือ working link, public repository พร้อม full commit history และวิดีโอ unlisted แบบ one-take 5–8 นาที เห็นใบหน้าและหน้าจอ ทั้งหมดนี้ยังไม่ได้จัดทำหรือยืนยันใน C0

## 3. ข้อเสนอขอบเขต MVP ที่เล็กและตรวจได้

### ผู้ใช้งานและ flow
1. Facilitator เปิด session และเปิด/ปิดคำถามทีละข้อ โดยมีสถานะ waiting, collecting และ closed ชัดเจน
2. Participant เข้าผ่านลิงก์หรือรหัส session บน mobile web โดยไม่สร้างบัญชี เห็นคำอธิบายการใช้ข้อมูลก่อนเริ่ม
3. Participant ตอบ rating หรือ single-choice poll ที่ครอบคลุมความมั่นใจในทักษะและอุปสรรคจากองค์กร แสดง sending, saved หรือ error ตามผลจริง
4. Facilitator เห็น live aggregate พร้อมจำนวนคำตอบและฐานที่ใช้คำนวณ โดยไม่เปิดเผยคำตอบรายบุคคลบนจอรวม
5. เมื่อปิด session HR อ่าน post-session summary จากข้อมูลที่บันทึกไว้ พร้อมจำนวนผู้ตอบ การกระจายคำตอบ และข้อจำกัดในการตีความ

### UX states ที่ต้องออกแบบตั้งแต่รอบแรก
- Join: loading, รหัสไม่ถูกต้อง, session ไม่มีอยู่, session ปิดแล้ว และ retry โดยไม่ทำให้เกิดผู้เข้าร่วมซ้ำโดยไม่จำเป็น
- Waiting: แจ้งว่ารอ facilitator ไม่แสดงหน้าเปล่าหรือดูเหมือนระบบค้าง
- Submit: แยกกำลังส่งออกจากบันทึกสำเร็จ; error ต้องมีข้อความภาษาไทยและวิธีกู้คืนคำตอบ
- Reconnect: แจ้งขาดการเชื่อมต่อ/กำลังเชื่อมใหม่; ข้อมูล aggregate ที่อาจเก่าต้องไม่แสดงเหมือนสด
- Closed: แจ้งว่าปิดรับแล้ว ไม่รับคำตอบใหม่เงียบ ๆ และไม่แสดง success ที่ไม่มีการบันทึก
- Accessibility: ใช้ label ภาษาไทยที่ชัดเจน, keyboard และ focus ที่ใช้งานได้, แจ้งสถานะกับ assistive technology และไม่ใช้สีอย่างเดียวสื่อความหมาย

### ยังไม่รวมใน MVP ที่เสนอ
AI-generated insights, gamification, ranking รายบุคคล, open-text analysis, demographic drill-down และ export รายบุคคล การเพิ่มฟีเจอร์ต้องมีเหตุผลและได้รับอนุมัติ ขอบเขตนี้ไม่ลดข้อกำหนดเรื่อง persistence, isolation หรือ accessibility

## 4. Acceptance criteria ที่เสนอ — 5 ข้อ

ทุกข้อมีสถานะ **NOT RUN** เพราะไม่มี application ให้ทดสอบในงานนี้ เงื่อนไขต่อไปนี้เป็นเกณฑ์สำหรับรอบ build/QA ไม่ใช่หลักฐานว่าระบบทำได้แล้ว

### AC-01 — Mobile join และ waiting/error states
- Given session เปิดอยู่ เมื่อผู้เข้าร่วมเปิดลิงก์หรือกรอกรหัสที่ถูกต้องบน mobile web ต้องเข้าสู่ session ที่ถูกต้องได้โดยไม่สร้างบัญชี และเห็น waiting หากยังไม่มีคำถามเปิด
- รหัสผิดและ session ปิดต้องแสดงข้อความภาษาไทยเฉพาะกรณี ไม่ให้เข้าร่วมผิด session และมีทางกลับหรือแก้ไข
- ตรวจด้วยอุปกรณ์/viewport ที่ผู้ใช้อนุมัติ พร้อม keyboard และ screen reader: ช่องกรอกมี accessible name, focus ไม่ติดค้าง และสถานะไม่พึ่งสีอย่างเดียว
- หลักฐานที่ต้องเก็บ: browser/device ที่ใช้, ขั้นตอนจริง และภาพหรือบันทึกผลของแต่ละสถานะ

### AC-02 — Rating/poll บันทึกจริงและกู้คืนเมื่อส่งไม่สำเร็จ
- เมื่อส่งค่าที่อยู่ในตัวเลือกที่กำหนด UI ต้องแสดงกำลังส่ง และแสดง saved หลังระบบยืนยันการบันทึกจริงเท่านั้น; อ่านกลับจาก persistent DB แล้วค่าตรงกับที่ส่ง
- ค่านอกช่วงหรือไม่อยู่ในตัวเลือกต้องถูกปฏิเสธฝั่งระบบ ไม่ใช่ตรวจเฉพาะ UI
- เมื่อจำลองเครือข่ายล้มเหลว ต้องแสดง error และเปิดให้ retry; ส่งซ้ำคำขอเดิมหรือ reconnect ต้องไม่เพิ่มจำนวนคำตอบซ้ำ และคำตอบที่ยืนยันแล้วต้องไม่หายหลัง reload/restart
- หลักฐานที่ต้องเก็บ: request/response ที่ตัด identifiers อ่อนไหวออก, ผลอ่านกลับ และจำนวนรายการก่อน/หลัง retry/restart

### AC-03 — Facilitator control และ role/session isolation
- Facilitator เปิดคำถามและปิดรับได้; participant เห็นสถานะที่ตรงกัน หลังระบบยืนยันว่าปิดรับแล้ว การส่งใหม่ต้องถูกปฏิเสธโดยไม่แสดง saved
- Participant ต้องเรียกคำสั่งควบคุมหรืออ่านหน้าข้อมูลจำกัดสิทธิ์ไม่ได้ แม้เรียก endpoint โดยตรง
- ใช้สอง session ที่มีข้อมูลต่างกัน ตรวจว่า credential/identifier ของ session หนึ่งไม่ทำให้อ่านหรือแก้ข้อมูลอีก session ได้ และไม่มี aggregate ปะปน
- หลักฐานที่ต้องเก็บ: role/session matrix, ผลปฏิเสธจากระบบ และข้อมูลเปรียบเทียบของสอง session; วิธีพิสูจน์สิทธิ์ยังรอผู้ใช้เลือก

### AC-04 — Live aggregate สำหรับผู้เข้าร่วมพร้อมกัน 30 คน
- ใช้ synthetic participants 30 คนส่งคำตอบผ่าน API จริงไปยัง DB จริง โดยชุดคำตอบที่ทราบจำนวนและการกระจายล่วงหน้า
- Aggregate ต้องตรงกับข้อมูลที่บันทึกจริงทั้งจำนวนและการกระจาย ไม่รวม duplicate; กรณีไม่มีคำตอบแสดง empty state ไม่สร้างกราฟข้อมูลสมมติ
- ตัดและต่อเครือข่ายผู้ชม aggregate แล้วต้องเห็น reconnect/stale state และกลับมามีค่าตรงกับ DB โดยไม่ต้องสร้าง session ใหม่
- วัดเวลาเริ่มจากระบบยืนยันการบันทึกจนผู้ชมเห็นผล และรายงาน latency กับจำนวนการส่งสำเร็จ/ล้มเหลวจริง เกณฑ์ latency และสภาพเครือข่ายต้องได้รับอนุมัติก่อนตัดสิน PASS
- หลักฐานที่ต้องเก็บ: วิธีจำลอง concurrency, timestamps, ผล aggregate เทียบ DB และผล reconnect; ยังไม่มี benchmark ใน C0

### AC-05 — Post-session summary ที่มีบริบทและคุ้มครองข้อมูล
- เมื่อปิด session และเปิด summary ใหม่ ผู้มีสิทธิ์ HR ต้องเห็นข้อมูลจาก persistent DB ที่ตรงกับคำตอบจริง ไม่ใช่ mock chart
- ทุกคำถามต้องแสดงจำนวนผู้ตอบและฐานคำนวณอย่างชัดเจน หากแสดง response coverage ต้องใช้จำนวนผู้เข้าร่วมที่นิยามและอนุมัติแล้ว; หากไม่ทราบฐาน ห้ามเดาเปอร์เซ็นต์
- แสดงข้อความว่าข้อมูลเป็น self-report ไม่ใช่การวินิจฉัยหรือการประเมินพนักงาน; ไม่มีคำตอบต้องแสดงว่าไม่มีข้อมูล ไม่สรุปเป็นจุดอ่อน
- ไม่แสดง participant/session identifiers หรือคำตอบรายบุคคลแก่ HR; กรณีข้อมูลน้อยต้องซ่อนรายละเอียดตามเกณฑ์ขั้นต่ำที่ผู้ใช้อนุมัติ และผู้ไม่มีสิทธิ์ต้องเข้าถึง summary ไม่ได้
- หลักฐานที่ต้องเก็บ: summary เทียบข้อมูลต้นทาง, empty/low-count cases และผลตรวจสิทธิ์; threshold และรูปแบบสิทธิ์ยังเป็น decision เปิด

## 5. HR / privacy: ข้อจำกัดและข้อเสนอป้องกัน

### ข้อจำกัดในการตีความ
- Self-report สะท้อนสิ่งที่ผู้ตอบรายงานในเวลานั้น ไม่ใช่ข้อพิสูจน์ความสามารถ ผลวินิจฉัยทางจิตวิทยา หรือหลักฐานสำหรับตัดสินการจ้าง/เลื่อนตำแหน่ง
- กลุ่มเดียวและผู้ไม่ตอบอาจทำให้เกิด bias ห้ามสรุปแทนทั้งองค์กรหรืออ้างเหตุและผลจาก rating/poll ชุดเดียว
- ใช้ถ้อยคำว่า “หัวข้อที่กลุ่มรายงานความมั่นใจสูง/ต่ำ” แทนการจัดคนว่าเก่ง/อ่อน และ “อุปสรรคที่ผู้ตอบรายงาน” แทนข้อเท็จจริงที่ยืนยันแล้วขององค์กร
- การเทียบคะแนนข้ามคำถามต้องมีความหมายของ scale และทิศทางคะแนนตรงกัน; ยังไม่เสนอ composite score หรือเกณฑ์วินิจฉัย

### ความเป็นส่วนตัวและการเข้าถึง
- ไม่กล่าวว่า anonymous สมบูรณ์: participant/session identifiers, เวลา และ logs อาจทำให้เชื่อมโยงกลับได้แม้ไม่เก็บชื่อ
- ข้อเสนอ: เก็บข้อมูลเท่าที่จำเป็นเพื่อ join, ป้องกัน duplicate และสรุประดับกลุ่ม; แยก identifiers ออกจากข้อมูลที่แสดงให้ HR
- ก่อนตอบต้องอธิบายวัตถุประสงค์ ผู้เห็นข้อมูล ระยะเวลาเก็บ และช่องทางขอลบ/สอบถามตามนโยบายที่ผู้ใช้เลือก ไม่อ้างว่ามีนโยบายที่ยังไม่ได้กำหนด
- กลุ่มย่อยขนาดเล็กเสี่ยงระบุตัวบุคคล ข้อเสนอแรกคือไม่เปิด demographic drill-down และกำหนด minimum count ก่อนแสดงรายละเอียด
- ใช้ข้อมูลสมมติสำหรับ demo แต่เส้นทางรับ-บันทึก-อ่านข้อมูลต้องจริง ห้ามนำ PDF สัมภาษณ์ส่วนตัว, secrets หรือข้อมูลพนักงานจริงไปเผยแพร่ใน public repository
- การควบคุมสิทธิ์ การเก็บ logs การลบข้อมูล และการป้องกันการระบุตัวกลับ ยังไม่ได้ตรวจทางเทคนิคหรือรับรองด้านกฎหมาย

## 6. Decisions ที่ยังต้องให้ผู้ใช้เลือก

| Decision | ข้อเสนอเริ่มต้น (ยังไม่อนุมัติ) | ผลต่อการตรวจรับ |
|---|---|---|
| Scope กิจกรรมและคำถาม | rating + single-choice poll; ไม่มี AI/open text ในรอบแรก | ล็อกตัวเลือก, scale, คำอธิบายคะแนน และ insight definitions |
| สิทธิ์ facilitator/HR และวิธี join | แยกสิทธิ์ควบคุมกับอ่าน summary; participant ไม่ต้องมีบัญชี | กำหนดวิธีตรวจ role/session isolation และการหมดอายุสิทธิ์ |
| กติกาคำตอบ | หนึ่งคำตอบต่อ participant ต่อคำถาม; retry ไม่สร้างรายการเพิ่ม | เลือกว่าจะให้แก้คำตอบหรือไม่ รวมถึง reconnect และคำขอที่มาถึงหลังปิดรับ |
| นิยาม response coverage | จำนวนผู้ตอบที่ไม่ซ้ำต่อคำถาม / จำนวนผู้เข้าร่วมที่มีสิทธิ์ตอบ | ต้องเลือกว่าใช้ผู้ join จริงหรือรายชื่อเป้าหมายเป็นฐาน และจัดการผู้หลุดอย่างไร |
| HR visibility และ privacy | aggregate เท่านั้น, ไม่มี drill-down ใน MVP | เลือก minimum count, retention, deletion, ผู้เข้าถึง logs และข้อความแจ้งการใช้ข้อมูล |
| Runtime/backend และเกณฑ์ realtime | React บน Cloudflare เป็นทิศทางใน AGENTS.md; backend/database/realtime/queue ยังไม่เลือก | ต้องอ่าน architecture options และอนุมัติก่อน implementation; ล็อก latency target, เครือข่าย และ mobile/browser support ก่อน QA |
| UI direction และ external delivery | ภาษาไทยและ accessibility เป็นฐาน; ไม่เผยแพร่ใน C0 | ผู้ใช้อนุมัติ direction และแยกอนุมัติ push/deploy/publish/ค่าใช้จ่ายแต่ละครั้ง |

ไม่มี decision ใดในตารางนี้ถือว่าได้รับอนุมัติเพียงเพราะถูกเขียนในเอกสาร ต้องผ่าน Human Approval ก่อน Antigravity Build และผ่าน QA → Human Accept ก่อน Coordinator ปิดงาน

## 7. ผล C0 และสิ่งที่ยังไม่ตรวจ

ดำเนินการจริง: อ่านเอกสารต้นทางที่ระบุ สรุปขอบเขต แยกข้อเท็จจริง/ข้อเสนอ/decisions และเขียนเอกสาร Product & UX นี้ ไม่เรียกบอตอื่นและไม่แก้ไฟล์อื่น

ยังไม่ตรวจ: application runtime, mobile UI, accessibility จริง, API, persistent DB, live updates, concurrency/latency, duplicate/reconnect/restart, role/session isolation, HR summary, privacy controls, deployment และผลส่งมอบ repository/video เพราะไม่มี application ให้ทดสอบในงานนี้ Acceptance criteria ทุกข้อเป็น NOT RUN ไม่ใช่ PASS; ไม่มีผลการทดสอบแอปหรือการรับรองความพร้อม release
