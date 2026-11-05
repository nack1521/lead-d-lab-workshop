# UI-02 — Hi-fi review drafts

สถานะ: **READY_FOR_HUMAN_REVIEW**, ไม่ใช่ ACCEPTED / runtime PASS. Coordinator authoring + visual review; ไม่ใช่ independent QA หรือ usability/preference sign-off

## Outcome / scope
ผู้ใช้ขอทำขั้นถัดไปหลัง direction/reference และขอทำต่อจากงานค้าง. สร้างแบบ native editable สี่หน้าบน Figma page1:2 เป็นกลุ่มใหม่ ไม่ทับ WF01 root7:2. เมื่อกลับจาก interruption ตรวจ canvas ปัจจุบันก่อน; text-height/contrast fixes มีอยู่แล้ว จึงไม่ replay creation หรือแก้ซ้ำ

[เปิด UI-02 ใน Figma](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=24-32)

| Screen | Node | Scale | จุดประสงค์ |
|---|---|---|---|
| [P01](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=24-45) | 24:45 | 390×900 | เข้าร่วมห้องโดยไม่สมัคร ชื่อเล่นไม่บังคับ และ privacy copy |
| [P03](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=24-65) | 24:65 | 390×900 | rating พร้อมข้อความไม่บังคับ; แยกเลือกแล้วออกจากบันทึกแล้ว |
| [F02](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=24-99) | 24:99 | 1440×1000 | คำถามปัจจุบัน ผลรวม coverage และปิดรับเฉพาะคำถาม |
| [H01](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=24-146) | 24:146 | 1440×1000 | สรุประดับกลุ่ม coverage อุปสรรคที่รายงาน และข้อจำกัดข้อมูล |

## Design decisions / Unslop application
- รักษา character ผ่อนคลาย อบอุ่น โปร่ง ด้วย neutral surfaces/teal/mint โดยไม่เปลี่ยนเป็นธีมน้ำตาลหรือคัดลอก medical dashboard
- มือถือไม่มี sidebar; คำถามและ action หลักเป็นจุดนำสายตา. ปุ่มหลักสูง52px และช่องกรอกใช้ตัวหนังสือ16px
- Desktop ไม่ใช้ giant KPI/การ์ดเท่ากันทุกชิ้น/3D donut/AI insight ที่ไม่มีหลักฐาน; กราฟ counts และบริบทเป็นเนื้อหาหลัก
- ใช้ Noto Sans Thai, local components3รายการและinstances5รายการภายในUI02 ไม่publishlibraryหรือสร้างglobalstyles/tokens
- ทุกหน้ามีคำบอกว่าเป็นแบบตัวอย่าง; ตัวเลข18/30, การกระจาย4/8/6 และอุปสรรค10/18 เป็น synthetic design fixtures ไม่ใช่ข้อมูลผู้เข้าร่วมจริง ไม่ใช่ผลการทดลองdatabase/realtime

## Findings / fixes retained
1. **Text-height:** ภาพก่อนแก้พบข้อความซ้อน แม้ geometry overflow เดิมไม่แจ้งปัญหา. เก็บ `P01-before-text-fix.png` และ actual `text-fix-readback.json`; ตรวจสดหลังกลับมาว่าข้อความไม่ collapse แล้ว ไม่สร้างscreenใหม่ซ้ำ
2. **Chart contrast:** เก็บ F02/H01-before-contrast-fix; สีแท่งรองเปลี่ยนเป็น#4B746D บน#E5EEEA. ค่าที่คำนวณได้ประมาณ4.42:1 เทียบเกณฑ์3:1. เก็บภาพหลังแก้แยกจากภาพก่อนแก้
3. MetadataXMLมี152elements แต่ nativeAPIมี160nodes เพราะmetadataไม่รวมtextลูกของcomponents/instances8รายการ. ไม่ใช้จำนวนXMLแทนจำนวนnativeทั้งหมด

## Case-level verification
| Case | Result | Evidence / scope |
|---|---|---|
| UI02-01 / สี่native screens | PASS / design only | Fresh MCP readback: root24:32,160nodes; screens4ตามตาราง ไม่ใช่ภาพแปะบนcanvas |
| UI02-02 / Text/layout | PASS / inspected frames | Fresh read: collapsedText=[]; stored final readback87texts/overflow=[]; ดูภาพP01/P03/F02/H01จริง ไม่พบซ้อน/ตัดชัดเจนในภาพเหล่านี้ |
| UI02-03 / Contrast | PASS / bounded calculation | Final readback14textpairs ไม่มีfail; chartbarsเทียบtrackผ่านเกณฑ์ที่ตรวจ ไม่ใช่fullaccessibilityPASS |
| UI02-04 / Preservation | PASS / bounded fingerprint | Fresh old-root count350, structural/text fingerprint c51ebd30 /56151chars ตรงbaseline. FNV1a32ไม่ใช่cryptographic/fullstyleaudit. Storedverificationบันทึกpages0:1/1:3ว่างหลังauthoring |
| UI02-05 / Role/privacy presentation | PASS / screen only | F02/H01ไม่มีrawnickname/comment; ข้อจำกัดข้อมูลและcoverageมองเห็น. ไม่รับรองbackendisolation/security |
| UI02-06 / Sample disclosure | PASS / design only | มีข้อความกำกับข้อมูลตัวอย่าง ไม่อ้างเชื่อมDB/realtime |
| UI02-07 / Keyboard,IME,zoom,responsive,usability | NOT RUN | ไม่มีapp/interactiveprototype/deviceหรือhumanparticipanttest |
| UI02-08 / DB,realtime,load,C1 | NOT RUN | ไม่มีimplementationในงานนี้ และยังไม่เริ่มC1coding |

## Evidence
- [verification.json](evidence/UI-02/verification.json), [final-readback.json](evidence/UI-02/final-readback.json), [native-readback.xml](evidence/UI-02/native-readback.xml)
- [P01/P03 comparison](evidence/UI-02/participant-comparison.png), [P01](evidence/UI-02/P01.png), [P03](evidence/UI-02/P03.png), [F02](evidence/UI-02/F02.png), [H01](evidence/UI-02/H01.png)
- [Recovery verification](evidence/UI-02/recovery-review.json): local recomputation, image hashes และfreshMCP request reference โดยไม่เก็บtemporary asset URLs

## AI collaboration progress
Coordinator ใช้ approved direction/Unslop + Figma Plugin API สำหรับnative design ไม่ใช่application code. มีread-onlydesign-system discoveryก่อนauthoring; ไม่พบpublishedlibrariesที่เพิ่มไว้หรือCodeConnectsource. ScreenshotURLfetchเคยได้HTTP202/emptybody จึงใช้inline screenshot fallback; ไม่ปลอมPNGหรือผลทดสอบ. เก็บactualreadbacksและภาพก่อน/หลัง แทนการเชื่อtoolwriteอย่างเดียว. Resumeด้วยfreshreadก่อน จึงไม่สร้างงานซ้ำ. Shared AI-PROGRESS.md/ANTIGRAVITY-C1.mdมีpendingchangesเดิมจึงไม่ทับ; ใช้บันทึกนี้แทนสำหรับรอบนี้

## Remaining / next gate
ให้ผู้ใช้reviewความรู้สึก สัดส่วน และการอ่านทั้งสี่หน้า. ยังไม่ใช่visualsystemสุดท้าย, ยังไม่ครบ19hi-fiscreens/statevariants, ไม่ใช่clickableprototype, ไม่ได้ทดสอบว่ามนุษย์ชอบ และไม่ใช่approvalเริ่มC1build. ไม่deploy/push/publishlibraryในงานนี้
