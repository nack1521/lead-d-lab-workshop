# UI-05 R02 — Canonical Product/QA targeted retest

สถานะ: PREPARED_FOR_DISPATCH; findingsยังไม่ปิด. ผู้ใช้อนุมัติ design/spec fixes ทั้ง5groups และตอบยืนยัน fresh-attempt policyแล้ว. C1coding/install/containers/agy/push/deployยังHOLD. ไม่ขออนุมัติ4UI04viewsเดิมซ้ำและไม่เปลี่ยนvisualdirection.

## Baseline / แหล่งอ่าน
R01 evidence/review baseline `93ee52b0bff7ca3eb1e49293452b75dd0cc16913`; revised R02 evidence baselineคือcommitที่Coordinatorระบุในdispatchmessage (รวมbriefนี้). Scopeเฉพาะ `/Users/aiink/Nack/Lead+D-Lab`; cacheบอตตามสิทธิ์เดิม.

อ่าน AGENTS/TEAM-WORKFLOW แล้วอ่าน `docs/product/UI-05-R02-TARGETED-FIXES.md` เป็นcurrentamendment, `docs/product/evidence/UI-05-R02/approval-R01.json`, `final-readback.json`, `creation-readback.json`, `verification.json`, `state-ledger.json`, `screenshots.json` และ current `docs/handoffs/product-UI-05.md`. อ่านรายงานR01ของตน ไม่คัดdispositionอีกฝ่ายมาแทนการตรวจ.

เปิดภาพจริงทั้ง3panels `docs/product/evidence/UI-05-R02/{participant-corrections,lobby-question-zero,stale-transition}.png`. ตรวจcropถ้าจำเป็น; เครื่องมือไม่อ่านภาพได้ให้บอกBLOCKEDเฉพาะส่วนนั้น ไม่อ้างว่าเปิดแล้วจากmanifest. เทียบapprovedUI04P01/F02และR01unknown/closed/end-session/HRตามregressionที่เกี่ยวข้องโดยไม่เปิดครบทุกภาพซ้ำเพียงให้ครบจำนวน.

Figma optionalREAD-ONLY file `RUOnC9Q15LA7DCc6rzhZtN`, page `1:2`, rootR02 `66:153`, preservedUI04 `40:43`, R01 `47:48`. ถ้าไม่อ่านliveต้องระบุarchivedreview ไม่อ้างยืนยันlivecanvas.

## Focus / expected retest
| Finding IDs เดิม | R02 evidence / required check |
|---|---|
| QA-UI05-01 | P07 `66:158`, user-approvedpolicy, statepack/handoff/amendment: same-key stable replayต่างจากfresh attempt. Unknown/absenceไม่เปิดnewkey; terminalnon-save+no latecommit+stillopen+authvalidแล้วexplicitnewattemptใช้newkeyได้แม้payloadเดิม. Acceptedยังread-only/unique; serverต้องrecheckclose/auth/uniqueแบบatomic. ไม่รับรองruntime |
| UI05-P-01 | F01 `66:230` มีentry `[ที่อยู่ระบบ]/join` พร้อมlabel/รหัสROOM-01/ขั้นตอนเข้าร่วม; placeholderเป็นproposedentrypathไม่ใช่liveURL ไม่เผยgrantไม่เพิ่มQRfeature |
| QA-UI05-02 / UI05-P-02 | F03 `66:258` และF04 `66:285` แสดงquestion01/text/scale; staleผูกsnapshotข้อเดิมและcurrentunknown ไม่relabelเป็นข้อใหม่/Live ไม่เดาเวลา และcontrolsblockedจนreconcile |
| UI05-P-03 | Nativeannotation `66:333` + transitiontableในamendment ครบcloseconfirmed/failure/unknown,closed→next/end,F05entry/cancelorigin/endpendingunknown→F06 ไม่อนุมานclose=end ไม่เพิ่มroute |
| UI05-P-04 | P04 `66:179`, pollP05 `66:198`, pollP06 `66:213`: fixturequestion02 แยกrating01; option/commentตรงกันและnoticeพูด“คำตอบ”ไม่ใช่คะแนน; typedmappingP05–P09คงpayload/key ไม่ต้องredrawทุกoutcomeframe |

Producerบันทึกfinal212nodes/7views/1annotation/14instances/11contrastpairs. ให้นับจากrecordsด้วยtoolsตามส่วนที่ตรวจ ไม่รับรองตัวเลขจากsummary. Creation204กับfinal212เก็บตามจริง; exactcauseยังunverifiedไม่ใช่การลบ/แก้historicalrecord. FingerprintsboundedของUI04/R01ตรงก่อนหลัง; ไม่ใช่fullglobal/pixel/runtimeaudit.

## Allowed writes / output
- Productเขียนเฉพาะ `docs/product/UI-05-PRODUCT-RETEST-R02.md`.
- QAเขียนเฉพาะ `docs/qa/UI-05-QA-RETEST-R02.md`.
- ถ้าpathมีอยู่ อ่านก่อนแจ้งCoordinatorแทนoverwrite. ห้ามแก้canvas/evidence/shared/protected/app/test/config หรือไฟล์อีกฝ่าย; ไม่install/runapp/containers/agy/commit/push/deploy/ส่งต่อบอตอื่น. รักษาindependentreview.

รายงานภาษาไทย: evidencebaseline/tools/ภาพที่อ่านจริง, findingIDเดิม→RESOLVED_STATIC/OPEN/BLOCKEDพร้อมevidence+remaininggap, regressioncoverage/limitations/openexpirydecisions. Overallverdict READY_FOR_HUMAN_STATE_REVIEW / CHANGES_REQUESTED / BLOCKED. ไม่ให้humanapprovalหรือปิดtask; runtime/security/accessibility/DB/WS/loadยังNOTRUNทั้งหมด. ไม่มีfindingใหม่ต้องบอกcoverage ไม่เขียนPASSลอย ๆ.

ส่งCoordinatorabsolute reportpath+baseline+verdict+openCritical/MajorIDs. Coordinatorอ่านกลับverifyก่อนรวมผล. Producer FIXED_DRAFT ไม่ใช่independentretestPASS. Expiryframeยังdeferได้เฉพาะreviewแต่policy/mapping/verificationยังgateก่อนreceipt-sliceimplement/release; ไม่มีexpiryapprovalจากfreshattemptdecision.

## AI progress
Coordinatorแก้design/specหลังapproval แยกR02rootและหลักฐานจากR01 รักษา4approvedUI04views/shareddirtyfiles. เตรียมcanonicalretest ไม่dispatchcoding. Reportสองฝ่ายยังPENDINGจนได้ผลจริง.
