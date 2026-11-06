# UI-05 — Component/state pack และ handoff

สถานะ: **READY_FOR_HUMAN_REVIEW** — เป็น design draft ที่สร้างและตรวจกลับแล้ว ไม่ใช่ user acceptance, independent QA sign-off หรือ runtime PASS

## ขอบเขตและแหล่งความจริง
ผู้ใช้สั่ง “จัดมาได้เลย” ให้ขยาย components/states หลังอนุมัติ UI-04 ทั้ง 4 หน้า. รอบนี้ทำ native Figma + specification/handoff เท่านั้น; C1 coding, install, push และ deploy ยัง hold.
- Visual baseline: [UI-04](UI-04-SELECTIVE-GLASS.md), approval commit `26718bffce807b5ce80395360840c5b790713545`. คง Soft Monochrome + Selective Glass, IBM Plex Sans Thai Regular/Medium, opaque content, glass เฉพาะ action controls พร้อมพื้นที่สำรอง.
- Flow/state authority: [UI-01 component contract](UI-01-COMPONENT-STATES.md) + [WF-01-R1](WF-01-R1-DELIVERY.md). Native variant เป็น presentation ไม่ใช่หลักฐาน server outcome หรือ source ของ authorization.
- [เปิด UI-05 ใน Figma](https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=47-48), page `1:2`, root `47:48`; ไม่ทับ approved root `40:43` หรืองานเก่า. ไม่ publish library หรือแก้ global styles/variables.

## สิ่งที่ส่งมอบ
สร้าง 19 state views สำหรับ 15 codes ที่ยังขาด และอ้าง 4 หน้าเดิม P01/P03/F02/H01. รวม 23 visual references แต่ยังเป็น **19 unique canonical codes: P10/F6/H3** เพราะ P09/F05 แตกสถานะ. จำนวน views ไม่ใช่จำนวน routes/สิทธิ์ผู้ใช้.

| Code | State view ใหม่ | Native node |
|---|---|---|
| P02 | waiting | `50:137` |
| P04 | poll | `50:179` |
| P05 | sending | `50:226` |
| P06 | saved | `50:272` |
| P07 | not-saved | `50:320` |
| P08 | unknown | `50:368` |
| P09 | saved | `50:414` |
| P10 | error | `50:460` |
| P09 | not-saved | `50:514` |
| P09 | unknown | `50:560` |
| F01 | lobby | `50:608` |
| F03 | zero | `50:671` |
| F04 | stale | `50:736` |
| F05 | confirmation | `50:823` |
| F05 | pending | `50:890` |
| F05 | unknown | `50:953` |
| F06 | ended | `50:1018` |
| H02 | empty | `50:1081` |
| H03 | partial | `50:1162` |

| อ้าง UI-04 ที่อนุมัติแล้ว | Node |
|---|---|
| P01 join | `40:52` |
| P03 rating/comment | `40:75` |
| F02 live result | `40:112` |
| H01 summary | `40:168` |

## Local component kit
| Contract | Native set / states | Properties |
|---|---|---|
| UI-C01 Button | `48:48`: ready, secondary, disabled, pending, danger, focus | `Label#48:0`, `State` |
| UI-C02 Field | `48:49`: empty, focus, invalid, disabled | `Value#48:7`, `Helper#48:12`, `State` |
| UI-C06 Notice | `48:50`: waiting, sending, saved, not-saved, unknown, closed, stale, loading, error | `Title#48:17`, `Body#48:27`, `State` |

3 native sets / 19 variants; visible instance catalog `50:48`, editable masters ใน hidden source `47:51`. Secondary ใช้ข้อความเข้มให้ต่างจาก disabled ที่มีขอบและข้อความสีจางกว่า; focus มี outline. Notice มีหัวข้อ/รายละเอียด ไม่ใช้สีตัดสินผลเพียงอย่างเดียว. `waiting` ใช้เป็น neutral visual treatment ในบาง composite; lifecycle/coverage จริงอ่านตาม screen contract ไม่ infer จากชื่อ visual variant.

UI-C03 textarea, C04 rating, C05 poll, C07 context, C08 aggregate, C09 coverage และ C10 end-session เป็น **composite/spec references** ในหน้าจอ ไม่ได้อ้างว่าทุก family สร้างเป็น production component set แล้ว. Field set ไม่ใช่ multiline textarea. Filled ใช้ text override ของ field state ที่เหมาะสม. ไม่มี token binding, full interaction library, clickable prototype, responsive variants หรือ ARIA implementation.

## State / interaction contract สำหรับ implement ภายหลัง
### Submission + connection + lifecycle เป็นคนละแกน
- `sending`: คง immutable answer+comment payload และ idempotency key; pending controls กัน repeated action แต่ยังไม่แสดง saved.
- `saved`: แสดงเมื่อ server ยืนยัน atomic persistence ของ answer+comment; own accepted read-only. P06 กลับ waiting ได้ ไม่แก้ accepted answer และไม่เผย aggregate ให้ participant.
- `terminal confirmed non-save`: ใช้ P07 เฉพาะหลักฐานที่คำขอเดิมไม่มีโอกาส commit ภายหลัง. ส่งชุดเดิมซ้ำใช้ **same key + same payload**. หากแก้ไข ใช้ new submission/key เฉพาะ terminal non-save + authoritative question still open. Read-missing/404/transient error ไม่เป็นหลักฐานนี้.
- `unknown`: P08 คง payload/key, read/reconcile ผลเดิม. ไม่สร้าง key ใหม่ ไม่แก้ payload ไม่ auto-resend หลัง reconnect หรือเพียงเพราะ timeout.
- `closed`: P09 แยก saved/non-save/unknown. ปิดรับ writes ไม่ได้แปลว่า revoke own receipt ทันที. ไม่ auto-send ร่างเมื่อเปิด connection ใหม่.
- `receipt unavailable/expired/revoked`: แจ้ง “ยังตรวจยืนยันคำตอบเดิมไม่ได้” พร้อมเหตุผลที่เปิดเผยได้; คง unknown ไม่ promote เป็น non-save และไม่เสนอ submit ใหม่. ไม่มี dedicated full-frame expiry specimen ในรอบนี้; ใช้ notice และต้องพิสูจน์ actual status/error mapping ก่อน release.
- Reconnect ต้อง reconcile session/question ID, lifecycle, own submission และ fresh aggregate ตามลำดับที่ไม่เอาข้อมูลคนละข้อมาแทนกัน. คำตอบเดิมอาจเป็น saved แม้ connection ขาด; server authority มีลำดับเหนือ UI timer.

### Facilitator / aggregate / report
- F01 joined count ไม่ใช่ accepted count. F02 แสดงผลสดได้หลัง fresh authoritative snapshot/event; ทุกตัวเลขใน draft นี้เป็น fixture ไม่ใช่ DB evidence.
- F03/H02 zero/empty ต้องได้ successful authoritative read จริง. Loading/error/missing/not-ended/unauthorized เป็นคนละเหตุ ไม่แสดงเป็น 0/empty.
- F04 เก็บกราฟเก่าพร้อมป้ายข้อมูลเก่า ไม่ติด Live; disable mutation controls จน reconcile ได้. แสดง updated-at จริงเมื่อมีข้อมูล ห้ามสร้างเวลาเอง.
- F05 confirmation เป็นการ **จบทั้ง session** ไม่ใช่ close-question. ก่อนส่งคำสั่งกลับห้องได้; pending ไม่มีคำมั่นว่า cancel ย้อน server action ได้; unknown อ่านสถานะ session เดิมก่อนส่งคำสั่งใหม่. F06 ended ต้องรอ confirmation จริง.
- H03 ระบุฐานรายข้อ; unknown denominator งดเปอร์เซ็นต์/ค่าเฉลี่ยรวมที่ฐานไม่ครบ. Blank optional comment ไม่ทำให้เป็น partial. Subgroup analysis รอ privacy policy; ยังไม่แสดง raw nickname/comment.

### Draft / privacy / accessibility
- Nickname optional 40 graphemes ไม่ใช่ identity; comment optional 500 graphemes ไม่ใช่คะแนนหรือสิ่งจำเป็นสำหรับ coverage. Trim/blank policy ใช้ WF-01-R1; validate ที่ server, ไม่ truncate Thai/emoji เงียบ ๆ. Draft ไม่ถือเป็น accepted record.
- P04 single choice, ไม่มี default selection ใน runtime. ภาพ selected เป็น fixture เพื่อสื่อ selected state. Comment multiline Enter ไม่ submit; pending/unknown preserve draft, text input ไม่เก็บใหม่เป็นคนละ submission.
- Native radio/radiogroup, persistent labels, helper/error associations, visible keyboard focus, live status announcements แบบไม่รบกวน และ focus retention เป็น acceptance seams ไม่ใช่ผลจากภาพ.
- Mobile 390×844 เป็น specimen; runtime ต้อง reflow ที่ 320px/200% zoom, safe-area/keyboard และ long Thai text. Action dock ต้อง reserve content space; reduced transparency ใช้ opaque fallback, reduced motion ไม่ใช้ animation เป็นหลักฐาน saved.
- F/HR endpoints ต้องไม่ส่ง raw nickname/comment มาแล้วค่อยซ่อนด้วย CSS; role/session isolation และ own receipt auth ต้องทดสอบจริง. ตัวเลข 30/18/คะแนน 3 ในภาพเป็น synthetic design fixtures ไม่ hardcode production.

## Verification ที่ทำจริง
[final-readback.json](evidence/UI-05/final-readback.json), [verification.json](evidence/UI-05/verification.json), [screenshots.json](evidence/UI-05/screenshots.json)
- Readback 573 nodes: 3 component sets, 19 components, 60 instances; 19 authored views และ dedup canonical codes ตามตาราง. ไม่มี IMAGE-filled UI.
- ตรวจ 255 visible text nodes: ไม่มี text height collapsed และไม่มี visible child bounds overflow. ทุก phone specimen content จบก่อน reserved action area y=696.
- 13 solid-fill text contrast pairs ผ่าน 4.5:1 จาก ancestor composition; ไม่ใช่ pixel-level blur contrast/full WCAG. Disabled readability ตรวจรวมแล้ว.
- Approved UI-04 197 nodes fingerprint `7ba8c687` ตรงก่อน/หลัง โดยรวม id/parent/name/type/geometry/text/font/fills/effects; เป็น bounded noncryptographic check ไม่ใช่ full file-global audit.
- เก็บ PNG จริงจาก Figma 9 panels พร้อม SHA-256; ดูภาพจริงทั้ง participant/desktop/components. แก้ secondary/disabled differentiation, poll privacy/limit และ human-language microcopy แล้ว capture รอบ final. ไม่ reconstruct ภาพหรือจำลอง API success.

## Not done / acceptance gates
**NOT RUN:** app/database/WS/receipt/retry/race/security/30-client load, keyboard/IME/screen reader/mobile browser, reduced-motion/transparency behavior, real reflow/zoom และ human usability. Independent canonical Product/QA sign-off ยังไม่ทำ. New state visual acceptance **PENDING**; UI-04 approval เดิมไม่ถูกขยายเอง.

ลำดับถัดไป: ผู้ใช้ review UI-05 → ตัดสินใจแยกเรื่อง C1 technical choices/local build approval → ลุง implement เฉพาะ slice ที่อนุมัติ → independent QA. [Handoff](../handoffs/product-UI-05.md) เป็น addon ไม่ใช่ dispatch/build permission.

## AI progress / ownership
Request: “จัดมาได้เลย”. Coordinator ใช้ native Figma authoring + อ่านกลับ/ตรวจภาพ + เขียน state contracts/handoff. ไม่เขียน application/test/migration/config code. Shared `docs/AI-PROGRESS.md` และ `docs/handoffs/ANTIGRAVITY-C1.md` มีงาน dirty เดิมและ SHA-256 คงเดิม จึงบันทึก progress รอบนี้ในเอกสารนี้แทนไม่ทับผู้อื่น. ไม่ push/deploy/install/เริ่ม agy หรือส่งข้อความแทนผู้ใช้.

Skills: lead-d-workshop-cycle ใช้ scope/gates/evidence/protected-files; writing-for-agents ใช้ reference pointer กับ completion criteria; Figma use/generate-design/generate-library + component-creation guidance ใช้สร้าง native editable draft และตรวจ properties. เป็น design tooling usage ไม่ใช่ Antigravity/runtime activation. Risk advisory ของ subagent เป็น read-only ความเห็นช่วยตรวจ ไม่ใช่ canonical QA sign-off.
