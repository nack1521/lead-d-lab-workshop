# UI-05 R02 — Targeted design/spec fixes

สถานะ: **READY_FOR_HUMAN_STATE_REVIEW หลัง independent targeted retest R02**. Product และ QA ส่งผลครบและให้ findings เดิมเป็น RESOLVED_STATIC ใน targeted design/spec scope ดู [consolidated review summary](../implementation/UI-05-R02-REVIEW-SUMMARY.md). ผู้ใช้อนุมัติ design/spec fixes และ fresh-attempt policy แล้ว แต่ revised visual acceptance ยัง PENDING และ C1 build approval ยัง HOLD; ไม่ใช่ runtime/security/accessibility PASS.

## Authority / precedence
- [Approval record](evidence/UI-05-R02/approval-R01.json) เก็บคำตอบผู้ใช้ตรงตามที่เลือก. เปลี่ยนเฉพาะความหมาย attempt หลัง terminal non-save; ไม่เปลี่ยน stable replay, uniqueness, atomicity, auth, TTL/grace หรือ retention.
- ข้อกำหนด R02 นี้เป็น current amendment สำหรับ retry classification แทน wording “unchanged retry ใช้ key เดิม” ที่เคยใช้ปนกับ new attempt ใน UI05 R01/UI01/WF01-R1. เอกสารและภาพเก่าเก็บเป็นประวัติ ไม่ใช่แหล่งให้เลือก policy ขัดกันเอง.
- Protected `docs/handoffs/ANTIGRAVITY-C1.md` คงเดิม; [current Product handoff](../handoffs/product-UI-05.md) ต้องชี้ R02 ก่อน implement. ไม่แก้ protected dirty file และไม่เปลี่ยน C1 scope.
- Visual baseline UI04 approved root `40:43` คงเดิม; UI05 R01 root `47:48` และ archived evidence/review R01 คงเดิม. สร้าง R02 delta ใน page `1:2` root `66:153`: [เปิด Figma](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-153).

## Delta inventory / สิ่งที่แทนและสิ่งที่เสริม
R02 มี 7 views และ1 annotation board ไม่เพิ่ม canonical screen code หรือ route. ใช้ 5 views แทน specimens ที่ได้รับ finding; เพิ่ม poll-sending/poll-saved เพื่อสาธิต typed outcome. Rating outcomes และ unchanged states ใช้ UI05 R01/approved UI04 เป็น reference ตามบริบท ไม่ตีความ 7 views นี้เป็นทั้งระบบ.

| Code / variant | R02 node | แทน/เสริม source | Finding |
|---|---|---|---|
| P07 fresh attempt | `66:158` | แทน `50:320` | QA-UI05-01 |
| P04 poll question02 | `66:179` | แทน `50:179` | UI05-P-04 |
| P05 poll sending | `66:198` | เสริม rating specimen `50:226` | UI05-P-04 |
| P06 poll saved | `66:213` | เสริม rating specimen `50:272` | UI05-P-04 |
| F01 join instructions | `66:230` | แทน `50:608` | UI05-P-01 |
| F03 zero question01 | `66:258` | แทน `50:671` | QA-UI05-02 / UI05-P-02 |
| F04 stale question01 | `66:285` | แทน `50:736` | QA-UI05-02 / UI05-P-02 |
| Transition annotation | `66:333` | ไม่ใช่หน้าจอ/routeของแอป | UI05-P-03 / P-04 |

## 1. Approved attempt contract — QA-UI05-01
### Replay/reconcile ไม่ใช่การเริ่มส่งใหม่
| สภาพคำขอ | การกระทำที่อนุญาต | Key / payload | ผลที่ UI กล่าวได้ |
|---|---|---|---|
| sending / unknown / transient missing | ตรวจสถานะหรือ replayคำขอเดิมตาม auth; ไม่ auto-resend เป็นคำขอใหม่ | keyเดิม + immutable payloadเดิม | ยังไม่ทราบผลจน serverยืนยัน; ห้ามบอกไม่บันทึกจาก timeout/404 |
| terminal non-save + old requestไม่มีโอกาสcommit + authoritative questionยังเปิด + grantยังvalid | ผู้ใช้เลือก “เริ่มส่งคำตอบใหม่” หรือแก้ร่างก่อนส่งใหม่ | fresh key สำหรับ fresh attempt แม้ payloadเหมือนเดิม; old key/receiptไม่แก้ | เริ่มความพยายามใหม่ ไม่รับประกันว่าจะสำเร็จ |
| keyเดิม + payloadเดิม หลังได้ terminal outcome | replay/readตามสิทธิ์เท่านั้น | keyเดิม | คืน stable prior outcome ไม่ลองบันทึกใหม่ |
| keyเดิม + payloadต่าง | ไม่ overwrite | conflict | แจ้ง conflict ไม่แก้ receiptเดิม |
| accepted / questionclosed / sessionended / authunavailable | ไม่เสนอ fresh submit/edit accepted; reconcile own receiptเฉพาะสิทธิ์ที่ยังมี | คง old key | ผลเก่า/unknownตาม authority; ไม่ bypassด้วย keyใหม่ |

สร้าง fresh key เมื่อผู้ใช้ยืนยันส่ง attempt ใหม่เท่านั้น. กดแก้ร่างไม่เปลี่ยน payload/receiptของ attempt เก่า. Serverต้องตรวจ lifecycle/auth/หนึ่ง accepted responseต่อ participant+question อีกครั้งอย่าง atomic ขณะรับ attempt ใหม่; UIเห็นopenก่อนหน้าไม่ชนะ close race. ถ้ากดซ้ำขณะ attempt ใหม่ pending ให้ใช้ keyของattemptใหม่นั้น ไม่สร้างเพิ่มทุกclick.

P07 microcopy เปลี่ยนปุ่มเป็น **“เริ่มส่งคำตอบใหม่”**, secondary **“แก้คำตอบก่อนส่งใหม่”** และบอกใช้คำตอบเดิมได้. ผู้เข้าร่วมไม่ต้องเห็นศัพท์ idempotency key. ไม่มีการเปลี่ยน auth/expiry policy หรือเพิ่ม persistent draft storage; unknownยังไม่ปลดล็อกให้ส่งใหม่.

## 2. F01 participant entry — UI05-P-01
เพิ่ม opaque instruction block: “ลิงก์สำหรับผู้เข้าร่วม”, `[ที่อยู่ระบบ]/join`, “รหัสห้องสำหรับผู้เข้าร่วม”, `ROOM-01` และขั้นตอนเปิดลิงก์→กรอกรหัส→ไม่ต้องสมัครบัญชี. แยก action “เปิดคำถามแรก” จาก entry instructions.

`[ที่อยู่ระบบ]/join` เป็น **placeholder ของ proposed UI entry path** ไม่ใช่ live URL หรือ endpointที่สร้างแล้ว. เมื่อ implementation/deploymentได้รับapproval ให้ประกอบparticipantlinkด้วยpublicapplicationoriginจริง; ไม่ใส่facilitator/HR grantหรือtokenลงลิงก์. ยังไม่มีcopy/QR functionalityที่อ้างว่าทำงาน และไม่เพิ่มQRgenerator/library.

## 3. F03/F04 question context — QA-UI05-02 / UI05-P-02
ใช้ workshop/session contextเดิมและคำถาม01จากapprovedUI04: “คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?” พร้อมscale1ยังไม่มั่นใจ/5มั่นใจมาก.
- F03 ยืนยัน0ของ **ข้อ01** พร้อมactionปิดเฉพาะข้อนั้น. Loading/errorไม่ถูกแปลงเป็นzero.
- F04 ระบุ **“ผลล่าสุดของคำถาม 01 · ก่อนการเชื่อมต่อขาด”**, scaleและฐานของsnapshotเก่า, “คำถามปัจจุบันยังไม่ยืนยัน”, “ข้อมูลเก่า · ไม่ใช่ Live”. Mutationcontroldisabledจนreconcileสำเร็จ; ไม่relabelกราฟเก่าเป็นข้อใหม่ ไม่เดาupdated-at.
- ปรับความสูง plot ภายในcloneให้เหลือพื้นที่ context โดยคงจำนวน/สัดส่วนfixtureเดิม. ไม่แก้approvedchartหรือR01 source.

## 4. Trigger → authority → action → next state — UI05-P-03
ตารางนี้อธิบาย stateภายใน F02/F03/F04/F05 ไม่เพิ่มrouteใหม่ และเป็น proposed behavior ที่ตรวจในรอบ design/spec ไม่ใช่ผล runtime.

| Trigger / origin | Authoritative condition / guard | Action / UI ระหว่างรอ | Next state |
|---|---|---|---|
| F01 เปิดคำถามแรก | valid facilitator + sessionactive + serverยืนยันactivequestion | pendingกันกดซ้ำ; ไม่เดาคำตอบ0ก่อนsnapshot | F02/F03 ตามfreshdataจริง; participantไปP03/P04ตามquestiontype |
| F02/F03 กดปิดรับคำถาม | target session/questionIDตรง context + serverยังรับคำสั่งได้ | คงcontext/ผลเดิม ปุ่มpending; ยังไม่end-session | pendingในshellเดิม |
| close ยืนยันสำเร็จ | serverยืนยันquestionนั้นclosed + sessionยังactive | คงผล/identityข้อนั้นแบบread-only | closed variantภายในcontextเดิม พร้อมทางเลือกเปิดข้อถัดไป/จบกิจกรรม ไม่ไปF05อัตโนมัติ |
| close ปฏิเสธแน่นอน | terminal commandfailure + freshsnapshotระบุสภาพปัจจุบัน | แจ้งสาเหตุและคืนcontrolsเฉพาะที่ยังอนุญาต | F02/F03หรือclosedตามserver; ไม่ย้อนสถานะด้วยtimer |
| close timeout/unknown | ยังไม่มีauthoritativecommandresult | ตรวจคำสั่งเดิม/refreshsnapshot; disablemutations | F04จนรู้ผล; ไม่ออกคำสั่งใหม่จากabsence |
| closed context เลือกเปิดข้อถัดไป | questionเดิมclosed + sessionactive + มีnextquestionที่serverกำหนด | pendingจนserverยืนยันopen | F02/F03พร้อมidentityใหม่; participantไปP04สำหรับfixturepoll02 |
| closed context กดจบเวิร์กช็อป | explicitendaction + validsessionauthority | บันทึกorigincontextก่อนเข้าconfirmation | F05confirmation ไม่ใช่close-question |
| F05 กลับไปที่ห้อง ก่อนdispatch | ยังไม่ส่งendcommand | navigationกลับoriginที่บันทึกไว้ | contextต้นทางตามstateจริง ไม่เปิดข้อที่closedแล้ว |
| F05 ยืนยันจบ | validgrant/session; commandถูกdispatch | F05pending ไม่เสนอcancelที่รับรองundo | serverยืนยันended→F06; timeout→F05unknown |
| F05unknown ตรวจสถานะ | reconcile session/commandเดิมภายในauth | ไม่สรุปจากconnectionopen/timeout | ended→F06; ยืนยันcommandไม่เกิดและsessionactive→ให้reviewF05ใหม่; ยังunknown→คงตรวจเดิม |

ตัวเลือกเปิดข้อถัดไปมีเฉพาะเมื่อมีข้อถัดไปจริง. ทางจบกิจกรรมเป็นexplicitactionแยกจากclose-question. Annotation `66:333` ทำให้ไล่flowบนcanvasได้ แต่ไม่ได้สร้างprototypeinteractiveหรือฟังก์ชันbackend.

## 5. Typed poll outcome mapping — UI05-P-04
Fixtureแยกชัด: Rating01=feedback/score3; Poll02=อุปสรรคสำคัญ/เลือก “เวลาสำหรับดูแลทีมไม่พอ”/comment “อยากมีเวลาโค้ชทีมมากขึ้น”. ภาพ selectedไม่ใช่runtime default selection.

| State | Typed snapshot / identity | Submission rule |
|---|---|---|
| P03 rating / P04 poll | currentquestionID/type/labelตรงserver; commentoptional | ยังเป็นdraft ไม่ใช่accepted |
| P05 sending | rating=score+comment; poll=optionID/label+comment พร้อมquestion02 | immutablepayload+keyของattemptที่ส่ง; ไม่สลับเป็นscoreเมื่อเป็นpoll |
| P06 saved | ownacceptedtypedanswer+commentของattemptเดิม | หลังatomiccommit/authoritativereceipt; read-only |
| P07 terminal non-save | retainedtyped draftเดิม ไม่ใช่accepted | freshattemptตามapprovedpolicyเมื่อผู้ใช้กดและguardsครบ |
| P08 unknown | typedpayload+keyเดิม | reconcileเท่านั้น; ไม่แก้/ส่งใหม่อัตโนมัติ |
| P09 closed saved/non-save/unknown | ยังคงoption/commentและquestionของattemptเดิม | nofreshwrites; receiptreadตามauth/grace/TTL |

P05/P06 noticeใช้คำว่า **“คำตอบและข้อความ”** ไม่ใช่ “คะแนนและข้อความ” เพื่อใช้กับทั้งชนิด. ไม่ต้องแตกทุกoutcomeframeซ้ำ; shellreuseไม่เปลี่ยนtypedpayload. Optionlabelในsnapshotต้องสอดคล้องกับoptionIDของคำถามเดิม ไม่เอาตัวเลือกของข้อใหม่มาแทน.

## Static evidence / recovery
[evidence folder](evidence/UI-05-R02/final-readback.json), [PNG manifest](evidence/UI-05-R02/screenshots.json)
- Finalreadback212nodes/115texts/14instances, 7views+annotation; IBM Plex Sans Thai Regular/Medium. 11solid-filltextcontrastpairsผ่าน4.5:1; ไม่มีcollapsedtext/childboundsoverflow และcontentทุกviewอยู่ก่อนreservedactionarea.
- UI04 fingerprint `7ba8c687` /197nodes และUI05R01 `ff0cdf86` /573nodesตรงก่อน/หลัง. เป็นboundednoncryptographiccheckไม่ใช่fullglobalaudit.
- เครื่องมือคืนcreationreadback204nodesและfinalreadback212nodesหลังresolve/readbackเพิ่มเติม. เก็บทั้งสองตามจริง ใช้finalสำหรับcurrentinventory; สาเหตุจำนวนต่างกันยังไม่ได้พิสูจน์แยก ไม่rewritecreationให้ดูตรงย้อนหลัง.
- Firstauthoringcallล้มเหลวเพราะสมมติinstanceชื่อState=...; readcanvasยืนยันไม่มีpartialR02rootและinspectชื่อจริงUI05/noticeแล้วแก้selectorก่อนretry. ไม่สร้างrootซ้ำ. จากภาพcompositionพบpollnoticeยังอ้างคะแนน จึงแก้เฉพาะP05/P06แล้วcapturephonepanelpost-fix.

## Gates / ownership
Canonical Product/QA targeted retest กลับมาครบ: READY_FOR_HUMAN_STATE_REVIEW ทั้งสองฝ่าย; findingsเดิมเป็น RESOLVED_STATIC เฉพาะขอบเขตที่ตรวจตามconsolidatedsummary. ไม่ใช้producerFIXED_DRAFTปิดfindingsเองและไม่ปิดUI05taskแทนผู้ใช้. EvidenceJSON/state-ledgerคงsnapshotก่อนretestตามจริง; currentstatusอยู่ในsummaryนี้. HumanrevisedvisualacceptanceยังPENDING; C1coding/install/containers/agy/push/deployยังHOLD. Runtime/DB/WS/security/a11y/mobile/30clientloadทั้งหมดNOTRUN. Expiryframe/policymappingยังdeferredตามR01ไม่ถูกอนุมัติจากretrydecision.

AIprogress: ผู้ใช้อนุมัติdesign/specfixและfresh-attemptpolicy; CoordinatorทำnativeFigma/doc/evidence ไม่เขียนapplication/test/config. รักษาsharedAI-PROGRESS/C1handoffที่dirty; progressรอบนี้เก็บในR02. ใช้lead-d-workshop-cycle, writing-for-agents และFigma-use/generate-designสำหรับlocaldraftfix ไม่อ้างIDE/runtimeactivation. ไม่มีpublishedlibrary/globaltokensหรือpaidassetsใหม่.
