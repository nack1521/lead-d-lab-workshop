# UI-01-R1 — Soft Workspace: reference และ scale สำหรับ review

## ขอบเขตที่ผู้ใช้ตัดสินใจแล้ว
- ผู้ใช้อนุมัติให้ปรับ AGENTS.md เรื่องใช้ Unslop ตั้งแต่ design audit/direction/spec; แก้สำเร็จแล้วในรอบนี้ หลังความพยายามก่อนหน้าหมดเวลา
- ผู้ใช้เลือก **“ขอยืนยันหรือปรับ visual direction ก่อน ยังไม่เขียน Figma”** จึงไม่มีการ write Figma, hi-fi/prototype, coding, install/pull, deploy หรือ push
- Character ที่ผู้ใช้เลือก: **“ผ่อนคลาย อบอุ่น และใช้พื้นที่โปร่งกว่าเดิม”**
- Reference ที่ผู้ใช้ให้: https://i.pinimg.com/736x/e1/27/db/e127dba6fd41f4699d31cffef19fdd6b.jpg
- คำขอเกี่ยวกับ reference: **“ประมาณรูปนี้แต่อยากให้ scale ให้เหมาะสมกว่านี้หน่อย”**

สถานะ: **CHARACTER_AND_REFERENCE_CONFIRMED / SCALE_AND_TOKENS_PROPOSED**. ผู้ใช้ยืนยัน mood/reference ไม่ใช่ palette/token/hi-fi final และไม่ได้อนุมัติ Figma หรือ C1 build

ผู้จัดทำ: lead-d-setup / Coordinator; ไม่อ้าง Product/QA independent sign-off

## 1. สิ่งที่เห็นจริงจาก reference
Coordinator เปิดภาพด้วย vision_analyze แล้ว: เป็น medical dashboard พื้นขาว/light blue, sidebar พื้นอ่อน, selected nav โทน mint/lime, เส้นแบ่งบาง, การ์ดขอบมน, top metric cards, กราฟวงกลมหลายสีมี shading, bar chart, timeline และ calendar. ภาพตัดขอบขวาของหน้าจอ จึงไม่ใช้ขนาด raster เป็นขนาด viewport หรือ layout ทั้งระบบ

สิ่งที่นำเป็นแรงบันดาลใจ: ความสว่าง สีอ่อนและ white space, ลำดับ context → metrics → เนื้อหา และ chrome ที่ไม่แข็งกระด้าง

สิ่งที่ไม่คัดลอก: brand/logo/ภาพบุคคล/ข้อมูลผู้ป่วย/clinical navigation, AI Insights, tab suite, outer blue glow, 3D chart และ layout เฉพาะทั้งหมด. การมีภาพ reference ไม่แปลว่าอนุมัติ feature ทางการแพทย์หรือ AI. เก็บเฉพาะ URL ไม่คัดภาพต้นฉบับเข้า public repository

**“อบอุ่น” ไม่ได้แปลว่าต้องใช้พื้นน้ำตาล/ส้ม**: ผู้ใช้ชอบ reference โทนขาว/ฟ้าอ่อนด้วย จึงให้ความอบอุ่นมาจาก tone, whitespace, soft neutrals และการสื่อสาร ไม่เลือกตัวเลือก C เดิมให้อัตโนมัติ. A/B/C เดิมเก็บเป็น exploration history

## 2. Direction brief ตาม Unslop (ปรับตาม input ของผู้ใช้)
- **Product:** workshop tool ที่ผู้จัดการเข้าร่วมจากมือถือ ดูคำถามชัด ส่งคำตอบได้มั่นใจ และ facilitator/HR อ่านผลรวมโดยไม่ตัดสินคน
- **Character:** ผ่อนคลาย อบอุ่น โปร่ง
- **World:** ห้อง workshop ที่ชวนคุยและกระดานสรุปที่อ่านง่าย ไม่ใช่ clinical dashboard หรือ SaaS landing page
- **Moments:** คำถามกับตัวเลือกเป็นจุดเด่นบนมือถือ; distribution พร้อมจำนวนตอบเป็นจุดเด่นสำหรับ facilitator; coverage และข้อจำกัดอยู่คู่ผลสำหรับ HR
- **Signature:** สถานะคำถามและผลการบันทึกที่บอก next action ด้วยภาษาคน เช่น “กำลังตรวจสอบว่าคำตอบบันทึกแล้วหรือยัง” แทน technical jargon หรือจุดเขียวตกแต่ง

ไม่มี hero, animated blobs, card grid เพื่อเติมช่องว่าง หรือ generated imagery โดยไม่มีหน้าที่. นำหลักการของ reference มาใช้ ไม่ clone distinct layout/brand

## 3. ข้อเสนอ scale ที่ตอบคำขอผู้ใช้
| ส่วน | ข้อเสนอเพื่อ review | เหตุผล |
|---|---|---|
| Canvas | เป็น app surface ที่เติมพื้นที่ใช้งาน ไม่วางกรอบแอปลอยใน backdrop/glow แบบ presentation | ให้พื้นที่กับงานจริง ไม่เลียนแบบการ crop ของภาพ |
| Participant | single-column, max-width480px; side padding16px ที่จอเล็ก; ไม่มี sidebar/top tab suite | มือถือทำงานหนึ่งอย่างต่อจังหวะ ไม่ย่อ desktop ลงมา |
| Main question | 28–32px, weight500; wrap ได้; body18px/line-height1.6 และ inputอย่างน้อย16px | อ่านไทยและเข้าใจคำถามก่อนเห็นองค์ประกอบอื่น |
| Main actions / fields | ปุ่ม/inputสูงเริ่ม52px; label/helperมีที่ของตัวเอง; สูงเพิ่มตามข้อความได้ | กดง่ายโดยไม่ต้องทำทุกการ์ดและตัวเลขใหญ่ |
| Rating | ที่320pxใช้ตัวเลือกกว้าง48px/สูง52px; ที่390pxเสนอ56px/สูง52px; gap8px; endpoint labelsอยู่ใต้แถว | รักษาขนาดกดโดยไม่บีบข้อความและไม่ทำหน้าจอล้น |
| Desktop shell | page padding24px; navigation rail224pxเฉพาะเมื่อมี approved navigationจริง; main max1280px | sidebarไม่แย่งพื้นที่ผล และไม่เติมnavigationจากภาพเพียงเพื่อให้เหมือน |
| Facilitator | คำถามและสถานะก่อน; main distributionเป็นพื้นที่หลัก; context/countsเป็นรอง; controlแยกจากกราฟ | ไม่ทำตัวเลขบนstat cardsเด่นกว่าคำถามที่กำลังคุย |
| HR | หัวข้อ/session/coverage → distributionหลัก → limitations; empty/partialแยกชัด | อ่านบริบทก่อนตีความ ไม่จัดอันดับบุคคล |
| Metrics | ตัวเลขเริ่ม28–32px เฉพาะค่าหลัก; label16px; ไม่สร้างmetric cardsครบแถวถ้าไม่มีคำถามที่ต้องตอบ | ลดmonument numbersและกราฟตกแต่งที่ไม่มีประโยชน์ |
| Cards / spacing | card padding24px, section gap24–32px, field group16px; radius12pxเป็นcandidate | ความโปร่งมาจากกลุ่มที่ชัด ไม่ใช่ช่องว่างสุ่ม; shapeไม่กลายเป็นpillทุกอย่าง |
| Charts | 2D bars/distribution พร้อมtext/countsและdenominatorจริง; ไม่ใช้3D donutจากreferenceเพียงเพราะสวย | ให้ข้อมูลหลักอ่านเทียบได้และไม่เพิ่มAI/medical semantics |

Geometry ที่คำนวณจริง (ยังไม่ใช่ browser test):
- mobile320: content288px; rating required272px → fits nominal layout
- mobile390: content358px; rating required312px → fits nominal layout
- desktop1280/1440: ถ้ามีsidebar224 + sidepadding24 + gap24 จะเหลือmain984/1144px
- desktop1920: availablemain1624px แต่capที่1280pxได้ ไม่ขยายmetric card/ตัวหนังสือตามหน้าจอทั้งหมด

Sidebarเป็น optional pattern ไม่ใช่ฟีเจอร์ใหม่; C1 fixture flowที่ไม่มีnavigationหลายส่วนไม่ต้องมีsidebar. Tablet/zoom/long Thai labelsให้reflow ไม่ย่อcontrolsจนกดยาก. ตัวเลขทั้งหมดเป็นข้อเสนอ ต้องดูสัดส่วนจริงก่อนfinal

## 4. Proposed color / type roles (ยังไม่อนุมัติ tokens)
| Role | Candidate |
|---|---|
| Background / surface | neutralอ่อน `#F7FAF9` / ขาว `#FFFFFF`; pastelใช้เฉพาะบริเวณที่มีหน้าที่ ไม่ทำทั้งหน้าติดสี |
| Main text / secondary | `#172B2A` / `#4B6160`; ไม่ใช้pastelเป็นสีข้อความหลัก |
| Primary action | dark green-teal `#1F5F55` + ขาว เพื่ออ่านชัด แม้chromeโดยรวมดูsoft |
| Selected state | พื้นmint `#DEF7EF` + text `#183431`; ใช้shape/check/labelด้วย ไม่ใช้สีอย่างเดียว |
| Chart context | surface `#F1F8FB` + text `#245B6B`; accentใช้เพื่อmeaning ไม่ทำทุกseriesแข่งกัน |
| Control / focus | border `#64748B`; focusสีprimary; semantic errorยังชัด ไม่ทำให้อ่อนจนมองไม่เห็น |
| Typeface | Noto Sans Thai 400/500;600เฉพาะจุดจำเป็น; actualfont/license/renderingยังต้องตรวจ ไม่ใช้ความหนาหนักแทนhierarchy |

คำนวณstatic contrastของคู่ที่ระบุ8คู่แล้วผ่านเกณฑ์text4.5:1/control3:1; primary button7.430:1. ใช้full precisionตัดสินและปัดเฉพาะแสดงผล. ไม่ใช่ผลของactual rendered colors, opacity, type size/IME หรือaccessibilityทั้งแอป. ดู [verification.json](evidence/UI-01-R1/verification.json)

## 5. UX contract ที่คงเดิม
ใช้ [UI-01 component/states](UI-01-COMPONENT-STATES.md) และ WF-01-R1 เดิม: nickname/comment optional; answerจำเป็น; draftไม่หาย; accepted immutable; unknownไม่ใช่failureและห้ามสร้างkeyใหม่; savedหลังserverยืนยัน; participantไม่เห็นfacilitator aggregate; F/HRไม่แสดงrawnickname/comment; missingไม่กลายเป็น0. No fake live count และไม่hardcodeผู้เข้าร่วม30เป็นdenominator

Moodที่ผ่อนคลายไม่ใช่เหตุให้ลดconfirmation/security หรือซ่อนerrorที่ต้องเห็น. “AI Insights” ในภาพไม่ถูกนำมาเป็นฟีเจอร์ของงานนี้

## 6. Review gate ถัดไป
ต้องให้ผู้ใช้reviewความเข้าใจreferenceและข้อเสนอscaleนี้ก่อน. ไม่มีการสร้างหน้าจอ/แก้Figmaในรอบนี้ตามคำตอบล่าสุด และไม่ใช้คำว่า “ทำต่อ” เพื่อข้ามscopeที่ผู้ใช้ปฏิเสธแล้ว

หลังได้รับwrite scopeใหม่จึงทำrepresentative P01/P03/F02/H01 แยกจากlow-fi และตรวจspacing→color→icons→copy→type→layout→details→visuals→motionตามUnslop. ให้ผู้ใช้เห็นแบบจริงและลองงานตามhuman-validation planก่อนอ้างว่าถูกใจ/ใช้งานง่าย. C1codingยังต้องอนุมัติแยก

## 7. AI progress / verification
- User decisions: อนุมัติAGENTS.md; ยังไม่เขียนFigma; เลือกrelaxed/warm/airyและให้referenceพร้อมscale concern
- AI work: แก้AGENTSผ่านtoolสำเร็จ; inspectภาพจริง; deriveprinciplesแทนclone; เขียนdirection/scaleและคำนวณstaticcontrast/geometryจริง
- Skills: lead-d-workshop-cycle, writing-for-agents, grilling (เก็บdecisionเฉพาะfrontier), Unslop instruction/safety/signs/visuals (document application). ไม่อ้างIDEactivation/visualrendering/independentQA
- Not run: hi-fi/clickableprototype, userpreference/usability, browser/font/mobile/accessibility, app/runtime tests. ไม่แก้dirtyAI-PROGRESS/handoff; ไม่ติดตั้งหรือpublish
- Credit: Unslop by Damir Sokolovsky (@heydamir), https://github.com/heydamir/unslop, CC BY4.0. ภาพreferenceใช้เพื่อศึกษาgeneralprinciples ไม่แจกไฟล์ต้นฉบับและไม่คัดbrand/data
