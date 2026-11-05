# UI-01 — UX/UI Direction (เอกสารร่างเพื่อเลือกแนวทาง)

**สถานะ: DRAFT_FOR_USER_DECISION — ยังไม่ใช่ approved design system**
ผู้ใช้เลือกให้ “เตรียม UX/UI direction เป็นเอกสารก่อน ยังไม่เริ่ม C1 coding” เมื่อ 2026-11-05. รอบนี้ไม่แก้ Figma, ไม่ทำ HTML/app prototype, ไม่ติดตั้ง dependencies และไม่เริ่ม build/pull/deploy/push

ผู้จัดทำ: lead-d-setup / Coordinator. เป็น Coordinator draft ไม่อ้างว่า Product Bot หรือ Senior Tester รับรองแล้ว

## 1. Outcome และฐานที่คงไว้
เลือก character, visual hierarchy และ component language ที่ใช้ร่วมกันใน participant mobile, facilitator desktop และ HR summary โดยไม่เปลี่ยน flow ที่ผู้ใช้ยืนยันแล้ว

อ่าน [WF-01-R1 baseline](WF-01-R1-DELIVERY.md) และภาพ participant-final/facilitator/hr-summary จริงก่อนเสนอแนวทาง. ภาพเดิมเป็น grayscale annotated low-fi ไม่ใช่ visual direction หรือ clickable prototype ที่อนุมัติแล้ว

ข้อสังเกตจากภาพ: participant มี question → answer → optional comment → CTA เป็นแกนหลัก; facilitator เน้นคำถามปัจจุบัน/จำนวนตอบ/กราฟและปุ่มควบคุม; HR ต้องแยก summary, empty และ partial ให้ชัด. ข้อความ annotation ยาวใน wireframes เป็นเอกสารกำกับ ไม่คัดทั้งหมดไปใส่ UI จนล้นหน้าจอ

คง 19 screen IDs เดิม (P10/F6/H3) ตาม archived inventory/readback. UI-01 ไม่สร้างหรือแก้ Figma nodes และไม่ได้ตรวจ live canvas ใหม่

## 2. Surface และบุคลิกของผลิตภัณฑ์
- **Participant — Operate:** ทำงานเดียวในแต่ละจังหวะ กดง่ายบนมือถือ ไม่ทำ dashboard/sidebar ให้ผู้เข้าร่วม
- **Facilitator — Monitor + Operate:** มองสถานะล่าสุดและควบคุมคำถามได้ทันที; control ที่จบ session แยกจากการปิดคำถาม
- **HR — Compare / Learn:** อ่านภาพรวมและข้อจำกัดหลัง session; ไม่มี participant-level ranking หรือ raw-comment wall

Product: ช่วยผู้จัด workshop รับคำตอบจากมือถือโดยไม่สมัครบัญชี และให้ facilitator/HR ใช้ข้อมูลรวมที่ตรวจสอบที่มาได้
Character ที่เสนอ: สุขุม อ่านง่าย ไม่กล่าวโทษคน. World: โต๊ะทำงานของผู้ดำเนิน workshop ไม่ใช่เวที marketing
Moments: เน้นคำถามหนึ่งข้อและ distribution ที่มี label/จำนวนชัด; ไม่ใช้ภาพตกแต่งแทนข้อมูล
Signature: แถบสถานะข้อความ “เปิดรับคำตอบ / กำลังตรวจสอบ / ปิดรับแล้ว” ที่แยก connection ออกจากผลการบันทึก ไม่ใช้จุดเขียวเป็นหลักฐาน saved

Mentimeter/Slido เป็นแรงบันดาลใจด้าน question focus และการเข้าร่วมง่าย; team health dashboards เป็นแรงบันดาลใจด้านบริบท/coverage/ข้อจำกัดข้อมูล. ไม่ clone brand/layout และไม่เพิ่มฟีเจอร์ของแพลตฟอร์มเหล่านั้นทั้งชุด

## 3. ตัวเลือก Direction

### A — Workshop Clarity (แนะนำ)
- สีหลัก teal เข้ม `#0F766E`, พื้น `#F8FAFC`, พื้นการ์ดขาว, ตัวอักษร `#0F172A`
- Participant: one-column, headline คำถามเด่น, answer controls ขนาดใหญ่, optional comment เป็นลำดับรอง
- Facilitator: current-question/context ด้านบน → distribution พื้นที่หลัก → control row ที่แยกจากกราฟ ไม่ต้องมี sidebar ถาวร
- HR: summary สั้น → coverage/context → distribution → limitations. เริ่มด้วยข้อมูลที่มี ไม่ใช้ stat cards ทุกอย่างขนาดเท่ากัน
- Density กลาง; card radius8px, control8px, body16px/line-height1.6
- ข้อแลกเปลี่ยน: ดูเป็นเครื่องมือ workshop ที่สุขุมมากกว่าหน้ารายงานองค์กรแบบหนาแน่น. Teal สื่อ action/selected ไม่ได้แปลว่า “คะแนนดี”

### B — Executive Focus
- สีหลัก blue `#1D4ED8`, พื้น `#F8FAFC`, ตัวอักษร `#0F172A`
- Participant ยังคงคำถามเดียวต่อจังหวะเหมือน A ไม่เพิ่ม nav
- Facilitator/HR จัด context เป็นแถว compact และใช้ chart คู่ textual counts ที่อ่านเทียบง่าย; ความหนาแน่น desktop สูงกว่า A
- Radius6px, body16px/line-height1.6; headings กระชับและพื้นที่ card น้อยกว่า A
- ข้อแลกเปลี่ยน: เหมาะกับการอ่านผลแบบผู้บริหาร แต่ต้องระวัง desktop density ไหลไปทำให้ participant mobile แน่น. ไม่เพิ่ม filters/navigation ที่ไม่มีใน approved flow

### C — Warm Facilitation
- สีหลัก amber-brown `#92400E`, พื้น `#FFFBF5`, ตัวอักษร `#292524`
- Participant ให้พื้นที่คำอธิบายสั้นและ field มากขึ้น; tone เป็นมิตรแต่ไม่ใส่ emojis/gamification
- Facilitator เน้น status/instruction ก่อนกราฟ; HR ใช้ sections และ dividers มากกว่าการ์ดแน่นๆ
- Radius12px, body18px/line-height1.65, spacing โปร่งกว่า A
- ข้อแลกเปลี่ยน: สนับสนุนการทำ workshop ที่ผ่อนคลาย แต่ใช้พื้นที่มากและต้องแยกสี action ออกจาก warning ด้วยข้อความ/สัญลักษณ์ ไม่ใช้สีอย่างเดียว

ทั้งสามตัวเลือกใช้ flow/สิทธิ์/privacy/state contract เดียวกัน ต่างที่ visual character, hierarchy และ density ไม่ใช่เพิ่มหรือลด feature. ไม่ผสม A/B/C เป็นสามระบบในผลิตภัณฑ์เดียว

## 4. Proposed baseline tokens (ยังไม่ normative)
| Token | ข้อเสนอ |
|---|---|
| Font | Noto Sans Thai 400/500/600; fallback system sans ที่รองรับไทย. ใช้ family เดียวก่อน; actual availability/license/self-hosting ต้องตรวจตอน implement ไม่โหลด font ในรอบนี้ |
| Body / input | 16px ขึ้นไป; Thai line-height1.6; ไม่ใช้ negative letter-spacing |
| Heading / question | section24px; main question28–32px ตามพื้นที่; ใช้ wrap ไม่ตัดสาระ |
| Spacing | 4/8/12/16/24/32px; participant side-padding16px ที่ขนาดเล็ก |
| Control / touch target | interactive target อย่างน้อย48×48px; poll row min-height52px และขยายตามข้อความ |
| Border | interactive control `#64748B`; decorative divider `#E2E8F0` ใช้เมื่อไม่ใช่ขอบเขตจำเป็นต่อการเข้าใจ control |
| Text | primary ตาม direction; secondary `#475569` ไม่ใช้สีจางจนอ่านไม่ออก |
| Focus | ring สี accent หนา3px offset2px และต้องตรวจไม่ถูก clip ใน UI จริง |
| Success | text `#166534` บน `#F0FDF4` พร้อมข้อความยืนยันจาก server เท่านั้น |
| Error | text `#B91C1C` บน `#FEF2F2` สำหรับ confirmed failure ไม่แทน unknown |
| Warning | text `#92400E` บน `#FFFBEB` พร้อมคำอธิบาย/next action |
| Unknown | text `#475569` บน `#F1F5F9`; label “ยังยืนยันการบันทึกไม่ได้” ไม่ใช้ “ส่งไม่สำเร็จ” |
| Motion | ใช้เท่าที่อธิบายสถานะ; ไม่ทำ looping decoration; เคารพ prefers-reduced-motion |

[การคำนวณจริง](evidence/UI-01/verification.json): opaque foreground/background ที่ระบุ 30 คู่ผ่านเกณฑ์ที่ตั้งไว้ (text4.5:1, control/focus3:1). ปุ่ม primary ข้อความขาว: A5.473:1, B6.702:1, C7.090:1. เป็น static token calculation ไม่ใช่ WCAG certification ของ UI, font rendering, screenshots หรือ browser

ยังไม่สร้าง root DESIGN.md/exports เพราะ direction ยังไม่อนุมัติ; ไม่รัน npx/ติดตั้ง design CLI ในงานเอกสารนี้. เมื่อเลือก direction จึง formalize tokens เพียงชุดเดียวและ validate ก่อนส่ง implement

## 5. Layout / responsive contract ที่เสนอ
- Participant: mobile-first single-column ตั้งแต่320px; max content480px บนจอใหญ่; ไม่ล็อกความสูงตาม wireframe844px และไม่ใช้ input placeholder แทน label
- ที่ viewport320px + padding16px ได้ content288px; rating5ตัว ตัวละ48px gap8px ใช้272px ตามการคำนวณจริง. ต้องทดสอบ browser/font/zoom/IME อีกครั้ง; ถ้าพื้นที่ไม่พอให้ wrap/reflow ไม่ย่อ target จนกดยาก
- Facilitator/HR: ต่ำกว่า768px เรียงหนึ่งคอลัมน์, ตั้งแต่768px แบ่ง context/results ได้เมื่ออ่านง่าย, content max1200px. เป็น design breakpoint ไม่ใช่ runtime ที่พิสูจน์แล้ว
- ไม่มี fixed bottom action ที่บัง keyboard/focus; หากภายหลังเลือก sticky ให้ตรวจ safe area, viewport resize และ200% zoom ก่อนรับงาน
- กราฟมี textual labels/counts คู่กัน; อย่าใช้ tooltip/hover เป็นทางเดียวในการอ่านค่าบนมือถือ

## 6. UX/privacy ที่ห้ามเปลี่ยนเพราะเรื่องหน้าตา
- ไม่ต้องสมัครบัญชี; nickname optional และชื่อซ้ำได้. ไม่ใช้คำว่า anonymous100% เพราะ nickname/comment อาจระบุตัวตน
- P03/P04 answer จำเป็น แต่ comment optional; whitespace-only optional = absence ไม่เป็น0/partial
- แยก submitting/saved/confirmed-not-saved/unknown. Saved ต้องหลัง authoritative confirmation ไม่ใช่ปุ่มถูกกดหรือ WebSocket ต่อได้
- Unknown เก็บ draft และ reconcile key/payload เดิม; edited key ใหม่ได้หลัง terminal confirmed non-save และคำถามยังเปิดเท่านั้น
- ปิดคำถามแล้วไม่ส่งร่างอัตโนมัติ; accepted receipt อ่าน/replayตามสิทธิ์ได้. Normal session end/read-only grace และ hard expiry/revoke ใช้ proposed R02/R03 contract ไม่ออกแบบ endpoint bypass auth
- Participant ไม่เห็น aggregate ของ facilitator; F/HR ไม่เห็น raw nickname/comment. HR ไม่เปรียบเทียบคน และไม่ตีความ absence เป็นคะแนน0
- Coverage ต้องบอก denominator จริงที่มีที่มา ไม่ hardcode30หรือคัดตัวเลขตัวอย่างในภาพไปเป็นผล live. HR insight formulas/minimum group size/retention ยังเป็น decision gate ภายหลัง ไม่กำหนดขึ้นเองใน UI direction

## 7. ลำดับงานหลังเอกสารนี้
| ขั้น | ผลส่งมอบ | Gate |
|---|---|---|
| UI-01 (รอบนี้) | direction A/B/C + component/state contract + static verification | ผู้ใช้เลือก direction หรือให้ปรับ |
| UI-02 | formal token spec และ hi-fi representative screens P01/P03/F02/H01 ก่อนขยาย state variants | อนุมัติ scope/ตำแหน่ง Figma และ visual direction ก่อน write; ไม่เขียนทับ low-fi |
| UI-03 | review states/responsive/accessibility ของแบบ และ handoff ต่อ slice | ผู้ใช้ยืนยัน design ของส่วนที่จะสร้าง; review ไม่ใช่ app QA |
| C1 Local Build | functional technical proof ตาม R03 โดย Antigravity | ยังต้องมี human build approval แยก; เลือก direction ไม่เท่ากับอนุมัติ coding |
| C2–C4 / C5 | implement UI ที่อนุมัติทีละ slice → runtime UX/visual QA → hardening | ข้อกำหนดจริงและ scope ของแต่ละรอบ ไม่ขยายจากเอกสารนี้อัตโนมัติ |

C1 ไม่ต้องรอ hi-fi ทั้ง19หน้าถ้าในภายหลังผู้ใช้เลือกให้ทำ technical proof ก่อน แต่ขณะนี้ผู้ใช้เลือกเอกสารก่อน จึงยังคง coding hold. UI-02/C1 ไม่เริ่มในรอบนี้

## 8. สิ่งที่ต้องตัดสินใจ
เสนอ **A — Workshop Clarity** เป็น baseline สำหรับรอบต่อไป. ผู้ใช้เลือก A/B/C หรือแก้ character/accent/density ก่อนทำ hi-fi. ยังไม่ต้องเลือก framework UI library หรือ chart library เพราะเป็น implementation decision ที่ต้องดูความจำเป็นจริง

## 9. Verification / AI progress
- Request/decision: เตรียม UX/UI direction เป็นเอกสารก่อน ไม่เริ่ม C1 coding
- AI contribution: Coordinator อ่าน baseline/docs และดูภาพทั้งสาม role, เขียนข้อเสนอและ state/component specification, คำนวณ contrast/nominal rating fit จริง
- Skills: lead-d-workshop-cycle, writing-for-agents, claude-design (process/surface), design-md (token structure reference). ไม่อ้าง official DESIGN.md lint หรือ Product/QA independent sign-off
- หลักฐาน: [verification.json](evidence/UI-01/verification.json); [component/states และ review checklist](UI-01-COMPONENT-STATES.md)
- ข้อจำกัด: ไม่มี rendered new UI, usability test, live Figma read/write, app code, browser/mobile/accessibility runtime หรือ approval ให้ build. เอกสารก่อนหน้าคงเดิม; progress รอบนี้แยกเพราะ AI-PROGRESS/handoff มีงานแก้ค้าง
