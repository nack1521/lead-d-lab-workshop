# UI-05 — Independent Product & UX Review R01

Verdict: **CHANGES_REQUESTED** — เฉพาะความครบถ้วนของ design/state pack ไม่ใช่ผลทดสอบแอป ไม่อนุมัติ UI05/build แทนผู้ใช้

Reviewer: canonical `lead-d-product` ตรวจเอง ไม่ใช้รายงาน QA หรือ advisory ก่อนสร้างแทนการตรวจ artifact

## 1. Baseline และขอบเขตการตรวจจริง

- Brief: `docs/handoffs/UI-05-INDEPENDENT-REVIEW-R01.md`, brief commit `19ef090d50d593b910263d39b7f7abb3f3825a84`
- Evidence baseline: `1724ecc6de84a38163751aab041a26e2053b9283`
- `git rev-parse HEAD` คืน brief commit ข้างต้น; `git diff --exit-code` เทียบ evidence/UI-05, evidence/UI-04, UI-05-STATE-PACK และ product-UI-05 handoff กับ evidence baseline คืน exit code 0 ไม่มี diff ในขอบเขตนี้
- เวลา local ที่ตรวจจาก `date`: `2026-11-06T16:15:30+0700 (+07)` ไม่ใช่เวลา server Figma
- เป็น **archived-asset review** ไม่เรียก live Figma จึงไม่ยืนยัน canvas ปัจจุบัน
- Stable references: [UI05 root 47:48](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=47-48), [UI04 approved root 40:43](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=40-43), page `1:2`
- ตอนเริ่ม `git status --short` พบ dirty เดิม `docs/AI-PROGRESS.md` และ `docs/handoffs/ANTIGRAVITY-C1.md`; ไม่แตะทั้งสองไฟล์
- อ่าน target report แล้วไม่พบไฟล์ก่อนสร้าง รอบนี้เขียนเฉพาะรายงานนี้ ไม่แก้ evidence/Figma/shared files/app/tests/config ไม่ install/run app/agy/commit/push/deploy และไม่อ่านผล review ของ QA

### เอกสารที่อ่าน

`AGENTS.md`, `docs/TEAM-WORKFLOW.md`, independent review brief, `docs/product/UI-05-STATE-PACK.md`, `docs/handoffs/product-UI-05.md`, `docs/product/evidence/UI-05/advisory-R01.md`, `final-readback.json`, `verification.json`, `screenshots.json`, `state-ledger.json`, `docs/product/UI-01-COMPONENT-STATES.md`, `docs/product/WF-01-R1-DELIVERY.md` และ `docs/product/UI-04-SELECTIVE-GLASS.md`

Advisory R01 เป็น risk/spec input เท่านั้น ไม่ใช่ผู้ตรวจ artifact รอบนี้ และ producer verification ไม่ถูกยกเป็น independent QA PASS

## 2. วิธีตรวจและระดับหลักฐาน

- **STATIC_CHECKED**: ใช้ `terminal` รัน read-only git, `jq` นับ/dedupe จาก records จริง, `shasum -a 256` ของ PNG จริง และ `date`; ใช้ `read_file` อ่าน contracts/evidence
- **VISUAL_JUDGEMENT**: ใช้ `vision_analyze` เปิด PNG ทั้ง UI05 9 panels และ UI04 4 views เอง รวมขยาย crop จากภาพเดิมของ F01/F04/P04 เพื่ออ่านข้อความ ไม่ generate/reconstruct ภาพ ไม่ใช่การวัด usability หรือ pixel contrast
- **PRODUCER_EVIDENCE_REVIEWED**: ตรวจ consistency ของ summary metrics ใน archived JSON แต่ไม่ได้รัน geometry/contrast calculation จาก node tree ดิบหรือ Figma ซ้ำ
- **NOT_RUN**: live canvas, clickable interaction, app/DB/API/WS/receipt/race/load/security และ browser accessibility/mobile behavior ทั้งหมด

### ภาพที่เปิดจริงและ node mapping

UI05 paths ทั้งหมดอยู่ใต้ `docs/product/evidence/UI-05/`:

| PNG panel | Panel node | State frames ที่ดู |
|---|---|---|
| components.png | 50:48 | button/field/notice catalog ของ sets 48:48, 48:49, 48:50 |
| participant-1.png | 50:136 | P02 50:137, P04 50:179, P05 50:226, P06 50:272 |
| participant-2.png | 50:319 | P07 50:320, P08 50:368, P09-saved 50:414, P10 50:460 |
| participant-closed.png | 50:513 | P09-not-saved 50:514, P09-unknown 50:560 |
| facilitator-lobby-zero.png | 50:607 | F01 50:608, F03 50:671 |
| facilitator-stale-confirm.png | 50:735 | F04 50:736, F05-confirmation 50:823 |
| facilitator-end-pending-unknown.png | 50:889 | F05-pending 50:890, F05-unknown 50:953 |
| facilitator-ended-hr-empty.png | 50:1017 | F06 50:1018, H02 50:1081 |
| hr-partial.png | 50:1161 | H03 50:1162 |

UI04 ที่เทียบจริง: `docs/product/evidence/UI-04/P01.png` (40:52), `P03.png` (40:75), `F02.png` (40:112), `H01.png` (40:168) ไม่ขอเปลี่ยน approved visual direction ทั้งสี่หน้า

## 3. Independent static checks

ใช้ records `.screens`, `.baselineReferences`, `.sets[].variants` และ `.allNodeIds` ใน final-readback ไม่คัด declared totals อย่างเดียว:

| Check | ผลคำนวณจริง |
|---|---|
| Authored state views | 19 |
| Unique authored codes | 15 |
| Approved UI04 references | 4 |
| Visual references รวม | 23 |
| Dedup canonical codes รวม | 19: P01–P10 = 10, F01–F06 = 6, H01–H03 = 3 |
| Native local sets / variants | 3 sets / 19 variant records |
| allNodeIds / unique IDs / type-count sum | 573 / 573 / 573 |
| UI05 screenshot records / unique paths / unique panel IDs | 9 / 9 / 9 |

ใช้ exact `.code` แล้ว `unique/group_by` ไม่ใช้ substring P; P09/F05 หลาย specimens ไม่ทำให้กลายเป็น canonical code เพิ่ม `shasum -a 256` ของ UI05 PNG ทั้งเก้าคืนค่าตรงกับรายการใน screenshots.json ที่อ่าน และคำนวณ hashes ของ UI04 ทั้งสี่เป็นหลักฐานการอ่านไฟล์ด้วย ไม่ได้เก็บไฟล์ใหม่

Producer metrics ที่อ่านและคำนวณ summary จากค่าที่ producer บันทึก:
- มี 13 contrast pairs; lowest recorded ratio = 4.668692999235759 และ recorded failures ว่าง ไม่ใช่การ recompute luminance หรือ pixel-level blur/contrast โดย Product
- recorded phone bottom < reservedY ทุก specimen; smallest recorded clearance = 141 จากค่าคู่ใน JSON ไม่ใช่การตรวจ reflow ที่ 320px/zoom/keyboard จริง
- producer บันทึก visible text 255, overflow/collapsedText ว่าง; readback `imageFilledNodes=[]` และ fonts IBM Plex Sans Thai Regular/Medium เป็น archived structural evidence ไม่รับรอง live state หรือทุก internal clipping
- approvedRootFingerprint บันทึก count 197 และ `7ba8c687` matches; เป็น bounded noncryptographic producer check ไม่ใช่การ hash live canvas ใหม่โดย Product หรือ full global-style audit

## 4. Findings

Severity ในรายงานนี้: MAJOR = ช่องว่าง core flow/context ที่ควรแก้หรือขอ human decision ชัดก่อนยอมรับ state pack; MINOR = ปรับ traceability/specimen โดยไม่เปลี่ยน approved direction ไม่ใช้ severity เป็นคำตัดสิน runtime bug

ไม่มีหลักฐาน CRITICAL ที่ยืนยันได้จาก archived artifacts ที่ตรวจ ข้อเสนอแต่ละข้อยังไม่ได้แก้ในรอบ review นี้

### UI05-P-01 — MAJOR — F01 ไม่แสดง join instructions ที่ใช้เริ่มห้องได้

- Evidence: `facilitator-lobby-zero.png` ฝั่งซ้าย, frame `50:608` [เปิด node](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=50-608) รวม crop F01 เต็มหน้า
- ข้อความจริง: “ห้องพร้อมเริ่มกิจกรรม”, “ผู้เข้าร่วมห้อง 30 คน · ยังไม่มีคำถามเปิด จำนวนเข้าห้องไม่ใช่จำนวนคำตอบ”, action “เปิดคำถามแรก”; มุมบนมีเพียง “ผู้ดำเนินกิจกรรม / ROOM-01”
- สิ่งที่ไม่ปรากฏใน frame: participant entry URL/วิธีเปิดหน้าร่วม, label ที่บอกชัดว่า code ไหนให้ผู้เข้าร่วมกรอก หรือ join instruction ที่ facilitator ใช้บอกคนในห้องได้ การมี ROOM-01 เป็น context ไม่เท่ากับมี participant link/instructions
- Requirement: UI-01 contract F01 ต้องมี lobby/join instructions; UI04 P01 ที่อนุมัติแล้วบอก participant ให้ “ใช้รหัสห้องจากผู้ดำเนินกิจกรรม” จึงต้องมีจุดให้ facilitator ส่งต่อข้อมูลนั้น
- Impact (UX inference ไม่ใช่ user test): core join flow มีช่องว่างฝั่ง facilitator แม้ count fixture จะบอกว่าเข้ามาแล้ว 30 คน ภาพปัจจุบันข้ามขั้นตอนที่ทำให้คนเข้ามาได้
- Recommended fix: เพิ่ม instruction block สั้นบน opaque canvas ระบุ participant entry link/entry path ที่จะใช้ และ label “รหัสห้องสำหรับผู้เข้าร่วม” พร้อม synthetic code ไม่ต้องเพิ่ม QR generator หรือ feature ใหม่ หาก entry ถูกแจกนอกระบบโดยเจตนา ให้ผู้ใช้ยืนยัน workflow นั้นและทำ reference ให้ชัดแทนการปล่อยช่องว่าง
- Retest: เห็น entry point + code + action เปิดคำถามแยกกัน และไม่เผย facilitator/HR credentials; ไม่อ้างว่า copy/link ทำงานจริงจากภาพ

### UI05-P-02 — MAJOR — F03/F04 สูญเสียบริบทคำถาม โดย F04 ยังแสดงกราฟเก่า

- Evidence: `facilitator-lobby-zero.png` ขวา F03 `50:671`; `facilitator-stale-confirm.png` ซ้าย F04 `50:736` [เปิด F04](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=50-736); เทียบ `UI-04/F02.png` node `40:112`
- UI04 F02 มี workshop title, “คำถาม 01” และข้อความคำถาม feedback ชัด พร้อม action “ปิดรับคำถามนี้”
- UI05 F03 เหลือ heading “ยังไม่มีคำตอบที่บันทึกแล้ว” กับ notice 0 คำตอบ และ action “ปิดรับคำถามนี้”; F04 heading “กำลังเชื่อมต่อกับห้องอีกครั้ง”, “ข้อมูลเก่า · ไม่ใช่ Live”, chart “การกระจายความมั่นใจ” และฐาน 18 คำตอบ ไม่มีเลข/ข้อความคำถามของ snapshot หรือคำอธิบาย scale ที่ F02 เคยให้
- STATIC observation: archived frame/crop เหล่านี้ไม่แสดง question context ดังกล่าว ไม่ได้พิสูจน์ว่าระบบหลังบ้านปะปน session/question
- Impact (UX inference): facilitator ไม่เห็นว่ากำลังปิดข้อใดใน zero state และอาจตีความว่ากราฟ stale เป็นของคำถามปัจจุบันเมื่อเปลี่ยนข้อหรือ reconnect แม้ป้ายไม่ใช่ Live ถูกต้องแล้ว
- Recommended fix: คง compact workshop/question context บน F03 และ F04; กำกับ F04 ว่า “ผลล่าสุดของคำถาม …” พร้อม scale/ฐานของ snapshot เดิม แยกจาก current authoritative question ที่ยัง reconcile ไม่ได้ ไม่เดา updated-at ไม่ติด Live ก่อน fresh snapshot
- Retest: เปลี่ยนสถานะ data → zero/stale แล้วยัง trace คำถามได้จากภาพ และ contract ระบุว่าข้อมูลเก่าจะไม่ถูก relabel เป็นข้อใหม่ ไม่ต้องเปลี่ยน approved F02 direction

### UI05-P-03 — MINOR — ยังขาด action-to-next-state trace สำหรับปิดข้อ → ข้อถัดไป/จบ session

- Evidence: approved `UI-04/F02.png` `40:112` มี “ปิดรับคำถามนี้”; UI05 F03 `50:671` action เดียวกัน; F05 `50:823` แสดง “จบเวิร์กช็อปนี้หรือไม่?” และ “กลับไปที่ห้อง”/“ยืนยันจบเวิร์กช็อป” แต่ inventory/handoff ไม่ผูกว่าจากจุดใดเข้าหน้านี้หลังปิดข้อ
- Spec ส่งผ่าน semantics ถูกต้อง: close-question ไม่ใช่ end-session และ pending/unknown ไม่ undo แต่ mapping code→node ยังไม่ใช่ mapping trigger→authority→action→next-state
- Impact: implementer หรือผู้ใช้ review สามารถตีความการกดปิดคำถามว่าไป F05 ทันที หรือไม่ทราบทางเปิดข้อถัดไป ทั้งสองอย่างยังไม่ได้ถูกภาพ/trace กำหนด
- Recommended fix: เพิ่ม annotated transition table/flow จาก close-question confirmed/failed/unknown ไปสถานะที่อนุญาต รวมทางเริ่ม F05, ทาง cancel ก่อน dispatch กลับ frame ต้นทาง และทาง F06 หลัง authoritative ended; ไม่จำเป็นต้องทำ clickable prototype หรือเพิ่ม routes
- Retest: review flow แบบไล่ action ได้โดยไม่มีสมมติฐานว่าปิดคำถามเท่ากับจบ session และไม่ขยาย C1 เป็น full UI

### UI05-P-04 — MINOR — Poll submission ยังไม่มี explicit snapshot mapping ใน state pack

- Evidence: `participant-1.png` P04 `50:179` heading “อะไรเป็นอุปสรรคสำคัญในการดูแลทีม?” selected “เวลาสำหรับดูแลทีมไม่พอ” และ header “คำถาม 01”; P05 `50:226`/P06 `50:272` แสดง snapshot “คะแนน 3”; P07/P08/P09 specimens ก็เป็นคะแนน ไม่ใช่ selected poll choice เทียบ approved P03 ซึ่งใช้คำถาม 01 กับ feedback rating
- ไม่สรุปว่า runtime ส่งคะแนนผิด: specimens เป็นตัวอย่างแยก state แต่ยังไม่มี trace ที่บอกชัดว่าสามารถใช้ generic outcome shell กับ poll payload อย่างไร
- Impact: ถ้าใช้ภาพเป็น source อย่างเดียวอาจทำ snapshot เป็น score-only หรือสับสน question 01 ของ rating/poll ระหว่าง human walkthrough
- Recommended fix: เพิ่ม annotation mapping ว่า rating แสดงคะแนน+comment ส่วน poll แสดง option label+comment ของ immutable submission เดิม และใช้ fixture question context ที่แยกกันหรือระบุว่าเป็น alternate question specimen ไม่จำเป็นต้องแตก outcome frames ทุกอันใหม่
- Retest: ไล่ poll → sending/saved/non-save/unknown/closed ได้โดยคง option/comment/key ของชุดเดิม และไม่แปลง poll เป็นคะแนน

## 5. Coverage: flow / authority / action ที่ตรวจแล้ว

| Branch / node | สิ่งที่ตรวจจากภาพและ contract | ข้อจำกัด/ผล review |
|---|---|---|
| P01 40:52 → P10 50:460 | room field invalid, optional nickname retained, retry join; P01 privacy ไม่มี promise anonymous100% | VISUAL_JUDGEMENT: labels/error ชัด; join URL ฝั่ง F01 ยังขาดตาม P-01; actual grant/join retry NOT_RUN |
| P03 40:75 / P04 50:179 | rating endpoints และ selected เป็นมากกว่าสี; poll single choice, optional multiline comment/helper500/privacy | รูป selected เป็น fixture ไม่ใช่ runtime default; poll→outcome mapping ตาม P-04 |
| P05 50:226 → P06 50:272 | “กำลังรอผลจากระบบ” ต่างจาก “ยืนยันว่าบันทึกแล้ว”; snapshot score+comment; pending ไม่แสดง saved ก่อนยืนยัน | Atomic persistence/immutable payload/own receipt เป็น SPEC ไม่ใช่ผลรัน |
| P07 50:320 | “ระบบยืนยันว่าคำตอบชุดนี้ไม่ได้บันทึก” + “แก้คำตอบ” แยก “ส่งชุดเดิมอีกครั้ง” | terminal non-save + still open ก่อน edit/new key อยู่ใน spec; retry same key/payload และ conflict ต่าง payload ยัง NOT_RUN |
| P08 50:368 | “ผลคำตอบยังไม่ทราบ” + ตรวจสถานะคำตอบเดิม; ไม่มี submit ใหม่ | outcome unknown ไม่ถูกยุบเป็น failure; snapshot/key immutability และ read-missing ไม่เป็น non-save อยู่ใน handoff |
| P09 50:414/514/560 | saved/non-save/unknown แยก; unknown ยังมีตรวจสถานะ, non-save/closed ไม่มี submit | accepted replay หลัง close ต้องอยู่ใน auth/grace; expiry mapping ดูหัวข้อถัดไป ไม่มี HR bypass ในภาพ |
| F03 50:671 / F04 50:736 | zero แยกจาก stale; stale graph มี label ไม่ใช่ Live และ mutation control รอข้อมูล | fresh snapshot/order/session-question isolation อยู่ใน spec; current-question context ขาดตาม P-02 |
| F05 50:823/890/953 → F06 50:1018 | confirmation/danger ก่อน dispatch, pending ไม่มี cancel ที่อ้าง undo, unknown ตรวจสถานะเวิร์กช็อป, ended หลังยืนยัน | semantic distinction ดี; entry/return trace ตาม P-03; runtime cancel/race/replay NOT_RUN |
| H01 40:168 / H02 50:1081 / H03 50:1162 | summary self-report ไม่ใช่ประเมินคน, empty ไม่แสดงกราฟ, partial ระบุฐานคนละข้อ/ขาดข้อมูล ไม่ใส่เปอร์เซ็นต์เมื่อไม่ทราบฐาน | ไม่มี raw nickname/comment ใน F/HR ภาพที่ดู; API isolation/retention ยัง NOT_RUN; optional blank ไม่ใช่ missing ตาม spec |
| Component catalog 50:48 | button secondary/disabled/focus/pending แยกกัน; fields empty/focus/invalid/disabled; notices มี text ไม่ใช้สีตัดสินอย่างเดียว | 3 local sets ไม่ใช่ production library ครบสิบ families; focus ring ในภาพไม่ใช่ keyboard focus behavior |

### Visual consistency / Unslop judgement

VISUAL_JUDGEMENT: UI05 คง soft monochrome, opaque content, typography และ selective-glass action docks ใกล้ approved UI04; ไม่พบ overlap/clipping ชัดใน panels ที่เปิด และมี reserved action region มือถือ ไม่เห็นเหตุให้เปลี่ยน direction ใหม่หรือเพิ่ม decoration ผลนี้เป็น judgement จากภาพ ไม่ใช่ human usability acceptance หรือข้อพิสูจน์ blur contrast/performance ไม่มีข้อเสนอให้รื้อ approved baseline

## 6. Expiry / unavailable และ open decisions

### Dedicated expiry specimen: DEFERRED สำหรับ human design review ไม่ใช่เหตุ BLOCKED รอบนี้

เหตุผล: P08/P09-unknown มี safe generic unknown presentation และ spec ระบุ unavailable/expired/revoked ไม่ promote เป็น non-save ไม่สร้าง key ใหม่ ไม่เสนอ HR bypass จึง review state pack ได้โดยยังไม่ต้องเพิ่ม full-frame expiry ทุกกรณี

แต่เป็น **gate ก่อน implement/release ของ receipt-recovery slice** ไม่ใช่ deferred ไม่มีกำหนด:
- Product/Antigravity เสนอ exact user-facing mapping ของ expiry/revoke/unavailable ที่ไม่เปิดเผยสิ่งเกินสิทธิ์ รวม action เมื่อกดตรวจซ้ำแล้ว auth หมด ไม่ทิ้งผู้ใช้ไว้ใน retry loop โดยอ้างว่าจะอ่านได้ตลอด
- ผู้ใช้อนุมัติ TTL/grace/revoke/retention และช่องทางช่วยกู้ที่อนุญาต; Coordinator บันทึก decision; QA ตรวจหลังมี build
- ต้องคง unknown เมื่อไม่อาจยืนยัน outcome ไม่แปล 403/404/network error เป็น non-save; accepted replay หลัง close คืนของเดิมเฉพาะ auth ที่ยัง valid ไม่มี bypass
- ไม่ต้องใส่รายละเอียด internal token/status code บนหน้าผู้เข้าร่วมเพื่อให้ดู technical

Open decisions อื่น:
- คำถาม/scale/ตัวเลือกตัวอย่างและ question identity ใน walkthrough ตาม P-04 ไม่ให้ใช้ fixture30/18/คะแนน3เป็น production constants
- นิยาม denominator รายข้อ, low-count suppression/minimum count, retention/deletion และ safe help channel ที่ยังไม่อนุมัติ ไม่อนุมานจาก UI04 visual approval
- รูปแบบ transition หลังปิดข้อและ entry ไป end-session ตาม P-03 โดยไม่เพิ่ม scope C1
- Native sets vs composites: C03 textarea, C04 rating, C05 poll, C07 context, C08 aggregate, C09 coverage, C10 end-session ยังเป็น screen/spec patterns; ไม่บังคับสร้าง library เพิ่มหรือ install dependency เพื่อให้ review ผ่าน

## 7. Runtime / accessibility / security NOT_RUN

ภาพ 390px ไม่พิสูจน์ 320px/200% zoom, safe-area/keyboard/dock reflow, Thai40/500 graphemes/emoji/IME, multiline Enter, native radios/radiogroup, keyboard order/focus retention/modal return focus, accessible names/error association/live announcements, reduced motion/transparency หรือ actual browser blur contrast

ไม่รัน atomic answer+comment persistence, idempotency duplicate/retry/conflict, late commit/close race, receipt auth/grace/revoke, event ordering/freshness, participant/session isolation, API ไม่ส่ง raw nickname/comment, PostgreSQL restart, authenticated WS, concurrent30 clients หรือ deployment ทุกอย่างข้างต้น **NOT_RUN** ไม่ใช่ PASS/FAIL จากภาพ และไม่ได้อนุมัติ C1 local build

## 8. Disposition และ next gate

- Verdict **CHANGES_REQUESTED** เพราะ MAJOR `UI05-P-01` และ `UI05-P-02`; MINOR `UI05-P-03`, `UI05-P-04` ให้ปรับ traceability/specimen แบบเล็กที่สุด
- แก้/ตัดสินใจการละ omission อย่างชัดเจนภายใต้ approval ที่ถูกต้อง แล้วเก็บ revised artifact evidence ให้ตรวจเฉพาะจุดก่อนเสนอ human state acceptance
- ผู้ใช้เป็นผู้ยอมรับ UI05; Coordinator รวม findings/อ่านรายงานกลับและปิด task เท่านั้น Product ไม่ปิด ticket ไม่ส่ง implementation และไม่ขยาย C1 เป็น HR/full UI
- ไม่มี global/Figma/app changes จาก review นี้; ไม่อาศัย canonical QA report และไม่ได้ส่งต่อให้บอตอื่นทำแทน

Skills ที่ใช้: `writing-for-agents` เพื่อจัด evidence/criteria/limits; `unslop` เฉพาะ audit ตาม direction ที่อนุมัติ + PROJECT-SAFETY/reference signs ไม่ใช้ helpers หรือสร้างโค้ด (Unslop โดย Damir Sokolovsky @heydamir, CC BY 4.0) ไม่อ้าง runtime-verified skill หรือผลประหยัดที่ไม่ได้วัด
