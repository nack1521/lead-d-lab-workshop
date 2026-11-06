# UI-05 — QA targeted retest R02

ผู้ตรวจ: canonical Senior Tester `lead-d-qa` | เวลาบันทึกจากเครื่อง 2026-11-06 18:03:21 +0700  
Revised evidence baseline ตาม dispatch: `b32c9287494d32cf6231bd3fe84677cbce4e82d6` — ไม่ใช้ Git ตรวจ commit ซ้ำ  
Verdict: **READY_FOR_HUMAN_STATE_REVIEW** เฉพาะ targeted static/visual design review ไม่ใช่ human acceptance, task closure หรือ approval ให้ build. Open Critical/Major ของ QA-UI05-01/02: **ไม่มีในขอบเขต static retest นี้**

## ผล retest findings เดิม

| Finding | สถานะ | หลักฐานที่ตรวจและข้อจำกัด |
|---|---|---|
| QA-UI05-01 — terminal non-save / stable replay | **RESOLVED_STATIC** | ภาพจริง `participant-corrections.png` P07 `66:158` แสดงยืนยันคำตอบเดิมไม่บันทึกและคำถามยังเปิด พร้อม action “เริ่มส่งคำตอบใหม่”, ทางแก้ก่อนส่ง และใช้คำตอบเดิมได้. `UI-05-R02-TARGETED-FIXES.md:25–37` แยก replay key+payload เดิมคืน stable outcome กับ fresh key จาก explicit action หลัง terminal non-save, old request ไม่มีทาง late commit, คำถามเปิดและ grant valid แม้ payload ไม่เปลี่ยน; server recheck lifecycle/auth/unique แบบ atomic. `approval-R01.json:5–10` บันทึก policy ที่ผู้ใช้เลือก; `product-UI-05.md:5,22–28` ชี้ amendment แทน edited-only ของ handoff เดิมเฉพาะจุด. Unknown/transient absence ไม่อนุญาต fresh attempt; mismatch เป็น conflict. ภาพไม่พิสูจน์ atomic enforcement จริง |
| QA-UI05-02 — F03/F04 question context | **RESOLVED_STATIC** | ภาพจริง `lobby-question-zero.png` F03 `66:258` แสดงคำถาม 01, ข้อความคำถาม/scale และปุ่มปิดคำถามนี้; `stale-transition.png` F04 `66:285` ผูกผลเก่ากับคำถาม 01, ระบุคำถามปัจจุบันยังไม่ยืนยันและ “ข้อมูลเก่า · ไม่ใช่ Live”, action เป็นรอข้อมูล. อ่านข้อความตรงกับ `final-readback.json:509–561,565–665`; amendment `:44–48` ระบุ disable mutations จน reconcile. ภาพนิ่งไม่พิสูจน์ disable behavior หรือ ordering runtime |

## Regression เฉพาะส่วนที่เกี่ยวข้อง

- **Unknown/closed:** เปิดภาพเดิม `UI-05/participant-2.png` และ `participant-closed.png` อีกครั้ง: P08 `50:368` ให้ตรวจผลเดิม; P09 `50:414`, `50:514`, `50:560` แยก closed + saved / non-save / unknown. R02 amendment `:29–35,73–78` ห้าม fresh key จาก unknown/absence และห้าม fresh writes เมื่อปิด. เป็นการตรวจ spec + archived image ไม่ใช่การรัน flow
- **Auth/receipt:** amendment `:30–35` และ `product-UI-05.md:25–28,37–41,50` ระบุ valid grant, replay ภายในสิทธิ์, accepted read-only/unique, expiry/revoke/unavailable คง unknown ไม่ bypass หรือเสนอส่งใหม่. Dedicated expiry frame ยัง deferred สำหรับ human review; TTL/grace/revoke/retention/recovery และ UX/error mapping ต้องได้รับอนุมัติและพิสูจน์ก่อน implement/release ของ receipt slice
- **Typed payload:** ภาพ `participant-corrections.png` และ `final-readback.json:293–438` แสดง P04 `66:179` poll question 02 ตัวเลือก/ข้อความเดียวกับ P05 `66:198` และ P06 `66:213`; notice ใช้ “คำตอบและข้อความ” ไม่สับสนกับคะแนน. Amendment `:68–80` อธิบาย typed snapshot/key สำหรับ P07–P09; outcome อื่นไม่ได้วาด poll variant แยกทุกหน้า
- **Close/end และ baseline:** เปิด UI04 `P01.png`, `F02.png` เทียบ question identity และ close-question; เปิด R01 `facilitator-end-pending-unknown.png` และ `hr-partial.png` สำหรับ end-session และ privacy/denominator. ภาพ R02 `stale-transition.png` มี annotation `66:333`; ตาราง amendment `:50–66` แยก close confirmed/failure/unknown, next/end, F05 pending/unknown และ F06. ไม่ใช่ prototype หรือ runtime regression

## Evidence / inventory

- อ่าน brief `docs/handoffs/UI-05-TARGETED-RETEST-R02.md`, amendment, `approval-R01.json`, `final-readback.json`, `creation-readback.json`, `verification.json`, `state-ledger.json`, `screenshots.json`, current `docs/handoffs/product-UI-05.md` และ QA review R01 ของตน
- โหลดภาพ R02 จริงครบ 3 ผ่าน `vision_analyze`: `participant-corrections.png`, `lobby-question-zero.png`, `stale-transition.png`; crop P07 และ F04 เพื่ออ่านรายละเอียด. ภาพ baseline/R01 ข้างต้นโหลดจริงเช่นกัน ไม่พึ่งรายงาน Product อีกฝ่าย
- `jq` นับจาก final record: `allNodeIds` 212 / unique 212, views 7 (P07/P04/P05/P06/F01/F03/F04), instanceAssets 14, contrast pairs 11, panels 3 และ annotation ID `66:333`. Creation record มี 204 IDs / unique 204 ตามที่คืน; exact cause ที่ต่างจาก final ยัง **unverified** ไม่แก้ประวัติหรือเดาสาเหตุ. 14 เป็นจำนวนรายการ instanceAssets และ 11 เป็นจำนวนรายการคู่สี ไม่ใช่การคำนวณ contrast อิสระ
- `shasum -a 256` ของภาพ R02 ทั้ง 3 ตรง manifest `screenshots.json`; ยืนยันความตรงของไฟล์กับ manifest เท่านั้น ไม่พิสูจน์ provenance ของ manifest หรือ live canvas. Readback/verification รายงาน bounded overflow/collapsed ว่างและ fingerprint เดิมตรง แต่ไม่ได้คำนวณ geometry, pixel contrast หรือ full global-style audit ซ้ำ
- Skill `design-evidence-qa` read-loaded และ applied สำหรับ targeted state/evidence review; ไม่มี runtime verification ของ skill หรือแอป

## Gates และข้อจำกัด

เป็น **archived-asset review**: ไม่ได้อ่าน Figma live root `66:153` หรือยืนยัน current canvas; bounds ไม่พิสูจน์ internal clipping, 320px/reflow หรือ contrast ทุก pixel. ไม่อ้าง visual approval ของผู้ใช้; C1 coding ยัง HOLD จนแยก human build approval. ผู้ใช้และ Coordinator เป็นผู้ตัดสิน/ปิดงาน

**NOT RUN:** app/API/DB/WS, idempotency/late-commit/atomicity, authorization/security/privacy enforcement, close/reconnect/restart/concurrency, mobile/keyboard/IME/screen reader/contrast accessibility และ load. ไม่มี runtime/security/a11y PASS. R01 เก็บเป็นประวัติ ไม่แก้ย้อนหลัง; ไม่แก้ Figma/evidence/shared docs/app/test/config ไม่ install/run app/containers/agy หรือใช้ Git/push/deploy
