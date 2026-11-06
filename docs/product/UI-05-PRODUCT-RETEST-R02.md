# UI-05 — Independent Product Targeted Retest R02

Verdict: **READY_FOR_HUMAN_STATE_REVIEW**

Canonical Product findings `UI05-P-01`, `UI05-P-02`, `UI05-P-03`, `UI05-P-04`: **RESOLVED_STATIC** ใน revised design/spec ที่ตรวจ ไม่ใช่ runtime PASS และไม่ใช่การปิด task หรือ human acceptance

Open Critical/Major IDs จาก Product targeted retest รอบนี้: **ไม่มีที่พบในขอบเขตตรวจ** ไม่ได้ให้ disposition แทน canonical QA

## 1. Baseline / scope / authority

- Reviewer: canonical `lead-d-product` ตรวจด้วยตนเอง ไม่อ่านหรืออาศัยผล retest ของ QA
- Brief: `docs/handoffs/UI-05-TARGETED-RETEST-R02.md`
- Revised evidence baseline และ HEAD ที่ตรวจ: `b32c9287494d32cf6231bd3fe84677cbce4e82d6`
- `git log -1` แสดง `docs(design): fix UI05 R02 states with approved attempt policy`; scoped `git diff --exit-code` ของ R02 evidence, amendment และ current Product handoff เทียบ baseline คืน exit code 0 ไม่มี diff
- R01 evidence/review baseline ตาม brief: `93ee52b0bff7ca3eb1e49293452b75dd0cc16913`; อ่านรายงาน Product R01 ของตนเพื่อ retest ตาม finding เดิม ไม่ rewrite ประวัติ
- Current amendment: `docs/product/UI-05-R02-TARGETED-FIXES.md` และ mandatory pointer ใน `docs/handoffs/product-UI-05.md` supersede retry classification เก่าเฉพาะจุดที่ได้รับอนุมัติ ไม่ยึด P07 เก่ามาเป็น current policy
- อ่าน `approval-R01.json` โดยตรง: ผู้ใช้อนุมัติ unknown ใช้คำขอเดิม และเริ่ม fresh attempt ด้วย new key ได้หลัง terminal non-save + no late commit + question still open; amendment เพิ่ม valid auth/atomic server recheck และคง uniqueness ไม่เปลี่ยน TTL/grace/retention โดยอนุมาน
- เวลา local จาก `date` ในรอบตรวจ: `2026-11-06T18:07:03+0700 (+07)` ไม่ใช่ timestamp ของ Figma server
- เป็น **archived-asset review**: ไม่เรียก live Figma จึงไม่ยืนยัน live canvas ณ ปัจจุบัน
- Stable Figma references: [R02 root 66:153](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-153), [approved UI04 root 40:43](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=40-43), [UI05 R01 root 47:48](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=47-48), page `1:2`

ก่อนสร้างอ่าน target report แล้วไม่พบไฟล์ `git status --short` พบ dirty เดิม `docs/AI-PROGRESS.md` และ `docs/handoffs/ANTIGRAVITY-C1.md` ไม่แก้สองไฟล์นั้น เขียนเฉพาะรายงานนี้ ไม่เปลี่ยน Figma/evidence/shared/app/test/config ไม่ install/run app/containers/agy/commit/push/deploy ไม่ส่งต่อผู้ตรวจอื่นให้ทำแทน

## 2. หลักฐานและเครื่องมือที่ใช้จริง

อ่าน AGENTS/TEAM-WORKFLOW, targeted retest brief, current R02 amendment, approval, creation-readback, final-readback, verification, state-ledger, screenshots manifest, current Product handoff และ `docs/product/UI-05-PRODUCT-REVIEW-R01.md`

- **STATIC_CHECKED**: `read_file` อ่านเอกสาร/JSON; `terminal` รัน read-only git, `jq` นับ/dedupe/เปรียบเทียบ IDs และ records, `shasum -a 256` PNG จริง, `date`
- **VISUAL_JUDGEMENT**: `vision_analyze` เปิด actual R02 PNG ทั้งสาม และ regression images ที่ระบุด้านล่าง ไม่สร้างภาพทดแทน ไม่ใช้ producer FIXED_DRAFT เป็น PASS
- **PRODUCER_EVIDENCE_REVIEWED**: contrast/geometry/fonts/preservation ที่ archived readback บันทึก ไม่รัน node-tree geometry หรือ luminance/pixel-blur audit ใหม่จาก live Figma
- **NOT_RUN**: clickable prototype และ runtime/security/accessibility/API/DB/WS/load ทั้งหมด

### R02 actual PNGs และ inventory ที่ตรวจ

Paths ในตารางอยู่ใต้ `docs/product/evidence/UI-05-R02/`:

| PNG / panel | Revised view / node | ขอบเขต |
|---|---|---|
| participant-corrections.png / 66:157 | P07 66:158, P04 66:179, P05 66:198, P06 66:213 | fresh-attempt microcopy, poll02 typed answer/comment, pending vs saved |
| lobby-question-zero.png / 66:229 | F01 66:230, F03 66:258 | participant entry, confirmed zero พร้อม question context |
| stale-transition.png / 66:284 | F04 66:285 และ annotation 66:333 | old snapshot identity, current unknown, controls blocked, transition trace |

`shasum -a 256` คืนค่าตรงกับ screenshots.json ที่อ่าน:
- participant-corrections.png: `9f4b9636886d932ca800595c102fc6fa17a4c54eb4d2cab6c6878125195036e1`
- lobby-question-zero.png: `312d107cb4f8ff2e2847ebc92d13fd28a4f025e3117734ad289e7311a1dce94c`
- stale-transition.png: `e2682c43431561c87cc95f93bf92882102cbf62dec61d7dc02c5303c6ad913e8`

### Independent record checks

คำนวณด้วย `jq` จาก records ไม่คัด totals ของ producer อย่างเดียว:
- final `.views`: 7 records / 7 unique view IDs / 7 unique codes = F01, F03, F04, P04, P05, P06, P07; names ตรง anchored pattern `^UI05-R02 / [PFH][0-9]{2} / ` ทุก view
- panels 3; annotationId `66:333` มีอยู่ใน inventory; annotation ไม่ถูกนับเป็น screen หรือ route
- final allNodeIds 212 / unique 212 / sum type counts 212; every view ID อยู่ใน inventory
- instanceAssets 14 / unique instance IDs 14; referenced main components เป็น local R01 button/notice assets ที่ระบุใน readback ไม่ใช่ production library ใหม่
- screenshot manifest 3 records / 3 unique paths
- final recorded clearances ทุก view contentBottom < reservedY; minimum จากตัวเลขที่ producer บันทึก = 63; recorded overflow/collapsedText ว่าง
- recorded contrast pairs 11, minimum recorded ratio 4.668692999235759; ไม่ใช่ independent recompute luminance/actual backdrop pixels หรือ full WCAG PASS
- final readback บันทึก IBM Plex Sans Thai Regular/Medium และ imageFilledNodes ว่าง ภาพเป็น native editable artifact ตาม archived structure ไม่ใช่ screenshot-only ที่ Product สร้างใหม่

### Count provenance ที่ยังต้องคงเป็นข้อจำกัด

Creation: created IDs 204 / unique 204 / type-count sum 204. Final: 212 / unique 212 / type-count sum 212. Set-diff ที่คำนวณจริงพบ final เพิ่มรายการ TEXT instance descendants 8 IDs และไม่มี ID ที่หายจาก creation:

`I66:196;47:53`, `I66:204;47:88`, `I66:204;47:89`, `I66:212;47:59`, `I66:219;47:91`, `I66:219;47:92`, `I66:227;47:55`, `I66:326;47:57`

ความต่าง node count และ TEXT count = 8 ตามเครื่องมือ แต่ **exact cause ยังไม่พิสูจน์** ไม่อ้างว่าเกิดจาก lazy-resolution หรือ authoring operation ใดเป็นข้อเท็จจริง ใช้ final snapshot สำหรับ current archived inventory; ไม่ rewrite creation ย้อนหลัง และไม่ถือความต่างนี้เป็น blocker ของ targeted design findings เพราะ final IDs/text records กับ actual PNG รองรับจุดแก้ที่ตรวจได้

## 3. Finding IDs เดิม → ผล retest

### UI05-P-01 — RESOLVED_STATIC — F01 join instructions

Evidence: `lobby-question-zero.png` ซ้าย, frame [66:230](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-230), final-readback `.views` F01 และ amendment §2

เห็นข้อความ/โครงสร้างจริง:
- `66:249` “ลิงก์สำหรับผู้เข้าร่วม” / `66:250` “[ที่อยู่ระบบ]/join”
- `66:251` “รหัสห้องสำหรับผู้เข้าร่วม” / `66:252` “ROOM-01”
- `66:253` “เปิดลิงก์ → กรอกรหัสห้อง → เข้าร่วมได้โดยไม่สมัครบัญชี”
- `66:254` บอกชัดว่าลิงก์เต็มจะแสดงเมื่อมีที่อยู่จริงของระบบ **ไม่ใช่ live URL**
- action `I66:247;47:53` “เปิดคำถามแรก” แยกออกจาก instructions และ join count ยังไม่เท่ากับ answer count

เทียบ approved UI04 P01 ที่บอกใช้รหัสจากผู้ดำเนินกิจกรรมแล้ว entry handoff ต่อกันได้ในระดับแบบ ไม่เห็น facilitator/HR credentials หรือ QR feature ใหม่

Remaining limit: proposed entry path ไม่ใช่ deployed URL, navigation/copy/join grant/retry ยัง NOT_RUN ให้ประกอบ public participant URL จริงเมื่อ implementation/deploy ได้รับอนุมัติ ไม่มีช่องว่าง MAJOR เดิมเหลือใน specimen นี้

### UI05-P-02 — RESOLVED_STATIC — F03/F04 question context และ snapshot binding

Evidence: `lobby-question-zero.png` ขวา F03 [66:258](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-258); `stale-transition.png` ซ้าย F04 [66:285](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-285); เทียบ actual approved UI04 F02 `40:112`

- F03 `66:277` “คำถาม 01 · กำลังเปิดรับคำตอบ”, `66:278` คำถาม feedback และ `66:279` scale1/5 ตรงบริบท approved F02; zero notice ระบุ “0 คำตอบที่บันทึกแล้ว” ไม่สร้าง distribution/insights แทนข้อมูล
- F04 `66:328` “ผลล่าสุดของคำถาม 01 · ก่อนการเชื่อมต่อขาด”, `66:329` คำถาม feedback, `66:330` scale และ “คำถามปัจจุบันยังไม่ยืนยัน”
- `I66:299;47:103` “ข้อมูลเก่า · ไม่ใช่ Live”; body ชี้ว่ากราฟก่อน connection ขาด ไม่ใช่ผลสดและรอ snapshot ใหม่ก่อนควบคุม
- `66:323` “ฐาน 18 คำตอบที่ยืนยันแล้ว · ข้อมูลสมมติ”; dock `I66:326;47:57` “รอข้อมูลจากระบบ” ใช้ disabled treatment ไม่มี fabricated updated-at

จึงแยก historical question identity จาก current-question authority ที่ยังไม่รู้ได้แล้ว ไม่ relabel stale graph เป็นข้อใหม่

Remaining limit: successful zero/fresh snapshot, revision/event ordering, session/question isolation และการ block controls จริงยังต้องพิสูจน์ runtime ไม่ถือ placeholder disabled ใน Figma เป็น security enforcement

### UI05-P-03 — RESOLVED_STATIC — close → next/end และ return-origin trace

Evidence: `stale-transition.png` ขวา annotation [66:333](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-333) และ current amendment §4 ตาราง trigger→authority→action→next state

เห็น heading “Transition annotations / ไม่ใช่หน้าจอแอป” และขั้นตอนบน canvas ครอบคลุมปิดคำถาม/ผลคำสั่งปิด/ข้อปิดแล้ว/เปิดข้อถัดไป/ยกเลิกก่อนยืนยันจบ/จบกิจกรรม pending-unknown/typed participant outcome

ตรวจตารางเชิง static แล้ว:
- F02/F03 close ผูก target session/question IDs → pending ใน shell เดิม ไม่ auto-end
- confirmed closed + session active → คง context/result read-only แล้วให้ explicit next-question หรือ end-session choice ไม่ไป F05 เอง
- definite failure คืน controls ตาม authoritative snapshot; timeout/unknown → F04 reconcile เดิม ไม่ออกคำสั่งใหม่เพราะ absence
- next-question มีเฉพาะเมื่อ server มีข้อถัดไป และยืนยันเปิดแล้วจึงเปลี่ยน identity
- F05 confirmation เกิดจาก explicit end action บันทึก origin ก่อนเข้า; cancel ก่อน dispatch กลับ origin ตาม state จริง ไม่ reopen ข้อที่ปิด
- dispatched end → pending ไม่มีคำสัญญา undo; unknown ตรวจ session/command เดิม; F06 เฉพาะ authoritative ended

Remaining limit: **annotated flows ไม่ใช่ clickable prototype** ไม่ได้ทดลอง focus/navigation/actions หรือ server command lifecycle การมี annotation เป็นวิธีแก้ตรงกับ finding เดิม ไม่ต้องเพิ่ม route เพื่อให้ disposition นี้ผ่าน

### UI05-P-04 — RESOLVED_STATIC — typed poll outcome continuity

Evidence: `participant-corrections.png`, P04 [66:179](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-179), P05 [66:198](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-198), P06 [66:213](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-213), final text records และ amendment §5/annotation66:333

- P04/P05/P06 แสดง “คำถาม 02” แยกจาก rating01
- selected option “เวลาสำหรับดูแลทีมไม่พอ” และ comment “อยากมีเวลาโค้ชทีมมากขึ้น” ตรงกันใน draft/sending/saved ไม่ถูกแปลงเป็น “คะแนน 3”
- P05 notice body `I66:204;47:89` “คำตอบและข้อความกำลังส่งเป็นชุดเดียวกัน ยังไม่ยืนยันว่าบันทึกแล้ว”; pending control ต่างจาก P06 ที่ `I66:219;47:92` “ระบบยืนยันคำตอบและข้อความแล้ว ไม่ต้องส่งซ้ำ”
- P04 มี optional comment, helper500/privacy reminder; typed mapping ระบุ optionID/label+comment/question02 และ immutable key/payload ของ attempt เดิมใน P05/P08/P09; saved own accepted/read-only; terminal non-save ใช้ fresh-attempt guards ตาม policy ใหม่

Remaining limit: poll P07/P08/P09 ใช้ typed shell/spec mapping ไม่ได้วาด outcome fullframes ซ้ำทุกแบบ ถือว่าเพียงพอต่อ finding ที่ขอ mapping เดิม ยังต้องตรวจ optionID→label ของคำถามเดิมและ atomic answer+comment จริงใน runtime; selected fixture ไม่ใช่ runtime default

## 4. P07 fresh-attempt policy regression ของ Product

ไม่ได้ปิด QA finding แทน QA แต่ตรวจผลกระทบต่อ Product flow เดิม:

- ภาพ R02 P07 [66:158](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=66-158) ระบุ “คำตอบเดิมไม่ได้บันทึก”, “คำถามยังเปิดอยู่”, snapshot เป็นร่างยังไม่บันทึก, secondary “แก้คำตอบก่อนส่งใหม่” และ primary “เริ่มส่งคำตอบใหม่”; มี “ใช้คำตอบเดิมได้ ไม่ต้องกรอกซ้ำ” ไม่บังคับแก้ payload เพื่อขอ new key
- Approval + amendment §1 แยก **stable replay** keyเดิม/payloadเดิม คืน prior outcome ออกจาก **fresh attempt** ที่ผู้ใช้เลือกเองหลัง terminal non-save + no late commit + still open + valid auth ใช้ new key แม้ payloadเดิม
- same key ต่าง payload เป็น conflict ไม่ overwrite; accepted คง read-only/unique หนึ่ง accepted ต่อ participant+question; server ต้อง recheck auth/close/accepted constraint atomic ตอนรับใหม่ UI เคยเห็น open ไม่ชนะ close race
- key ใหม่สร้างเมื่อยืนยันส่ง attempt ใหม่ ไม่ใช่ตอนกดแก้ร่างหรือทุก repeated click; ถ้า new attempt pending ใช้ keyของattemptนั้น
- unknown/absence/timeout ไม่ปลดล็อก fresh submit; no auto-resend และไม่มี persistent draft storage เพิ่มโดยปริยาย

เอกสารเก่า/ภาพ P07 R01 เป็น history เท่านั้น Current Product handoff มี mandatory amendment pointer ชัด ผล spec นี้ไม่ใช่หลักฐาน idempotency/race/DB behavior ที่ทำงานแล้ว

## 5. Regression ที่เปิดภาพจริงในรอบนี้

ไม่เปิดทั้ง R01 pack ซ้ำเพียงเพื่อครบจำนวน เลือกตามผลกระทบ:

| Archived image | จุดที่ตรวจ | ผลในขอบเขตภาพ/spec |
|---|---|---|
| UI-04/P01.png (40:52) | รหัสจาก facilitator, no account, nickname optional/privacy | ต่อกับ F01 instructions ใหม่ได้ ไม่ขอ approve direction เดิมซ้ำ |
| UI-04/F02.png (40:112) | question01 feedback/scale, close-question ไม่ใช่ end | context ของ F03/F04 ใหม่ตรง baseline |
| UI-05/participant-2.png | P08 50:368, P09-saved50:414, P10 50:460 | unknown ยังตรวจเดิม ไม่เสนอ fresh submit; acceptedไม่แก้/ไม่ส่งซ้ำ; join error คงชื่อเล่น; P07 เก่าใน panel เป็น history ไม่ใช่ current policy |
| UI-05/participant-closed.png | P09-non-save50:514 / unknown50:560 | closedไม่มีfreshwrites; unknownยังตรวจ receipt ตามสิทธิ์ ไม่มีHRbypass |
| UI-05/facilitator-end-pending-unknown.png | F05-pending50:890 / unknown50:953 | ไม่เสนอ cancel ที่อ้างย้อน server action; unknownตรวจ session เดิม ตรง R02 transition table |
| UI-05/facilitator-ended-hr-empty.png | F06 50:1018 / H02 50:1081 | endedต้องรอ authorityตามspec; emptyไม่ใส่กราฟ/insightsเท็จ ไม่มีraw participant fields |
| UI-05/hr-partial.png | H03 50:1162 | partialระบุฐานไม่เท่ากัน/ข้อมูลขาด ไม่ตี missing เป็น0 ไม่แสดงrawnickname/comment; optionalblankไม่ถือpartialตาม currenthandoff |

VISUAL_JUDGEMENT: ภาพ R02 คง IBM Plex Sans Thai/soft monochrome/opaque content และ reserved action docks ที่สอดคล้อง baseline ไม่เห็น overlap/clipping ชัดใน composition ที่เปิด ไม่ใช่การรับรอง every-glyph/320px/zoom/keyboard/actual backdrop contrast หรือ human usability

Preservation scope: `git diff --exit-code 93ee52b0bff7ca3eb1e49293452b75dd0cc16913 -- docs/product/evidence/UI-04 docs/product/evidence/UI-05` คืน exit code0 จึงยืนยัน archiveสองชุดคงเดิมในขอบเขต paths ที่ตรวจได้; approval/creation/final preserved arrays เท่ากันจาก jq: UI04 count197/FNV7ba8c687, R01 count573/FNVff0cdf86 เป็น **bounded producer fingerprints** ไม่ใช่ Product live canvas hash หรือ full global-property audit

## 6. Open decisions / deferred / NOT_RUN

- Dedicated expiry full-frame ยัง **DEFERRED สำหรับ human state review** เท่านั้น ไม่เป็น blocker รอบ targetedนี้ เพราะ unknownมี safe shell/spec; แต่ exact user-facing unavailable/expired/revoked mapping, no-endless-retry action, TTL/grace/revoke/retention และ authorized help/recovery channel ยังต้องตัดสินและตรวจ **ก่อน receipt-slice implement/release** ไม่ได้รับอนุมัติจาก fresh-attempt decision
- Expiry/revocation/unavailable ต้องคง unknown ไม่แปล403/404เป็นnon-save ไม่เสนอnewkeyหรือHRbypass; accepted replayหลังcloseมีเฉพาะสิทธิ์ที่ยังvalid ไม่สัญญาว่าอ่านได้ตลอด
- Participant URL เป็น proposed placeholder; actual public origin/route wiringรอ implementation/deploy approval ไม่ใช่ live link จากภาพ
- Fixture question/option/comment/30คน/18คำตอบ/คะแนน3 เป็นตัวอย่างเพื่อ design review ไม่ใช่ข้อมูล DB/realtime; runtimeต้องใช้ค่าจริง
- Denominator/privacy suppression/retention และ human state acceptance ยังต้องตกลงใน slice ที่เกี่ยวข้อง ไม่อนุมานจาก visual acceptance ของ4UI04views
- Count204→212 exactcause ยัง unverified ดังระบุ ไม่แก้ประวัติหรือแต่งเหตุผล

**NOT_RUN ทั้งหมด**: application/DB/API/WS/load30clients, atomic persistence, stable replay/conflict/fresh-key uniqueness, close/latecommit race, auth/isolation/revoke/expiry, authoritative snapshot/order/freshness และ production privacy controls

Accessibility/mobile **NOT_RUN**: Thai40/500graphemes/emoji/IME, multiline Enter, native radio semantics, labels/errors/focus/live announcements, 320px/200%zoom/safearea/keyboard/dock reflow, reducedmotion/transparency และ pixelcontrast/browserperformance รูปนิ่งไม่พิสูจน์ behaviors เหล่านี้

HR/self-report ไม่ใช่ผลวินิจฉัยหรือประเมินพนักงาน; ไม่อ้าง anonymous สมบูรณ์ ยังอาจมี participant/session identifiers/logs ที่เชื่อมโยงได้

## 7. Disposition / next gate

- `UI05-P-01` → RESOLVED_STATIC
- `UI05-P-02` → RESOLVED_STATIC
- `UI05-P-03` → RESOLVED_STATIC
- `UI05-P-04` → RESOLVED_STATIC
- Open Critical/Major IDs จาก Product รอบนี้: ไม่มีที่พบใน targeted scope; ไม่ประกาศว่าปลอด defect นอกขอบเขตหรือปิด finding ของ QA
- Overall **READY_FOR_HUMAN_STATE_REVIEW**: พร้อมให้ผู้ใช้ดู revised states ไม่ใช่ human approval/acceptance และไม่ใช่ C1 build approval
- Coordinator อ่านรายงานกลับ รวม Product/QA ที่ตรวจอิสระ และติดตาม human gate ผู้ใช้รับงานและ Coordinatorปิด task เท่านั้น Product ไม่ commit/dispatch coding/close ticket

Skills: `writing-for-agents` ใช้ evidence/criteria/limitations; `unslop` ใช้ audit consistencyตามapproveddirectionและPROJECT-SAFETY ไม่ใช้helpers/implementation (Damir Sokolovsky @heydamir, CC BY4.0) ไม่อ้าง runtime activation หรือ savings ที่ไม่ได้วัด
