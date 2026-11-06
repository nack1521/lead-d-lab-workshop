# UI-05 independent Product/QA review — R01

## User decision / gate
2026-11-06 ผู้ใช้เลือก “ให้ Product/QA ตรวจ UI-05 ก่อน ยังไม่เริ่ม coding” หลังขอทำขั้นตอนถัดไป. อนุมัติการตรวจ design/spec เท่านั้น ไม่ใช่ UI05 visual acceptance หรือ C1 build approval. Coding/install/containers/app runtime/push/deploy ยังคง hold.

สถานะ brief: REQUESTED_BY_USER; ผล review ยังไม่รับกลับ. Coordinator ส่งงานให้ canonical lead-d-product และ lead-d-qa แยกกัน; การ dispatch acknowledgement ไม่เท่ากับตรวจเสร็จ.

## Baseline / source of truth
Workspace `/Users/aiink/Nack/Lead+D-Lab` เท่านั้น; cache ของบอตตามสิทธิ์เดิม. Evidence baseline commit `1724ecc6de84a38163751aab041a26e2053b9283`; commit ถัดมาของ brief นี้ไม่เปลี่ยน UI05 evidence.

อ่าน `AGENTS.md`, `docs/TEAM-WORKFLOW.md`, `docs/product/UI-05-STATE-PACK.md`, `docs/handoffs/product-UI-05.md`, `docs/product/evidence/UI-05/advisory-R01.md` และ WF-01-R1/UI-01 state contract เมื่อ branch นั้นต้องอ้าง. Advisory ก่อนหน้าไม่ได้ตรวจ UI05 artifact และไม่แทน independent review รอบนี้.

หลักฐานที่ต้องตรวจเอง ไม่ใช้ producer claims เป็น PASS:
- UI05 `docs/product/evidence/UI-05/final-readback.json`, `verification.json`, `screenshots.json`, `state-ledger.json`.
- เปิดดูภาพจริงทั้ง9 PNG panels ในโฟลเดอร์เดียวกัน ครอบคลุม native19stateviews; เทียบกับ approved UI04 PNGs P01/P03/F02/H01 ที่ `docs/product/evidence/UI-04/`.
- Figma read-only optional: file `RUOnC9Q15LA7DCc6rzhZtN`, page `1:2`, UI05 root `47:48`, approved UI04 root `40:43`. หากไม่ได้อ่าน live ให้ระบุว่าเป็น archived-asset review ไม่อ้างยืนยัน canvas ปัจจุบัน.
- นับ/dedupe/คำนวณด้วยเครื่องมือ: authored19views/15codes + approved4refs =23visualreferences/19canonicalcodes P10/F6/H3; native3sets/19variants ไม่ใช่ production libraryครบทุกfamily. ตรวจ independently ไม่คัดเลขมารับรองเฉย ๆ.

## Ownership / allowed writes
| Reviewer | Output file เท่านั้น | Focus |
|---|---|---|
| canonical `lead-d-product` | `docs/product/UI-05-PRODUCT-REVIEW-R01.md` | UX/flow/microcopy/visual consistency/component traceability |
| canonical `lead-d-qa` | `docs/qa/UI-05-QA-REVIEW-R01.md` | design risk/reliability/privacy/accessibility seams/delivery gates |

อ่านไฟล์ได้ตาม task; เขียนเฉพาะ report ของตนเมื่อ path ยังไม่มี ถ้ามี report เดิมให้อ่านก่อนและแจ้ง Coordinator แทน overwrite. ห้ามแก้ Figma, shared docs, evidence, app/test/migration/config, อีกฝ่ายหรือ report เก่า. ไม่ commit/push/install/รันแอป/containers/agy หรือส่งต่อบอตอื่น. Coordinator รวมผลและเก็บ commit หลังอ่านกลับ. ผู้ใช้เป็นผู้รับงาน; reviewer ไม่ปิด task หรืออนุมัติ build.

## Review checklist
1. เปิดภาพจริงและบอกภาพ/node/ข้อความที่ใช้รองรับ finding; ความสวย/อ่านง่ายเป็น judgement แยกจาก contrast/layout metrics. คง Soft Monochrome + Selective Glass, content opaque, reserved action area; baseline4หน้าที่อนุมัติแล้วไม่ขอออกแบบทิศใหม่.
2. P05–P09: immutable answer+comment, sendingไม่ใช่saved, unknownไม่ใช่non-save, terminal non-saveก่อนedit/newkey, same-key/different-payload conflict, accepted replayหลังcloseภายในauth.
3. P09แยกclosed+saved/non-save/unknown; expiry/revoke/unavailableคงunknown ไม่มีHR bypass. Dedicatedexpiryfullframeยังไม่วาด: ตัดสินว่าเป็น blockerของdesignhandoffหรือdeferred ก่อนimplementation/releaseพร้อมเหตุผล.
4. F03confirmedzero vs F04stale/loading/error/partial; noLiveก่อนfreshsnapshot, nozeroจากmissing, eventorderingและquestion/sessionisolation.
5. F05end-session confirmation/pending/unknownแยกclose-question; nofalseundo; F06หลังauthoritativeended.
6. HRcoverage/denominator/partial, optionalblankไม่เป็นmissing/0, privacyไม่มีrawnickname/comment. Synthetic30/18/คะแนน3ไม่ใช่runtimeDBและไม่hardcodeproduction.
7. Fieldlabel/invalid/focus/pending/disabled, radio/comment multiline, Thai40/500/IME,320px/zoom/keyboard/reducedtransparency เป็นtestseams ไม่อนุมานPASSจากภาพ390px.
8. ระบุcomponentsetเทียบcomposites, unresolvedpolicy/owner, requirement→screen/variant→trigger/authority/action/next-state traceability ที่จำเป็นสำหรับslice. C1ไม่ขยายเป็นHR/fullUI.

## Required report / completion
ตอบภาษาไทย: baselineที่อ่าน, actual tools/ภาพที่เปิด, coverageรายการที่ตรวจเอง, findingsมีID/severity/evidence/impact/suggestedfix, open decisionsและdeferred/runtimeNOTRUN, verdict `READY_FOR_HUMAN_STATE_REVIEW` / `CHANGES_REQUESTED` / `BLOCKED` พร้อมขอบเขต. รายงานไม่มีfindingต้องบอกcoverage/limitations ไม่เขียนPASSลอย ๆ.

แยก STATIC_CHECKED, VISUAL_JUDGEMENT, NOT_RUN และ producer evidence. หากเครื่องมือ/ภาพอ่านไม่ได้ให้บอกBLOCKEDเฉพาะส่วน ห้ามแต่งผล. ไม่มีruntime/accessibility/securityPASSจากdesignreview.

ส่งกลับ Coordinator พร้อม absolute output path, evidence baseline, verdict, critical/major finding IDs และข้อจำกัด. Reportที่มีจริงและCoordinatorอ่านกลับแล้วเท่านั้นจึงนับว่าส่งมอบ; dispatch/ข้อความself-reportไม่พอ.

## AI progress
ผู้ใช้ตัดสินใจ review-before-build; Coordinator เตรียม canonical independent review brief ไม่ได้ dispatch coding. Shared `docs/AI-PROGRESS.md` และ `docs/handoffs/ANTIGRAVITY-C1.md` มี dirty งานเดิม จึงเก็บprogressในbriefนี้และรักษาไฟล์เดิม. ใช้ lead-d-workshop-cycle สำหรับroles/gates/ownership/evidence. การตรวจของสองบอตยังต้องรับกลับและตรวจรายงานก่อนสรุปผล.
