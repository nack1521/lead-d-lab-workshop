# UI-04 — Soft Monochrome + Selective Glass

สถานะ: **APPROVED_DRAFT / VISUAL_BASELINE**. ผู้ใช้ยืนยัน “ผม approve draft นี้”; ขอบเขตคือ P01/P03/F02/H01 ที่ส่งใน UI04 ไม่ใช่ทุกstate/ทุกหน้าหรือimplementation. ดู [approval record](evidence/UI-04/approval-R01.json). สร้าง4nativeeditableviewsแล้ว: [เปิดUI04](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=40-43), P01=40:52/P03=40:75/F02=40:112/H01=40:168. Readback197nodes/93texts/2components/5instances; 3nativeBACKGROUND_BLURnodesเฉพาะactiondocks; ไม่ใช้ภาพแปะบนcanvas. ตรวจ8textcontrastpairsผ่านการคำนวณและgeometryoverflow=[]; ภาพ4หน้าที่ตรวจไม่พบซ้อน/ตัดชัดเจน. พื้นที่เนื้อหามือถือจบก่อนreservedactionareaทั้งสองหน้า. อนุมัติเฉพาะvisualdraftแล้ว ไม่ใช่fullaccessibility/runtimePASS. NativeFigmaeffectเป็นfrostedapproximation ไม่ใช่nativeAppleLiquidGlassหรือหลักฐานwebperformance. ดูactualreadback/PNG/evidenceในevidence/UI-04/

ผู้ใช้เลือกแนวที่สองจากข้อเสนอหลังส่งภาพFastwork: softmonochromeเป็นฐาน + selectivefrostedcontrols ไม่ใช่fullLiquidGlass. ผู้ใช้อนุมัติdraft4viewsที่เห็นแล้วด้วย; ไม่ครอบคลุมหน้าหรือstateที่ยังไม่ได้แสดง และไม่ใช่approvalเริ่มC1coding

## Scope
สร้างnativeeditableP01/P03/F02/H01ในกลุ่มใหม่บนFigma page1:2/fileRUOnC9Q15LA7DCc6rzhZtN. ไม่ทับหรือลบWF01/UI02/UI03, ไม่แก้pages0:1/1:3, globalstyles/libraries. ไม่เพิ่มfeatureตามFastworkprofile ไม่copybrandหรือข้อมูลส่วนบุคคลจากภาพ. Noappcode/install/deploy/push

## Surface / composition
- Participant: Configure/submitคำตอบหนึ่งข้อ; ไม่มีsidebar, คำถามบนพื้นทึบ, ratingกับselected-stateชัด, commentไม่บังคับ, actionbarกระจกฝ้าบางอยู่ด้านล่างโดยเว้นพื้นที่ไม่บังเนื้อหา
- Facilitator: Operate, Monitorรอง; slimrail+whitecanvasผืนเดียว, คำถามกับการกระจายคำตอบหลัก, coverageเป็นcontextไม่ใช่giantKPI, floatingglasscontrolเฉพาะปิดรับคำถาม
- HR: Learn/decideจากหลักฐาน; reportlayoutบนพื้นทึบ, coverage/distribution/organisationalblockerพร้อมฐานข้อมูลและข้อจำกัด, ใช้glassน้อยหรือไม่ใช้ในเนื้อหา
- คงoptionalnickname40/comment500, noautosuccess, answer+commentatomic, close-questionไม่เท่าจบsession, noindividualrawdataในF/HR

## Visual contract
Neutral#F3F3F3 / whitecanvas / ink#242424 / secondary#636363. IBM Plex Sans Thaiเลือกจากfontavailabilityจริง ไม่อ้างเป็นfontของFastwork. Pillprimaryดำ, inputgray, radiusใหญ่เฉพาะshell/canvasและcontrolsที่เหมาะสม; ไม่ทำทุกsectionเป็นcard. NativeBACKGROUND_BLURเฉพาะfloatingcontrol บนwhitefillที่มีopacityพร้อมquietedge/shadow ไม่สร้างglow/gradient/rainbowbackgroundเพื่อโชว์glass

## Evidence / honesty
ตรวจscreenshots/readbackจริงและถ้าtoolไม่รองรับblurให้รายงาน ไม่แกล้งอ้างnativeLiquidGlass. StaticFigmaเป็นapproximationของfrostedmaterial ไม่พิสูจน์webbackdrop/compositing/interaction/performance. Runtime/keyboard/IME/mobileSafari/reduced-transparency/usabilityยังNOTRUN. ตัวเลข18/30,5scores1/3/8/4/2,blocker10/18เป็นlabelledsyntheticdesignfixtures ไม่ใช่DB/realtimeevidence

## Preservation baseline
ก่อนเขียนอ่านจริง: WF01 root7:2 350nodes FNVc51ebd30; UI02 root24:32 160 e133cccf; UI03A38:37 140 bce728b5; B38:177 180 fb993cb0; C38:357 141 8b5f484d. FNVเป็นnoncryptographic structural/textcheck ไม่ใช่fullstyleaudit. SharedAI-PROGRESS/C1handoffdirtyเดิมไม่ทับ; progressรอบนี้อยู่เอกสารนี้

## Skills / sources
lead-d-workshop-cycle, claude-design(surface-first/quietchrome/verification), Unslop(DamirSokolovskyCC-BY-4.0;คำขอglassมีเจตนาจึงไม่ห้ามglassแบบเหมารวม), popular-web-designs/Apple(หลักการlayeringไม่copytokens/brand), figma-use/generate-design(nativeeditable/returnIDs/readback). ผู้ใช้ให้ภาพreferenceเอง; AppleHIGMaterialsใช้เป็นfunctional-layerguidance. อ่านgetlibraries/searchcomponentsvariablesstylesแล้วไม่มีaddedlibraryหรือscopedmatch; ไม่ติดตั้งUIkitหรือเปลี่ยนglobalstyles. Lucidepresentation/chart-column/checkจากofficialrepo ใช้nativeSVGpathsตามต้นฉบับ; ตรวจLICENSEจริงเป็นISC ไม่ใช่MIT และเก็บfullnoticeใน [lucide-license.txt](evidence/UI-04/lucide-license.txt)

## Verification cases / AI progress
- UI04-01: 4nativeviewsและreadbackตรงtarget PASSเฉพาะdesignartifact; [final-readback](evidence/UI-04/final-readback.json)
- UI04-02: opaquecontent / nativeblurเฉพาะ3actiondocks / noflattenedUIimage PASSเฉพาะค่าที่อ่านกลับและภาพที่ตรวจ; ไม่อ้างrefractionแบบApple
- UI04-03: 93texts/8contrastpairs/overflow=[] และphoneflowcontentจบก่อนreservedtoolbar PASSแบบboundedcheck ไม่ใช่fullaccessibilityหรือresponsivePASS
- UI04-04: old5roots structural/textfingerprintsตรงbaselineและpages0:1/1:3ยังว่างตามreadback PASSในขอบเขตที่ตรวจ ไม่ใช่fullglobalstyleaudit
- UI04-05: humanvisualapproval **APPROVED_DRAFT** สำหรับP01/P03/F02/H01; runtime,keyboard/IME,zoom,Safari,reduce-transparencyและusability NOTRUN; ไม่ครบ19hi-fiscreens/states และไม่ใช่clickableprototype. verification.json/final-readback.jsonคงไว้ตามเวลาที่ตรวจครั้งก่อน ไม่rewriteผลในอดีต; สถานะapprovalล่าสุดอยู่approval-R01.json
- หลักฐาน: [creation readback](evidence/UI-04/creation-readback.json), [verification](evidence/UI-04/verification.json), ภาพ [P01](evidence/UI-04/P01.png)/[P03](evidence/UI-04/P03.png)/[F02](evidence/UI-04/F02.png)/[H01](evidence/UI-04/H01.png)
- TerminalPythonไม่มีPillowจึงใช้stdlibเก็บnativePNGเดิม ไม่installและไม่สร้างภาพทดแทน. Screenshotinlineเป็นfallbackจากFigmaassetURLที่เคยถูกบล็อกในenvironmentนี้. อ่านJSONจริงจากtaggedMCPtoolresult ไม่แต่งAPIoutput. ไม่มีcode/install/deploy/pushและไม่แตะsharedprogress/C1handoffที่dirtyเดิม
