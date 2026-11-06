# UI-05 independent review R01 — Consolidated disposition

สถานะ: **CHANGES_REQUESTED / FIX_NOT_AUTHORIZED / C1_HOLD**. รับและอ่านกลับรายงานจริงของ canonical Product และ QA ครบแล้ว. ขั้น review ส่งผลครบ แต่ UI05 ยังไม่ ACCEPTED และไม่ได้อนุมัติ fix/เปลี่ยน contract/build แทนผู้ใช้.

## Source / ขอบเขต
- Evidence baseline `1724ecc6de84a38163751aab041a26e2053b9283`; brief `19ef090d50d593b910263d39b7f7abb3f3825a84`.
- [Product R01](../../product/UI-05-PRODUCT-REVIEW-R01.md): CHANGES_REQUESTED, 2 Major/2 Minor, ไม่มี Critical ที่พิสูจน์ได้จาก archived artifacts.
- [QA R01](../../qa/UI-05-QA-REVIEW-R01.md): CHANGES_REQUESTED, 2 Major, ไม่มี Critical ที่พิสูจน์ได้จาก archived artifacts.
- [Interim QA triage](../UI-05-REVIEW-R01-TRIAGE.md) เก็บตามเดิมเป็นประวัติ ไม่เขียนทับให้เหมือนเคยรับ Product แล้ว.
- ทั้งสองเป็น archived-asset review ไม่ได้ตรวจ live Figma หรือแอป. Reviewers ระบุเปิด9UI05panels+4UI04views; Coordinatorอ่านรายงานทั้งสองจริงและตรวจภาพ/contractเฉพาะจุดเพิ่ม ไม่อ้างยืนยันtooltraceทั้งหมดของreviewers.

## รวม findings แบบไม่ซ้ำ
6 source findings → 5 actionable groups: **3 Major / 2 Minor**. Question-context findings จากสองฝ่ายเป็นเรื่องเดียว ไม่คิดซ้ำ.

| Group | Severity | Source IDs | ประเด็น |
|---|---|---|---|
| UI05-RV-01 | Major | QA-UI05-01 | P07 retry / stable receipt |
| UI05-RV-02 | Major | UI05-P-01 | F01 participant entry / join instructions |
| UI05-RV-03 | Major | QA-UI05-02, UI05-P-02 | F03/F04 question identity |
| UI05-RV-04 | Minor | UI05-P-03 | Close question / next / end trace |
| UI05-RV-05 | Minor | UI05-P-04 | Poll typed outcome / fixture mapping |

## สิ่งที่ยืนยันและข้อเสนอแก้ขนาดเล็กที่สุด
### UI05-RV-01 — Stable receipt กับ P07 retry
Coordinatorตรวจ P07 `50:320`, UI05 contract และ protected C1 handoff lines77/82/84–87 แล้ว: หลัง terminal non-save keyเดิมต้อง replayผลเดิม แต่UIเสนอให้ส่งอีกครั้งราวกับเกิดattemptใหม่ จึงมีcontract conflictที่ต้องแก้ก่อนimplement.

ข้อเสนอรอผู้ใช้ตัดสิน: แยกsame-key reconciliation/replayของrequestเดิมออกจากnew attemptหลังterminal non-saveที่old requestไม่มีโอกาสcommitและคำถามยังเปิด; หากยอมnew attempt แม้payloadเดิมต้องกำหนดkeyใหม่ให้ชัด. ไม่เปลี่ยนนโยบายนี้เองเพราะC1เดิมอนุญาตnewkeyชัดเฉพาะedited submission. Transient absence/timeoutยังunknownเสมอ. เมื่อเลือกแล้วปรับP07copy/actionและเอกสารที่เกี่ยวข้องให้ตรงกัน พร้อมretest.

### UI05-RV-02 — F01 ต้องแจกทางเข้าห้องได้
Coordinatorเปิด `facilitator-lobby-zero.png` และapproved `UI04/P01.png` ซ้ำ. P01ให้รับรหัสจากfacilitator แต่F01 `50:608` ไม่มีparticipantentrypath/วิธีแจกรหัสที่ชัด. แนะนำเพิ่มinstructionสั้นบนopaquecontent: วิธีเปิดหน้าร่วม + labelรหัสห้องสำหรับผู้เข้าร่วม + syntheticcode. ไม่เพิ่มQRgenerator/libraryหรือเดาliveURLที่ยังไม่มี.

### UI05-RV-03 — F03/F04 ต้องผูกกับคำถาม
CoordinatorตรวจF03 `50:671` และF04 `50:736`: zeroมีcontrolปิดคำถามแต่ไม่มีเลข/ข้อความคำถาม; staleมีหัวข้อกราฟแต่ระบุquestionidentityของsnapshotไม่พอ. แนะนำคงquestionnumber/text/scaleและฐานที่เกี่ยวข้อง; F04ชัดว่าเป็นข้อของsnapshotเดิม ไม่relabelเป็นcurrentquestionและไม่เดาเวลา. ต้องreconcileก่อนmutation. คงUI04direction ไม่รื้อapprovedframes.

### UI05-RV-04 — Close / next / end transition trace
เพิ่มannotatedtable trigger→authoritativecondition→action→next-state: ปิดข้อยืนยัน/ล้มเหลว/unknown, เปิดข้อถัดไป, entry/cancelก่อนdispatchของF05 และF06หลังended. ไม่ผูกclose-questionให้กลายเป็นend-sessionอัตโนมัติ ไม่ต้องเพิ่มrouteหรือclickableprototypeเพื่อแก้เอกสาร.

### UI05-RV-05 — Poll ใช้ typed outcome ไม่ใช่คะแนน
Coordinatorเปิด `participant-1.png`: P04เป็นpollแต่P05/P06ตัวอย่างเป็นscore3และheader01ซ้ำกัน. นี่เป็นช่องว่างการอธิบายspecimens ไม่ใช่หลักฐานruntimeส่งข้อมูลผิด. แนะนำannotation rating→score+comment และpoll→selectedoptionlabel+commentของimmutablepayloadเดิม พร้อมแยกfixturequestioncontext ไม่ต้องสร้างทุกoutcomeframeซ้ำ.

## Verification / limitations
- ตรวจexactreviewfilesและfindingIDs, dedupeด้วยPython ไม่ใช้declared totalsลอย ๆ. ตรวจbaseline/hash/linksเมื่อarchivecommit.
- ภาพ/contractที่Coordinatorดูเพิ่มในรอบรับProduct: F01/F03panel, participantstatespanel, approvedP01; F04และP07ดูไปแล้วในinterimtriage.
- Historical `final-readback.json`, `verification.json`, PNG/manifestและapprovedUI04ไม่ถูกเปลี่ยน. ไม่อ้างว่าfixแล้วหรือใช้ผลcontrastเดิมรับรองfuturefix.
- Runtime/security/accessibility/mobile/30clientloadทั้งหมด **NOT RUN**. ไม่พบCriticalในreviewไม่ได้แปลว่าแอปปลอดภัย.

## Deferred / human decisions
Dedicatedexpiryfullframedeferสำหรับhumanreviewได้ตามทั้งสองฝ่าย แต่exactexpired/revoked/unavailablecopy/actions,receiptTTL/grace/retention/recoverypolicyยังเป็นgateก่อนreceipt-sliceimplementation/release. Unknownไม่กลายเป็นnon-saveและไม่มีHRbypass. ไม่มีค่าTTLใหม่หรือสิทธิ์ใหม่จากเอกสารนี้.

## Next gate
1. ผู้ใช้อนุมัติรอบแก้ **design/spec-only** และตัดสินretry/new-attemptcontract; C1ยังhold.
2. Product/Coordinatorแก้เฉพาะกลุ่มUI05ใหม่และเอกสารภายใต้scopeที่อนุมัติ เก็บrevisedreadback/PNGแยกrevision คงapprovedUI04และhistoricalevidence.
3. Product/QAทำtargetedretestของfindingIDsเดิมและregressionที่กระทบ แล้วเสนอhumanUI05acceptance. Buildapprovalยังแยกอีกgate.

## AI progress
Userdecision=Product/QAreviewก่อนcoding. Canonicalreviewersส่งreportแยกครบแล้ว; Coordinatorอ่านกลับ,ตรวจtargetedvisual/contracts,dedupefindingsและรวมrecommendation ไม่แก้canvas/contract/application. เก็บProductreportต้นฉบับและinterimQAtriageตามเดิม. SharedAI-PROGRESS/C1handoffที่dirtyยังรักษาไว้; currentstatuspointerเป็นการบันทึกผลreview ไม่ใช่การแก้design. ไม่มีinstall,containers,agy,push/deployหรือmessagesเพิ่มเติมที่ชี้นำindependentreview.
