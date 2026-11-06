# UI-03 — Composition reset / proposals

สถานะล่าสุด: **HOLD — ผู้ใช้ส่ง reference Fastwork และถามแนว soft neutral / liquid glass**. หยุดขยายสามแนวด้านล่าง; เก็บเป็น exploration history ไม่ใช่แนวที่ผู้ใช้เลือก. ข้อสังเกตจากภาพ: ตัวเว็บเห็นฐานขาว/เทา รูปทรงโค้ง ปุ่มดำ และsidebarแคบ; glassที่ชัดอยู่ในmacOS/Safarichrome ไม่ควรเหมารวมว่าเว็บเป็นLiquidGlassทั้งหมด. ข้อเสนอใหม่คือSoftMonochrome + selective frosted controls โดยเก็บคำถาม/กราฟบนพื้นทึบเพื่ออ่านง่าย. ผู้ใช้เลือกแนวที่สองแล้ว และสร้างแบบ [UI-04 Soft Monochrome + Selective Glass](UI-04-SELECTIVE-GLASS.md) แยกชุดใหม่; UI03คงเป็นexplorationhistory ไม่ขยายต่อ และการเลือกdirectionไม่ใช่รับรองแบบสุดท้ายหรืออนุมัติcoding. ไม่คัดลอกข้อมูลprofile/brandจากภาพลงแบบหรือrepo

สถานะก่อนเปลี่ยนreference: EXPLORATION ไม่ใช่ approved UI. ผู้ใช้ปฏิเสธUI02ทั้งหมดว่าเป็นAI slop และขอออกนอกกรอบเดิม. UI02=REJECTED_BY_USER; ไม่ใช้เป็นcomponent/layoutfoundation. คงไฟล์/แบบเก่าเป็นประวัติ. ไม่เริ่มC1codingหรือpublish

## Audit before treatment
ดูภาพจริง participant-comparison และH01ของUI02อีกครั้งแล้ว: typography/roundness/card anatomyซ้ำทุกrole, copyปลอบใจ+technicaldisclaimersแย่งtask, HRเหมือนfacilitatorเปลี่ยนหัวข้อ, ความโปร่งเกิดจากframeสูงตายตัวมากกว่าจังหวะการอ่าน. Contrast/layoutchecksไม่ได้พิสูจน์ว่ามีdesigncharacterหรือผู้ใช้ชอบ

Claude-design heuristic score:2/10ในchecklistสิบข้อ (monument-statและwrong-surfaceบางส่วน); เป็นsubjectiveauditของCoordinator ไม่ใช่คะแนนผู้ใช้ และไม่หักล้างความเห็น100%slopของผู้ใช้. Checklistไม่ครอบคลุมtemplateanatomyทุกแบบ จึงไม่ใช้คะแนนเป็นexitgate. Unslop/template-look:sameanatomy/near-identicaltints/everysectionboxed/oneaccentrepeatedหลายกล่อง คือจุดที่ต้องcomposeใหม่ ไม่ใช่recolor

## Surface-first
P03=Configure/submit one answer. F02=Operate, Monitorรอง. H01=Decide/Learnจากหลักฐาน ไม่ใช่liveconsole. เก็บprivacy, atomicanswer+comment, explicitnot-saved, no rawindividualdatainF/HR และnozero-for-missingจากacceptedflow. ไม่เพิ่มAIranking/export/dragdrop/reorderingหรือfeaturesใหม่เพราะreferenceมี

## Three original directions — not three palettes
A / Workshop Stage: คิดจากการคุมห้องกิจกรรม. Participantโจทย์เดียว/scaleเหมือนบัตรลงคะแนน; facilitatorเวทีคำถาม+กราฟที่อ่านไกลและแถบcontrolชัด; HRเป็นdebriefsheetแยกจากstage. Ink/neutral/citronaccent, controlsเหลี่ยม4px ไม่มีKPIcards. เสี่ยงถ้าenergyสูงเกินรสนิยมผู้ใช้
B / Working Paper: คิดจากworksheetและรายงานอ่านจริง. Participantเลือกแถวที่มีคำอธิบาย; facilitatorrun-sheetควบคู่คำถามและจำนวนตอบ; HRreadingorderแบบบทสรุป/ตารางหลักฐาน. SerifThaiforheadlinesถ้ามีfontจริง, restrainedwarmink/rust ไม่ใช่pastelcards. เสี่ยงdensity/scrollบนมือถือและต้องพิสูจน์ความเร็วตอนดำเนินห้อง
C / Signal Desk: คิดจากcontrolsurfaceและdataview. Participantcompactsegmentedrating+commentvisible; facilitatorคำถาม/สถานะ/การกระจาย5ระดับวางเป็นtableconsole; HRquestion-ledledgerพร้อมฐานข้อมูล ไม่ยกconsoleมาเป็นdashboard. Coolneutral/cobalt, sharpseparators/tabularalignment ไม่cloneIBMbrand. เสี่ยงformal/technicalเกินไป

## Skill usage / references
- Unslop byDamirSokolovsky CC-BY-4.0: SKILL.md,PROJECT-SAFETY,signs,visuals ใช้auditและcompose ไม่รันoptionalhelpers
- claude-design: surface-first, separateaudit/treatment, threecompositionvariants; ใช้processเท่านั้น ไม่เขียนHTML/appcodeแทนAntigravity
- popular-web-designs: อ่านMiroและIBMเพื่อศึกษาหลักการcanvas/functionalzoning/typographicdensity ไม่copybrandedlayouts, tokensหรือโหลดUIkit
- Mentimeter live-polling / Slido live-polling officialpages: code-on-phone, onequestion/result, facilitatorcontrols เป็นหลักfunctional ไม่claimvisualinspectionจากtextfetchและไม่เพิ่มfeatureจากreference
- Figma-use/generate-design: nativeeditableauthoringตามscopeเดิมpage1:2/newgroups; noexistingUI02reuse/no globalstyle/librarychanges

## Delivery scope
เสนอcompositionสามแนว แต่ละแนวมีP03/F02/H01รวมเก้าหน้าrepresentative; ไม่อ้างทำhi-fiครบ19states, P01ทุกแนวหรือclickableprototype. ตัวเลขใช้syntheticfixtureเดิมเพื่อเทียบlayoutอย่างเป็นธรรม; นับ/geometry/screenshotsตรวจจริง แต่humanpreference/runtimeยังNOTRUN. Footerต่อภาพแจ้งข้อมูลสมมติแบบquietไม่ใส่technicalcopyเต็มหน้าซ้ำ

## Exit
มีภาพให้เลือกจริง แสดงข้อแลกเปลี่ยนและความต่างของinteraction/IA ไม่ใช้contrastPASSแทนการยอมรับจากผู้ใช้. ผู้ใช้เลือกหรือปฏิเสธได้ก่อนขยายทุกหน้าหรือส่งลุงbuild. AI-PROGRESS/handoffC1dirtyเดิมไม่ทับ ใช้เอกสารนี้เก็บprogressชั่วคราว
