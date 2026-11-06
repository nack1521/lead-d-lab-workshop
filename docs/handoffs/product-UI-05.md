# Product handoff — UI-05 state pack

สถานะ: **PREPARED / NOT DISPATCHED**. เอกสารสำหรับลุงอ่านเมื่อได้รับ approval ของ slice; ไม่ใช่คำสั่งให้เริ่ม coding. UI-05 รอ visual acceptance, C1 ยังรอ explicit local-build approval.

## ลำดับอ่านและขอบเขต
1. อ่าน `AGENTS.md`, `docs/TEAM-WORKFLOW.md` และ `docs/ANTIGRAVITY-RESULT-PROTOCOL.md`.
2. ใช้ [UI-05 specification](../product/UI-05-STATE-PACK.md) สำหรับ component/outcome/lifecycle/microcopy และ node inventory. ใช้ [UI-04](../product/UI-04-SELECTIVE-GLASS.md) เป็น approved visual baseline เฉพาะ P01/P03/F02/H01; UI-02 ถูก reject และ UI-03 เป็น history.
3. เมื่อผู้ใช้อนุมัติ C1 ให้อ่าน [C1 handoff เดิม](ANTIGRAVITY-C1.md), [R03 targeted review](../implementation/C1-PREFLIGHT-R03-COORDINATOR-REVIEW.md) และ R03 result ใน index ก่อน build. ใช้ current `AGENTS.md` เรื่อง Unslop; อย่าใช้ stale Docker blocker เป็นผลสถานะเครื่องปัจจุบัน. Protected handoff มีงานเดิม ห้าม overwrite.
4. ทำเฉพาะ slice ที่อนุมัติ. C1 คือ technical tracer bullet React + Elysia/Bun + real PostgreSQL + authenticated native WS และ C1-01–C1-16; ไม่เพิ่ม HR/full polished UI, dependencies, Redis/BullMQ หรือ deployment เพราะมีภาพครบ.

## Design references
- Figma file `RUOnC9Q15LA7DCc6rzhZtN`, page `1:2`, UI-05 root `47:48`: https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN?node-id=47-48
- Approved root `40:43` คงเดิม. Node mapping และ properties อยู่ใน `docs/product/evidence/UI-05/final-readback.json`; ภาพจริง 9 panels พร้อม SHA-256 อยู่ใน `screenshots.json`.
- 3 local sets คือ button/field/notice, 19 variants. Composite textarea/rating/poll/context/chart/coverage/end-confirmation ยังเป็น screen/spec patterns ไม่ใช่ completed production library.
- คง Soft Monochrome + Selective Glass: content opaque, no floating control overlap, black primary, secondary actionable ต่างจาก disabled, danger เฉพาะยืนยันจบ; IBM Plex Sans Thai Regular/Medium. Native BACKGROUND_BLUR ใน Figma ไม่ใช่ browser-performance หรือ Apple Liquid Glass proof.

## Implementation seams เมื่อ slice นั้นได้รับอนุมัติ
ให้ state/model เป็น source of truth ไม่ infer การบันทึก/authorization จากสี, disabled style หรือ native `State` variant. แยก connection, submission outcome, question lifecycle, session lifecycle และ aggregate freshness.

| Seam | Expected outcome ที่ต้องพิสูจน์ภายหลัง | สถานะ |
|---|---|---|
| UI05-R01 Sending → saved | Success หลัง atomic DB commit ของ answer+comment และอ่าน own receipt ตรงกัน; pending ไม่แสดง saved ล่วงหน้า | NOT RUN |
| UI05-R02 Duplicate / retry | unchanged key+payload ซ้ำไม่เพิ่ม accepted count; การกดซ้ำและ reconnect ไม่สร้าง submission ใหม่ | NOT RUN |
| UI05-R03 Terminal non-save / edit | server ยืนยัน old request ไม่ commit ภายหลัง + still open จึงเสนอ edit/new key ได้; transient missing/404 ไม่ปลด lock | NOT RUN |
| UI05-R04 Unknown / race | timeout, disconnect และ close ระหว่างส่งยัง reconcile ผลชุดเดิม; saved/not-saved/unknown ไม่ถูกสลับจาก timer | NOT RUN |
| UI05-R05 Closed / receipt auth | ปิด writes แต่ own receipt อ่านได้ตาม scope/grace/hard TTL/revoke; expired/unavailable คง unknown ไม่เปิด submit ใหม่ | NOT RUN |
| UI05-R06 Zero / stale / partial | loading/error ไม่กลายเป็น zero; stale ไม่ Live และ mutation controls รอ reconcile; missing denominator ไม่กลายเป็นเปอร์เซ็นต์หรือค่าเฉลี่ยรวม | NOT RUN |
| UI05-R07 End-session | confirmation ยกเลิกก่อน dispatch ได้; pending/unknown ไม่สัญญา undo server action; ended หลัง authoritative confirmation | NOT RUN |
| UI05-R08 Privacy / isolation | F/HR API ไม่ส่ง raw nickname/comment; participant ไม่เห็น aggregate/HR และอ่าน receipt คนอื่นไม่ได้ | NOT RUN |
| UI05-R09 Thai / input / mobile | server grapheme40/500, whitespace policy, IME, multiline Enter, radios/focus/status; 320px/200% zoom/safe-area/keyboard/long draft scroll ไม่โดน dock ทับ | NOT RUN |
| UI05-R10 Runtime / load | Mode A/B, PostgreSQL restart persistence, authenticated real-time snapshot/reconcile และประมาณ30 overlapping clients ตาม slice plan พร้อม actual measurements | NOT RUN |

ตารางนี้เป็น test seams ไม่ใช่ test code, ไม่แทน C1 acceptance IDs เดิม และไม่บังคับให้ทุก UI05-R case อยู่ใน C1. ให้เลือกตาม vertical slice และเก็บ deferred cases อย่างชัดเจน.

### Clarifications หลัง read-only advisory R01
- UI05-R02: same key/different payload ต้องเป็น conflict ไม่เขียนทับคำตอบเดิม. Accepted replay หลัง close คืน accepted outcome เดิมเมื่อยังมีสิทธิ์ ไม่ถือเป็น new write และไม่ bypass hard TTL/revocation.
- UI05-R06: ใช้ authoritative snapshot/revision หรือ ordering contract ที่พิสูจน์ได้; event เก่าของ session/question เดิมห้ามย้อนทับ snapshot ใหม่. UI timer/connection-open อย่างเดียวไม่ทำให้ fresh.
- UI05-R09: preserve draft ใน active tab ตาม contract เท่านั้น; ยังไม่รับรอง refresh/ปิดแท็บ และไม่เพิ่ม localStorage หรือ persistent draft storage โดยปริยาย.
- Expiry decisions: ผู้ใช้เป็นเจ้าของ approval ของ proposed grant TTL, receipt read grace, retention/revoke และช่องทางช่วยกู้สถานะที่อนุญาต; R03 เป็นข้อเสนอเดิม ไม่ใช่ค่าที่ UI05 ตัดสินใหม่. Retention/ช่องทางกู้สถานะที่ยังไม่ตกลงต้องระบุ OPEN ก่อน implementation ของส่วนนั้น. Antigravity เสนอทางเลือก, canonical QA ตรวจ policy หลังได้รับ approval; ห้ามเสนอ HR bypass หรือสัญญาว่าอ่าน receipt ได้ตลอด.

[Advisory R01 disposition](../product/evidence/UI-05/advisory-R01.md) เป็นการตรวจความครบถ้วนของเอกสารโดย Coordinator ไม่ใช่ผล runtime หรือ sign-off ของ Senior Tester.

R03 technical choices/security policies ยังเป็น proposed choices ที่รอ human build approval. UI-05 ไม่เปลี่ยน TTL, receipt grace, body/frame limits, origin rules, revocation semantics หรือ dependency pins ด้วยตนเอง. ตอน build ต้องตรวจ versions/security/ports/Docker ตามจริงอีกครั้ง หากมี blocker ให้เสนอเปลี่ยนพร้อมเหตุผล ไม่เปลี่ยน stack เงียบ ๆ.

## สิ่งที่ภาพไม่ได้พิสูจน์
Readback/PNG/contrast/geometry ไม่พิสูจน์ real-time, persistence, API outcomes, mobile Safari, keyboard/screen reader, usable timers หรือ reduced-transparency behavior. ข้อมูล30คน/18คำตอบ/คะแนน3ในภาพเป็น fixture; production ใช้ actual server data และ authoritative lifecycle. Draft text ไม่กลายเป็น accepted recordเพราะแสดงใน UI.

Receipt-expiry ไม่มี dedicated full-frame drawing: ใช้ unknown notice + safe unavailable reason ตาม specification โดยไม่ชี้ว่าไม่บันทึก. ต้องทดสอบ UX mapping ของ403/expiry/revoke โดยไม่เปิดเผย session อื่นก่อน release.

## เมื่อได้รับ approval และทำเสร็จ
- ผู้เขียน application/test/migration/config คือ Antigravity เท่านั้น. ใช้ model `gemini-3.8-flash-high` หากผ่าน agy และช่องทางที่ผู้ใช้เลือก. Existing-conversation CLI binding เคย blocked; ห้ามเปลี่ยน conversation/fallback เงียบ ๆ.
- เก็บ task/run result.md + result.json ตาม protocol, actual commands/exit codes, changed paths, RED/GREEN และข้อจำกัด; อัปเดต results index เป็นขั้นตอนสุดท้าย. No invented PASS.
- `skill_usage` แยก read-loaded/applied/runtime evidence. Handoff นี้ไม่ยืนยัน IDE activation.
- Coordinator อ่านผล, canonical Senior Tester ตรวจอิสระ, ผู้ใช้รับงาน. ไม่มี push/deploy/public tunnel/publish/paid resource โดย approval นี้.

## Current gate
ให้ผู้ใช้ดู UI-05 และตัดสินใจ visual acceptance ก่อน; explicit C1 build approval เป็นอีก decision หนึ่ง. ตอนส่งเอกสารนี้ยังไม่ dispatch, install, build หรือเผยแพร่.
