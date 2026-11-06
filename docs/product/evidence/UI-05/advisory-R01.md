# UI-05 — Advisory R01 disposition

บันทึก 2026-11-06 หลัง local draft commit `fe0aeb386566be14333c912430316384346e94f3`.

## Provenance / ขอบเขต
ได้รับ completed advisory จาก `deleg_71f8ae1c`, task 1/1: read-only risk review เอกสาร UI-01 component contract, WF-01-R1, UI-04 และ protected C1 handoff. ผู้ตรวจเป็น subagent ไม่ใช่ canonical `lead-d-qa`; ไม่ได้ตรวจ UI05 artifact, รันแอป หรือให้ QA sign-off. ข้อเสี่ยงไม่ใช่บั๊กที่พิสูจน์จาก runtime.

Coordinator อ่าน UI05 handoff ปัจจุบันและตรวจข้อเสนอเทียบ specification ที่ส่งแล้ว. ผลด้านล่างหมายถึงความครบถ้วนระดับเอกสารเท่านั้น; ทุก implementation seam ยังคง NOT RUN และ user state acceptance ยังคง PENDING.

| ข้อ | ข้อเสี่ยงจาก advisory | Disposition ใน UI05 |
|---|---|---|
| 1 | unknown ถูกยุบเป็น non-save | COVERED_SPEC: P08/closed-unknown แยก outcome, คง key/payload, ไม่สร้างคำขอใหม่จาก timeout/missing |
| 2 | edit/new key ก่อน old request terminal | COVERED_SPEC + CLARIFIED: terminal non-save + no later commit + still open; unchanged retry ใช้ key/payload เดิม; เพิ่ม explicit same-key/different-payload conflict ใน handoff |
| 3 | closed กลบผลเดิม | COVERED_SPEC + CLARIFIED: P09 แยก3outcomes; เติม accepted replay หลัง close คืนผลเดิมเมื่อ auth ยัง valid ไม่ใช่ new write |
| 4 | stale/loading/error กลายเป็น0/Live | COVERED_SPEC + CLARIFIED: confirmed zero แยกจาก stale; เพิ่ม authoritative ordering และ event เก่าไม่ย้อนทับ snapshot ใหม่ |
| 5 | expiry แปลว่า non-save/receipt อ่านได้ตลอด | COVERED_SPEC / OPEN_DECISION: unknown unavailable ไม่เสนอส่งใหม่; ไม่มี dedicated expiry frame. เติม policy owner=ผู้ใช้, อ้าง R03 proposed choices; retention/recovery ที่ยังไม่ตกลงต้องเปิด decision ก่อน implement ไม่เดา TTL |
| 6 | close-question ปน end-session | COVERED_SPEC: F05 confirmation/pending/unknown แยกจาก close-question; F06 ต้องยืนยัน ended, pending ไม่สัญญา undo |
| 7 | answer/comment ไม่ atomic หรือ optional blank เป็น partial | COVERED_SPEC + CLARIFIED: saved หลัง atomic commit, optional blank ไม่ลด coverage; ไม่เผย raw fields F/HR. เติมว่าไม่สัญญา draft ข้าม refresh/ปิดแท็บหรือเพิ่ม persistent storage โดยปริยาย |
| 8 | state pack เท่ากับ build approval | COVERED_SPEC: 19 canonical codes พร้อม native inventory, UI04 approved 4 views แยกจาก proposed states; UI05 acceptance/C1 build approval แยกกัน; mobile/accessibility/runtime ไม่อ้าง PASS |

## Artifacts / completion
- เพิ่ม clarification ใน [product handoff](../../../handoffs/product-UI-05.md) โดยไม่แก้ protected C1 handoff หรือ shared AI-PROGRESS.
- เพิ่ม pointer ใน [UI05 specification](../../UI-05-STATE-PACK.md).
- ไม่มี Figma, app code, tests, schema, runtime, install, dispatch, push หรือ deploy changes. ไม่แก้ย้อนหลัง `final-readback.json`, `verification.json` หรือ screenshot evidence ให้ดูเหมือนเป็น QA result ใหม่.
- Current gate คงเดิม: human visual review; explicit technical/local-build approval ก่อน Antigravity coding; independent canonical QA หลังมี build.
