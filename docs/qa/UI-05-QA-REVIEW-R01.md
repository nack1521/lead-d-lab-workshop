# UI-05 independent QA STATIC/VISUAL review — R01

What this change does: UI-05 เพิ่ม state views และ local component variants จาก UI-04 visual baseline สำหรับ participant, facilitator และ HR โดยแยกผลส่ง/สถานะห้อง และแสดง fixture เพื่อใช้ review ไม่ใช่แอปที่ทำงานแล้ว

**Verdict: CHANGES_REQUESTED — เฉพาะความครบถ้วนของ design handoff ก่อน human state review รอบตัดสินใจ** พบ Major สองข้อด้าน retry semantics และบริบทคำถาม ไม่ใช่ runtime defect ที่พิสูจน์แล้ว ผู้ใช้ยังสามารถดูภาพเป็น draft เพื่อให้ feedback ได้; ไม่ใช่การปิด task, visual acceptance หรืออนุมัติ C1 coding. Coordinator เป็นผู้รวมผลและผู้ใช้ตัดสินใจ

ผู้ตรวจ: canonical `lead-d-qa` | เวลาบันทึกจากเครื่อง 2026-11-06 16:12:00 +0700 | brief baseline ตาม Coordinator `19ef090d50d593b910263d39b7f7abb3f3825a84`; evidence baseline ที่ระบุใน brief `1724ecc6de84a38163751aab041a26e2053b9283` ไม่ได้ใช้ Git ตรวจ commit ในรอบนี้

## หลักฐานและวิธีตรวจอิสระ

- อ่าน `AGENTS.md`, `docs/TEAM-WORKFLOW.md`, brief `docs/handoffs/UI-05-INDEPENDENT-REVIEW-R01.md`, `docs/product/UI-05-STATE-PACK.md`, `docs/handoffs/product-UI-05.md`, `docs/product/UI-01-COMPONENT-STATES.md`, advisory และ `docs/product/UI-04-SELECTIVE-GLASS.md`; advisory เป็น document-only ไม่ใช่ผลตรวจนี้
- อ่าน `docs/product/evidence/UI-05/final-readback.json`, `verification.json`, `screenshots.json`, `state-ledger.json`; เปิด **ภาพจริงทั้งเก้า** ด้วย `vision_analyze`: `components.png`, `participant-1.png`, `participant-2.png`, `participant-closed.png`, `facilitator-lobby-zero.png`, `facilitator-stale-confirm.png`, `facilitator-end-pending-unknown.png`, `facilitator-ended-hr-empty.png`, `hr-partial.png`; crop เพิ่ม P07/P08, F04 และ H03
- เปิดภาพ UI-04 approved baseline จริง `docs/product/evidence/UI-04/P01.png`, `P03.png`, `F02.png`, `H01.png`; UI04 อนุมัติ draft เฉพาะ 4 views ไม่ครอบคลุม UI05 states
- `jq` นับและ dedupe จาก `final-readback.json` จริง: authored 19 views / 15 codes, baseline references 4, รวม 23 references / 19 distinct codes P01–P10, F01–F06, H01–H03; 3 sets และ 19 variants. คำสั่ง `jq` ครั้งแรกผิด syntax/type และ error; แก้คำสั่ง read-only แล้วได้ exit 0 ผลข้างต้น. `shasum -a 256` ของ PNG ทั้ง 9 ตรง SHA-256 ที่ระบุใน `screenshots.json` โดยเปรียบเทียบรายการที่คืนมา; นี่พิสูจน์ความตรงกับ manifest ที่อ่าน ไม่พิสูจน์ที่มาของ manifest หรือ live canvas
- ไม่อ่าน live Figma: นี่คือ **archived-asset review** ไม่ยืนยันว่าสภาพ canvas ล่าสุดตรงภาพ. `final-readback.json` รายงาน 573 nodes, 255 visible text nodes, overflow/collapsed ว่าง, 13 solid-fill contrast pairs, และ UI04 fingerprint ตรง; เป็น producer evidence แบบ bounded ไม่ใช่ผลคำนวณซ้ำทุก node/contrast หรือ full global-style/pixel audit
- `ponytail-review` read-loaded และประยุกต์เฉพาะการรายงาน concrete findings; ไม่ได้ใช้แก้ code หรือรับรอง runtime

## Findings

### Must fix — Major

**QA-UI05-01 — P07 ส่งชุดเดิมซ้ำด้วย key เดิมหลัง terminal non-save ขัด stable terminal receipt**
- Evidence: `participant-2.png` / P07 `50:320` แสดง “ระบบยืนยันว่าคำตอบชุดนี้ไม่ได้บันทึก”, “คำถามยังเปิด คุณส่งชุดเดิมหรือแก้ไขก่อนส่งได้” และปุ่ม “ส่งชุดเดิมอีกครั้ง”; `UI-05-STATE-PACK.md:58` กำหนด terminal non-save แล้ว unchanged retry = same key + payload; `docs/handoffs/ANTIGRAVITY-C1.md:77,81–85` ระบุ terminal outcome และ same key + same payload คืน stable outcome เดิม
- กรณี: server ยืนยัน terminal rejection/non-save พร้อม receipt ที่ต้อง replay ผลเดิม เมื่อกดส่งชุดเดิมโดย reuse key เดิม ย่อมได้ non-save เดิมตาม contract ไม่ใช่ความพยายามใหม่ที่จะบันทึก; UI ไม่บอกข้อจำกัดนี้ จึงเสี่ยงให้ผู้ตอบติด loop หรือทำให้ implementation ละเมิด idempotency. ไม่อ้างว่าบั๊กนี้เกิดในแอปจริง
- Suggested fix: ให้ Product/Coordinator และผู้ใช้ตัดสิน contract แยก (1) retry/reconcile key เดิมเมื่อผลยังไม่ terminal กับ (2) new attempt ที่ใช้ key ใหม่หลัง terminal non-save ยืนยันว่าคำขอเดิม commit ภายหลังไม่ได้และ question ยังเปิด แม้ payload ไม่เปลี่ยน หรือระบุ semantics อื่นที่ไม่ขัด stable receipt; ปรับ P07 action/microcopy, state pack, handoff และ test seam ให้ตรงกันก่อน implementation. ห้ามใช้ transient GET absence เป็น terminal confirmation

**QA-UI05-02 — F03/F04 ไม่มีบริบทคำถามติดกับผล/ปุ่มควบคุม**
- Evidence: `facilitator-lobby-zero.png` F03 `50:671` แสดง “ยังไม่มีคำตอบที่บันทึกแล้ว” และ action “ปิดรับคำถามนี้” แต่ไม่เห็นหมายเลขหรือข้อความคำถาม; `facilitator-stale-confirm.png` F04 `50:736` แสดงกราฟเก่า “ข้อมูลเก่า · ไม่ใช่ Live” แต่ไม่ระบุว่ากราฟเป็นข้อใด. เปรียบเทียบ `UI-04/F02.png` node `40:112` ซึ่งแสดง “คำถาม 01” และข้อความคำถาม; `UI-01-COMPONENT-STATES.md:15,49–52` กำหนด session/question context
- กรณี: facilitator เปลี่ยนข้อหรือ reconnect หลังคำถามเคลื่อนไปแล้ว อาจอ่านกราฟเก่าว่าเป็นข้อปัจจุบัน หรือกดปิดข้อที่ไม่ตั้งใจจาก F03; label stale ช่วยบอกความสด แต่ไม่ระบุตัวตนข้อมูล. นี่คือความเสี่ยงในแบบ ไม่ใช่ผล runtime
- Suggested fix: แสดง question identity/ข้อความที่มนุษย์อ่านได้ใน F03 และแนบ identity ของ snapshot เดิมกับ F04; ระบุ unknown context เมื่อยังตรวจไม่ได้ และเปิด control เฉพาะหลัง authoritative reconcile session/question. ไม่ต้อง redesign ทิศทาง UI04

## Coverage / traceability ของการตรวจ

| พื้นที่ / evidence | STATIC_CHECKED / VISUAL_JUDGEMENT และช่องว่าง |
|---|---|
| P01 `40:52`, P02 `50:137`, P03 `40:75`, P04 `50:179`, P10 `50:460` | ภาพแสดง nickname/comment optional, privacy reminder, rating/poll และ join error; ตัวอย่าง selected ไม่พิสูจน์ default selection, 40/500 grapheme, IME หรือ nickname persistence runtime. P04 เป็น composite ไม่ใช่ native radio implementation |
| P05 `50:226`, P06 `50:272` | ภาพแยกกำลังส่งและยืนยันบันทึก พร้อม answer/comment ตัวอย่าง; `UI-05-STATE-PACK.md:56–57` ระบุ immutable payload/key และ atomic persistence เป็น server authority ไม่พิสูจน์ DB transaction |
| P07 `50:320`, P08 `50:368` | P07 แยกแก้กับส่งเดิม; P08 บอกผลเดิมยังไม่ทราบและให้ตรวจเดิมก่อน ไม่บอกว่าล้มเหลว; key semantics มี QA-UI05-01. Payload conflict / accepted replay หลัง close ระบุใน `product-UI-05.md:35–37` ยังไม่มี dynamic proof |
| P09 `50:414`, `50:514`, `50:560` | ภาพสามแบบแยก closed+saved, closed+confirmed non-save, closed+unknown; unknown เสนอตรวจสถานะเดิม ไม่เสนอ submit ใหม่. Authorization/receipt lifetime ไม่พิสูจน์จากภาพ |
| Receipt expired/revoked | **DEFERRED ไม่ใช่ blocker เฉพาะการส่งให้ human review**: `UI-05-STATE-PACK.md:60–62`, `product-UI-05.md:39,48` ระบุ unknown notice + safe reason ไม่ให้ HR bypass/ส่งใหม่; ยังไม่มี dedicated full-frame specimen. ก่อน implement/release ของ seam นี้ผู้ใช้ต้องตัดสิน TTL/grace/revoke/retention/recovery และ Product ต้องแสดง mapping/copy เมื่อสิทธิ์หมด/ถูกเพิกถอน/บริการ unavailable พร้อม QA ตรวจจริง; ห้ามอนุมาน non-save จาก 403/expiry. การ defer frame ไม่ยกเลิก QA-UI05-01/02 |
| F01 `50:608`, F02 `40:112`, F03 `50:671`, F04 `50:736` | ภาพ F01/F03 ใช้ fixture และแยก zero; F04 แจ้งข้อมูลเก่าไม่ใช่ Live และรอ snapshot; question context ขาดตาม QA-UI05-02. Loading/error/partial ต้องเป็นคนละเหตุจาก zero ตาม `UI-05-STATE-PACK.md:65–67`; ไม่ได้เห็นทุก variant เป็น full frame |
| Ordering/isolation | `product-UI-05.md:35–37` และ `UI-05-STATE-PACK.md:62,76` ระบุ server snapshot/revision, ห้าม event เก่าทับใหม่ และแยก session/question; ภาพนิ่งพิสูจน์ ordering, grant หรือ cross-session isolation ไม่ได้ |
| F05 `50:823`, `50:890`, `50:953`, F06 `50:1018` | ภาพแยก confirm จบทั้ง workshop, pending, unknown และ ended; UI04 F02 ปิดเฉพาะคำถาม. `UI-05-STATE-PACK.md:68` ระบุ cancel ก่อน dispatch เท่านั้นและ unknown ตรวจ session เดิมก่อนสั่งใหม่; runtime no-false-undo ยัง NOT RUN |
| H01 `40:168`, H02 `50:1081`, H03 `50:1162` | ภาพ H01 แสดงตัวหาร/ข้อจำกัดและ label synthetic; H02 เป็น empty; H03 ระบุฐานแต่ละข้อไม่เท่ากัน/ฐานอุปสรรคไม่ทราบ จึงไม่สรุปรวม และไม่แสดง nickname/raw comment. Optional blank ไม่ใช่ partial/0 ตาม `UI-05-STATE-PACK.md:69–76`; API payload/log/authorization ยังไม่ทดสอบ |
| Components / a11y / mobile | `components.png`, `final-readback.json:791–951` แสดง button/field/notice 3 sets/19 variants รวม focus/invalid/pending/disabled; C03–C10 เป็น composite/spec ไม่ใช่ complete production library. ภาพเป็น visual judgement ไม่ใช่ contrast measurement อิสระหรือ screen-reader result; 390×844 specimen ไม่เท่ากับ 320px/zoom/keyboard-safe proof |
| Gate / fixture | `product-UI-05.md:3,31–33,43–48,56–57` แยก UI05 visual acceptance กับ C1 build approval; 30/18/คะแนน 3 เป็น design fixture ไม่ใช่ runtime. C1 ไม่ขยายเป็น HR/full UI โดยอัตโนมัติ |

## เปิด decisions และสิ่งที่ไม่ตรวจ

- ผู้ใช้เป็นเจ้าของการตัดสิน receipt TTL/grace/revoke, retention และ recovery; Product เสนอ UX/contract, Coordinator รวม decisions และ canonical QA retest. Denominator/กลุ่มเล็ก/HR privacy policy ต้องอนุมัติแยกตาม slice
- ภาพนิ่งและ producer bounds/contrast ไม่รับรอง internal clipping, blur/pixel contrast, responsive หรือ global styles ก่อน–หลัง; ไม่ได้เทียบสด Figma หรือรับรอง version ล่าสุดนอก archived evidence
- **NOT RUN ทั้งหมด:** application/API/DB/WS, atomicity/idempotency/race/reconnect/restart/receipt/security/privacy enforcement, role/session/Origin, 30-client load, keyboard/IME/screen reader, mobile Safari/Chrome, 320px/200% zoom, reduced transparency/motion และ usability. ไม่มี runtime/security/accessibility PASS
- ไม่แก้ Figma/evidence/shared docs/app/tests/config, ไม่ install, รัน app/containers/agy, commit/push/deploy หรือพึ่ง review ของ Product. เขียนเฉพาะรายงานนี้
