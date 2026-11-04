# Figma Discovery — Local Design Brief

สถานะ: DRAFT — รอผู้ใช้อนุมัติ flow และขอบเขต frame ก่อนดำเนินการออกแบบใน canvas
Product direct Figma: **READ VERIFIED** เมื่อ 2026-11-04 เวลา 15:02 (+07) — ดู [หลักฐานการอ่านโดย Product โดยตรง](FIGMA-READ-VERIFICATION.md). Design brief ยังเป็น DRAFT และยังไม่อนุมัติ canvas writes

เอกสารนี้เป็น local design brief เท่านั้น ไม่ใช่ผลตรวจ canvas โดย Product ไม่ใช่ UI ที่สร้างแล้ว และไม่ใช่ผลทดสอบ application

## 1. ขอบเขตและหลักฐาน

อ่านเอกสารใน workspace:
- `docs/INSTALLATION-VERIFICATION.md:17–27` — หลักฐาน Coordinator อ่าน Figma และ blocker ของ Product
- `docs/product/FOUNDATION-REVIEW.md:30–100` — ขอบเขต MVP, UX states, acceptance criteria และ HR/privacy
- `AGENTS.md` และ `docs/TEAM-WORKFLOW.md` — ownership, non-coding และ human approval gates

### ข้อเท็จจริงตามหลักฐานในเอกสาร

ตาม `docs/INSTALLATION-VERIFICATION.md` Coordinator เชื่อมต่อ Figma สำเร็จและเรียก read-only `get_metadata` บน file key `RUOnC9Q15LA7DCc6rzhZtN` พบ pages ดังนี้:

| Node ID | Page | สิ่งที่ metadata ระบุ |
|---|---|---|
| `0:1` | 01 Brief & Foundations | canvas ไม่มี child elements |
| `1:2` | 02 Wireframes & Flows | canvas ไม่มี child elements |
| `1:3` | 03 UI & Handoff | canvas ไม่มี child elements |

URL node-id `1-3` ถูกแทนด้วย `1:3` ตาม schema ในการตรวจที่เอกสารบันทึกไว้ ทั้งสาม page ว่างตาม metadata ที่ Coordinator อ่านในครั้งนั้น ไม่ใช่ข้อยืนยันสภาพไฟล์ปัจจุบันจากการเรียกใหม่ และไม่ใช่การตรวจ screenshot

สถานะตอนจัดทำ brief ครั้งแรก: Product direct access เคย **BLOCKED** เพราะรอบเชื่อมต่อ interrupted/not_connected. ต่อมาผู้ใช้เชื่อม profile `lead-d-product` สำเร็จ และ Product เรียก get_metadata ของไฟล์/pages โดยตรงผ่านแล้วตาม FIGMA-READ-VERIFICATION.md; ไม่ได้คัดลอก credentials จาก Coordinator และยังไม่มี canvas writes

### การดำเนินการในงานนี้

หยุดต่อยอดรอบเชื่อมต่อเดิม ไม่ install/authorize ใหม่ ไม่เรียก manage_connections, MCP, browser หรือบอตอื่น ไม่คัดลอก OAuth tokens ไม่แก้ config และไม่เขียน canvas สร้างเฉพาะเอกสารนี้ ไม่แก้ไฟล์อื่น ไม่เขียน application code และไม่ commit

หมายเหตุความสดของเอกสาร: FOUNDATION-REVIEW เป็นข้อเสนอ C0 และยังมีรายการ backend เปิดอยู่ แต่ AGENTS.md ปัจจุบันระบุว่าผู้ใช้เลือก React/Cloudflare + Elysia/Bun/Railway + PostgreSQL แล้ว งานนี้ไม่เปลี่ยน stack และไม่แก้เอกสารเดิม; versions, ORM, auth และ origin topology ยังรอพิสูจน์/ตัดสินใจตาม AGENTS.md

## 2. เป้าหมายและขอบเขต design draft

ออกแบบเส้นทางสั้นที่สุดที่ครอบคลุม:
- Mobile participant: join → waiting → rating/single-choice poll → ผลยืนยันการส่ง → waiting/closed
- Desktop facilitator: เปิด session → lobby → เปิด/ปิดคำถาม → live aggregate → ปิด session
- Desktop HR: เข้าถึง session ที่มีสิทธิ์ → post-session summary ระดับกลุ่ม

ยังไม่รวม participant accounts, native mobile app, AI insights, ranking รายบุคคล, open-text analysis, demographic drill-down และ export รายบุคคล การวาดข้อมูลตัวอย่างในอนาคตต้องติดป้ายว่าเป็น design example ไม่ใช่ runtime evidence

ขนาด frame, font และ visual direction ยังไม่กำหนดเป็นข้อสรุป เริ่มด้วย low-fidelity เพื่ออนุมัติ information hierarchy และ states ก่อน ไม่อ้างว่ามี design system เดิมเพราะ metadata ไม่แสดง UI ที่นำมาประเมินได้

## 3. Draft frame inventory

รหัสด้านล่างเป็น local reference ที่เสนอ ไม่ใช่ Figma node IDs และยังไม่มี frame เหล่านี้บน canvas ตามหลักฐานที่อ่าน States อาจเป็น variants หรือ annotations ของ frame เดียวกันเพื่อลดจำนวนหน้าที่ต้องดูแล

### Mobile participant

| Ref / frame | เนื้อหาและ action หลัก | States ที่ต้องครอบคลุม | เกณฑ์อ้างอิง |
|---|---|---|---|
| P-01 Join & data notice | ชื่อ session/รหัส, คำอธิบายการใช้ข้อมูล, ช่องรหัสเมื่อไม่ได้เข้าจากลิงก์, ปุ่มเข้าร่วม; ไม่ขอชื่อโดยไม่มีเหตุผล | initial, checking/loading, invalid code, session not found, service error + retry, closed session | AC-01, AC-05 |
| P-02 Waiting lobby | ยืนยันว่าเข้า session ใด, “เข้าร่วมแล้ว รอผู้ดำเนินกิจกรรมเปิดคำถาม”; ไม่มีปุ่มส่งที่ดูเหมือนใช้งานได้ก่อนเปิดรับ | waiting, loading current state, disconnected/reconnecting, recovered, session closed | AC-01, AC-03 |
| P-03 Answer question | คำถามเดียว, ความหมาย rating หรือตัวเลือก poll, ตัวเลือกที่เลือก, ปุ่มส่ง; ไม่ส่งอัตโนมัติเมื่อแตะตัวเลือก | unanswered, selected, validation error, sending, send failed, outcome unknown, question closed during submit | AC-02, AC-03 |
| P-04 Submission result | แสดง “บันทึกคำตอบแล้ว” เฉพาะเมื่อยืนยัน persistence; ไป waiting หรือคำถามถัดไปตามสถานะระบบ | saved, checking after reconnect, recovered saved, not saved + retry, closed without save | AC-02, AC-03 |
| P-05 Session ended | แจ้งว่าปิดรับแล้ว, ขอบคุณ, ข้อความเรื่องข้อมูลตามนโยบายที่อนุมัติ; ไม่ส่งต่อ HR link ให้ participant | closed, checking final submission, final status unavailable | AC-02, AC-03, AC-05 |

คำตอบที่ผลส่งยังไม่ทราบต้องไม่ถูกเปลี่ยนเป็น saved หรือ failed โดยการคาดเดา เมื่อ reconnect ให้ reconcile กับสถานะที่ระบบยืนยันก่อนเสนอส่งซ้ำ; ไม่รับประกันเก็บ draft ข้าม reload จนกว่าจะอนุมัติและทดสอบวิธีเก็บจริง

### Desktop facilitator

| Ref / frame | เนื้อหาและ action หลัก | States ที่ต้องครอบคลุม | เกณฑ์อ้างอิง |
|---|---|---|---|
| F-01 Session entry/setup | session ที่มีสิทธิ์, ชื่อ session และรายการคำถามที่อนุมัติ; action เปิด session ตาม scope | loading, ready, starting, error + retry, access denied/expired | AC-03 |
| F-02 Lobby & join instructions | ลิงก์/รหัส participant, จำนวนผู้ join ที่ระบบยืนยัน, ปุ่มเปิดคำถาม; ไม่แสดงชื่อหรือคำตอบรายบุคคล | no participants, waiting, opening question, open failed, stale/reconnecting | AC-01, AC-03 |
| F-03 Live question & aggregate | คำถามปัจจุบัน, จำนวนผู้ตอบ, การกระจาย, ฐานคำนวณ, สถานะสด/ข้อมูลล่าสุด; action ปิดรับ | collecting, zero responses, updating, stale/reconnecting, read error, closing, close failed, closed question | AC-03, AC-04 |
| F-04 Between questions | แสดงว่าปิดคำถามแล้ว, ผลรวมที่ยืนยัน, action เปิดข้อถัดไปหรือจบ session | loading confirmed result, ready, next question opening, error, all questions completed | AC-03, AC-04 |
| F-05 End session confirmation/result | อธิบายผลว่าหยุดรับทุกคำถาม, ยืนยัน/ยกเลิก, แจ้งจบเมื่อระบบยืนยัน; ลิงก์ summary เฉพาะผู้มีสิทธิ์ | confirmation, ending, error/not yet closed, ended, outcome unknown + reconcile | AC-03, AC-05 |

F-03 เสนอใช้ aggregate view เดียวก่อน ยังไม่เพิ่ม projector mode หรือหน้าต่างที่สอง ปุ่มควบคุมต้องไม่ดูเหมือนปิดรับสำเร็จหากคำสั่งยังไม่ยืนยัน และเมื่อข้อมูล stale ต้องไม่ใช้ label ว่า live โดยไม่มีคำเตือน

### Desktop HR

| Ref / frame | เนื้อหาและ action หลัก | States ที่ต้องครอบคลุม | เกณฑ์อ้างอิง |
|---|---|---|---|
| H-01 Summary entry & access | เข้าสู่ summary ของ session ที่ระบุ; ไม่เพิ่ม multi-session dashboard ในรอบแรก | checking access/loading, access denied/expired, session not found, summary not ready, load error + retry | AC-03, AC-05 |
| H-02 Post-session overview | ชื่อ session, เวลาหรือสถานะข้อมูล, จำนวนผู้ตอบรายคำถาม, coverage เมื่อมีฐานที่ยืนยัน, ข้อจำกัด self-report | ready, no responses, partial responses, unknown denominator, low-count suppressed, refreshed/read error | AC-05 |
| H-03 Question detail within summary | การกระจายคำตอบรายหัวข้อ, ความหมาย scale, จำนวนและฐานคำนวณ, ข้อสังเกตระดับกลุ่ม; อาจเป็น section ใน H-02 ไม่ใช่หน้าใหม่ | available, missing question data, low-count suppressed, unavailable/error | AC-05 |

H-02/H-03 ไม่แสดง participant/session identifiers ภายในระบบหรือคำตอบรายบุคคล แสดงชื่อ session ที่มนุษย์เข้าใจได้เพื่อไม่สับสนบริบท แต่ไม่เปิดเผย join code หรือ control credential ให้ HR โดยอัตโนมัติ ข้อมูลน้อยให้ข้อความอธิบายการซ่อน ไม่สรุปว่าเป็นศูนย์หรือไม่มีปัญหา

## 4. ข้อเสนอ flow และ transition rules เพื่อขออนุมัติ

### Participant
1. เปิดลิงก์หรือกรอกรหัส → P-01 ตรวจ session และแสดง data notice ก่อนเริ่มตอบ
2. สำเร็จ → P-02 รอ; รหัสผิด/ไม่พบ/ปิดแล้ว → state เฉพาะกรณี ไม่ทำเสมือน join สำเร็จ
3. เมื่อระบบยืนยันว่าคำถามเปิด → P-03 เลือกคำตอบและกดส่ง
4. ส่งแล้ว → sending; หากยืนยันบันทึก → P-04 saved; หากขาดการเชื่อมต่อ/ไม่ทราบผล → ตรวจสถานะก่อน retry โดยไม่เพิ่มคำตอบซ้ำ
5. หลังตอบ → รอคำถามถัดไป; เมื่อ session ปิด → P-05 พร้อมสถานะสุดท้ายของคำตอบที่ยืนยันได้

ข้อเสนอเริ่มต้นคือไม่แสดง aggregate ให้ participant ก่อนตอบ เพื่อลดการชี้นำ และไม่ให้แก้คำตอบหลังบันทึกใน MVP ทั้งสองข้อยังรอผู้ใช้เลือก การเปลี่ยนคำถามหรือปิด session ระหว่างส่งต้องใช้ผลยอมรับ/ปฏิเสธจากระบบ ไม่ตัดสินด้วยเวลา UI ฝั่งเดียว

### Facilitator
1. ผ่านสิทธิ์ → F-01 เลือก/เตรียม session → เปิด → F-02
2. เปิดคำถาม → F-03 collecting; ปุ่มควบคุมแสดง pending จนระบบยืนยัน
3. ปิดรับ → F-04 แสดงผลที่ยืนยัน → เปิดข้อถัดไปวนกลับ F-03
4. จบ session → F-05 ยืนยันผลกระทบ → ended เมื่อระบบยืนยัน
5. เครือข่ายหลุดทุกจุด → แสดง stale/reconnecting และ reconcile สถานะก่อนส่งคำสั่งซ้ำ ไม่เปิด/ปิด session ซ้ำโดยไม่ตั้งใจ

จำนวนผู้ join ไม่เท่ากับจำนวนผู้ตอบ และยังไม่เท่ากับจำนวนคนออนไลน์ในขณะนั้น ห้ามใช้ label สลับกัน

### HR
1. ผ่านสิทธิ์ → H-01 โหลด summary ของ session ที่อนุญาต
2. เสนอให้ดูได้หลัง session ปิดเท่านั้น → H-02; หากยังไม่พร้อมแสดง not ready ไม่ใช่ empty result
3. ดูแต่ละคำถามใน H-03 โดยใช้ distribution และจำนวนจริง ไม่จัดอันดับคนหรือสร้างคะแนนรวมโดยไม่มีนิยาม
4. หากฐานหรือจำนวนต่ำกว่าเกณฑ์ที่อนุมัติ → แสดงคำอธิบายข้อจำกัด/ซ่อนรายละเอียด ไม่อนุมานข้อมูลที่ขาด

## 5. Insight definitions และ privacy ที่ต้องคงไว้

- ผู้ตอบรายคำถาม: จำนวน participant ที่มีคำตอบที่ระบบยอมรับในคำถามนั้น โดยไม่นับ retry เป็นคำตอบเพิ่ม; กติกาแก้คำตอบยังรอตัดสินใจ
- Response coverage: จำนวนผู้ตอบไม่ซ้ำ / จำนวนผู้มีสิทธิ์ตอบตามฐานที่ผู้ใช้เลือก หากยังไม่ทราบฐานให้แสดงจำนวนอย่างเดียว ไม่แสดงเปอร์เซ็นต์ที่เดาขึ้น
- จุดแข็ง/หัวข้อพัฒนา: ใช้คำว่า “หัวข้อที่กลุ่มรายงานความมั่นใจสูง/ต่ำ” พร้อม scale และการกระจาย ไม่ใช่การวัดความสามารถจริงหรือผลวินิจฉัย
- อุปสรรคองค์กร: “อุปสรรคที่ผู้ตอบรายงาน” ไม่ใช่ข้อพิสูจน์เหตุและผลหรือสรุปแทนทั้งองค์กร
- ไม่อ้าง anonymous สมบูรณ์ เพราะ identifiers, เวลา และ logs อาจเชื่อมโยงกลับได้ ต้องกำหนดผู้เห็นข้อมูล การเก็บ/ลบ และ threshold ก่อนใช้จริง
- HR summary ไม่ใช้ตัดสินการจ้าง เลื่อนตำแหน่ง หรือประเมินพนักงานจาก self-report ชุดเดียว; ไม่มีข้อมูลไม่ใช่จุดอ่อน

## 6. Accessibility และภาษาไทย — ข้อกำหนดสำหรับ draft

- ใช้ label ภาษาไทยตรงกับ action และสถานะ เช่น “กำลังส่ง”, “ยังยืนยันการบันทึกไม่ได้”, “บันทึกคำตอบแล้ว”, “ปิดรับคำตอบแล้ว”
- ปุ่ม ตัวเลือก และ errors มี accessible name/คำอธิบาย; keyboard ใช้งานได้และเห็น focus ชัด; ไม่มี focus trap และ dialog คืน focus ให้จุดเรียก
- การอัปเดตผลสดไม่แย่ง focus หรือประกาศทุกค่าจนรบกวน screen reader; ให้ประกาศเฉพาะสถานะสำคัญอย่างเหมาะสม
- ไม่ใช้สีอย่างเดียวสื่อ saved/error/closed และกราฟมีข้อความหรือค่าที่อ่านได้เทียบเท่า
- Mobile รองรับข้อความไทยตัดบรรทัดและการขยายตัวอักษร ไม่บังคับแนวนอน ไม่วาง action สำคัญทับคีย์บอร์ด
- Contrast, touch target, zoom/reflow และ assistive technology ต้องตรวจบน UI จริงใน QA; รายการนี้ยังไม่ใช่ผล PASS

## 7. Decisions ที่ต้องให้ผู้ใช้อนุมัติก่อนเขียน canvas

| เรื่อง | ข้อเสนอเพื่อพิจารณา | สิ่งที่ต้องยืนยัน |
|---|---|---|
| ขอบเขตและลำดับ flow | Participant → facilitator live control → HR summary ตาม inventory นี้ | หน้าใดจำเป็น/ตัดได้ และให้ P-04/H-03 เป็น section หรือ frame แยก |
| คำถามและ scale | rating + single-choice poll ไม่มี open text/AI | ข้อความคำถาม ตัวเลือก ความหมายคะแนน และข้อสรุปที่อนุญาต |
| กติกาคำตอบและปิดรับ | หนึ่งคำตอบต่อคนต่อคำถาม, ไม่แก้หลังบันทึก, retry ไม่เพิ่มรายการ | อนุญาตแก้คำตอบหรือไม่ และกติกาคำขอค้างตอนเปลี่ยน/ปิดคำถาม |
| สิทธิ์และ HR availability | แยก participant/facilitator/HR; HR ดูหลังจบ | วิธีเข้าใช้ อายุสิทธิ์ และข้อมูลที่แต่ละ role เห็น |
| Privacy และ coverage | aggregate เท่านั้น ไม่มี drill-down | denominator, minimum count, retention/deletion และ data notice ที่ใช้จริง |
| Visual direction และอุปกรณ์ | low-fidelity ภาษาไทยก่อน; ไม่เพิ่ม projector mode | ขนาด mobile/desktop เป้าหมาย, font/brand และ direction ที่ผู้ใช้เลือก |
| การจัดวางใน Figma ภายหลัง | เสนอใช้ 01 สำหรับ brief/definitions, 02 สำหรับ wireframes/flows, 03 สำหรับ UI/handoff หลังอนุมัติ direction | อนุมัติ destination และขอบเขต canvas write แยกต่างหาก; ยังไม่ดำเนินการ |

การอนุมัติเอกสารหรือ flow ไม่ได้เท่ากับอนุมัติ canvas write โดยอัตโนมัติ สิทธิ์ที่มีหลักฐานเดิมเป็น read-only เท่านั้น หากจะเขียน Figma ต้องมี approval ใหม่ระบุขอบเขต และต้องแก้ blocker ของช่องทางที่ได้รับอนุญาตอย่างถูกต้อง ไม่ใช้ credential workaround

## 8. ผลส่งมอบและสิ่งที่ยังไม่ตรวจ

ผลจริงของรอบนี้: อ่าน local documents และเขียน local design brief ไฟล์นี้เท่านั้น Inventory และ flows ทั้งหมดเป็นข้อเสนอ ไม่ได้สร้าง frame, component หรือ prototype จริง

ยังไม่ตรวจ: การเชื่อมต่อ Product หลัง interrupted, metadata ปัจจุบัน, screenshot/visual design, canvas structure นอกเหนือจากหลักฐานที่ Coordinator บันทึก, prototype navigation, usability, accessibility บน UI จริง และ application/API/DB/realtime/security/privacy controls ไม่มีผลทดสอบแอปในงานนี้; acceptance criteria จาก FOUNDATION-REVIEW ยังไม่ได้รับการพิสูจน์โดยงานนี้

Next gate: ผู้ใช้อนุมัติ/ปรับ local brief และ decisions ที่เปิดอยู่ก่อนพิจารณางานออกแบบรอบต่อไป Coordinator เป็นผู้รวม progress และติดตาม gate; Product ไม่ปิด ticket หรือ commit เอง
