# WF-01 — Design review จาก artifacts

What this change does: Wireframe low-fidelity แสดง flow ผู้เข้าร่วมบนมือถือ ผู้ดำเนินกิจกรรม และสรุป HR บน desktop พร้อมสถานะตัวอย่างและคำอธิบายข้อมูล งานนี้ตรวจ artifact แบบอ่านอย่างเดียว ไม่ใช่การทดสอบแอปจริงหรือการอนุมัติ release

**ข้อสรุป:** ส่งให้ผู้ใช้ review ทิศทาง wireframe ได้ โดยแจ้งข้อจำกัดและข้อที่ต้องแก้ด้านล่าง; ยังไม่เสนอให้ถือว่า acceptance ครบหรือพร้อม implementation โดยไม่มีการปิดช่องว่างของ specification และหลักฐาน scope ผู้ใช้เป็นผู้ตัดสินใจ ไม่ปิด ticket เอง

ผู้ตรวจ: Senior Tester & Delivery (`lead-d-qa`) | เวลาบันทึกจากเครื่อง: 2026-11-04 17:30:07 +0700 | ขอบเขต: design artifact review เท่านั้น

## หลักฐานที่ตรวจจริง

1. อ่าน `docs/qa/WF-01-DESIGN-CHECKLIST.md`, `docs/handoffs/product-WF-01.md` และ `docs/product/evidence/WF-01/structure.json` ผ่าน read_file
2. โหลดภาพจริงด้วย `vision_analyze` ทั้ง `docs/product/evidence/WF-01/participant.png`, `facilitator.png` และ `hr-summary.png`; ซูมภาพจริงเพิ่มเติมที่ P07/P08, F04 และ H01 เพื่ออ่านรายละเอียด ข้อสังเกตต่อไปนี้อ้างจากภาพดังกล่าว ไม่ใช่คำบอกเล่า
3. `structure.json:344–367` ระบุ root `7:2`, parent `1:2`, total 330 nodes, screenCount 19; `:368–596` แสดงรายการ P01–P10, F01–F06 และ H01–H03 พร้อม ID และขนาด; `:598–603` แสดงรายการ overflow, overlaps, nonAutoFrames, nongray และ placeholders ว่าง เป็นผล audit ที่บันทึกไว้ ไม่ใช่การตรวจ Figma สดโดย QA และขอบเขต/วิธีคำนวณ audit ไม่ปรากฏครบในไฟล์นี้
4. ตามข้อมูลที่ผู้ใช้ส่งมา Coordinator เรียก `get_metadata` ล่าสุดแล้วพบ `0:1` และ `1:3` ว่าง และ `1:2` มี root `7:2`; QA ไม่ได้เรียก Figma หรือเปิด raw metadata ของ Coordinator ในงานนี้ จึงถือเป็นข้อมูลรายงานจาก Coordinator ผ่านผู้ใช้ ไม่ใช่การสังเกตโดยตรง
5. ไม่มีภาพก่อน/หลังหรือ property comparison แบบครบถ้วนของทุก page และไม่มีหลักฐานตรวจ file-global styles/library ก่อน/หลัง การที่ pages ว่างจาก metadata ภายหลังหรือ root อยู่ถูก page ไม่พิสูจน์ว่า properties/global styles และเนื้อหาเดิมทั้งหมดไม่ถูกแตะ
6. คำสั่งนับด้วย Python ถูกระบบบล็อก จึงไม่อ้างว่ามีผลนับอิสระจาก command; จำนวน P10/F6/H3 อ่านจากรายการ screen และภาพ, 330 เป็นค่าที่ audit บันทึก ไม่ใช่การนับ node สดโดย QA

## Findings

### Must fix

ไม่มี finding ที่หลักฐานภาพหรือ metadata ที่อ่านแล้วเพียงพอจัดเป็น critical/high security, data loss หรือ core-flow failure ของแอปจริง; ไม่ได้หมายความว่าทดสอบด้านเหล่านั้นผ่าน

### Should fix

1. **จำนวน role screens ใน evidence ขัดกับรายการ screen จริง** — severity: Medium; reference `docs/product/evidence/WF-01/structure.json:339–343,367–596` และภาพ `participant.png`.
   - สิ่งที่เห็น: `roleScreenCounts` ระบุ P=12, F=6, H=3 แต่ `audit.screenCount` ระบุ 19 และรายการ `screens` มี P01–P10, F01–F06, H01–H03; ภาพ participant แสดง P01–P10
   - ปัญหา: field สรุป P=12 ไม่สอดคล้องกับ inventory 10 หน้าสำหรับ participant จึงใช้ field นี้รับรองจำนวนไม่ได้
   - ข้อเสนอ: ให้เจ้าของ evidence ตรวจที่มาของตัวนับและแก้หลักฐาน/คำอธิบายด้วยผล read-back ใหม่ โดยไม่แก้ข้อมูลดิบให้ดูตรงกันโดยไม่มีที่มา
   - หากไม่แก้: ผู้ review อาจเข้าใจว่ามี participant screens เพิ่มอีกสองหน้า และติดตาม state coverage หรือ scope ผิด

2. **คำอธิบายหลัง reconnect เมื่อ session ปิดยังไม่แจกแจงผลคำตอบให้ครบ** — severity: Medium; reference `P08 / Reconnect unknown` node `7:113`, `P09 / Closed` node `7:126`, `participant.png`; checklist WF-P-07/WF-P-08
   - สิ่งที่เห็น: P08 ระบุพบ saved → P06, ไม่พบคำตอบและยังเปิดรับ → P03, และ “ปิดรับแล้ว → P09 โดยไม่แสดง saved เก๊”; P09 ระบุให้ตรวจสถานะล่าสุดและหากตรวจไม่สำเร็จไม่สรุปว่าบันทึกแล้ว
   - ปัญหา: annotation ยังไม่ระบุชัดว่าสถานะปิดพร้อมคำตอบที่ยืนยัน saved แล้ว, ปิดโดยยืนยันว่าไม่บันทึก, และปิดแต่ยังตรวจไม่ได้ จะถูกนำเสนอ/นำทางอย่างไร โดยเฉพาะเมื่อปิดขณะ reconcile ผลยังไม่ทราบ นี่เป็นช่องว่าง design ไม่ใช่ข้อพิสูจน์ว่าระบบสูญเสียข้อมูล
   - ข้อเสนอ: เพิ่ม annotation หรือ variants สำหรับสามผลดังกล่าว โดย saved ต้องมีการยืนยัน และ unknown ต้องคง unknown จนตรวจได้
   - หากไม่แก้: ผู้ implement อาจตีความ closed เป็น failed หรือ saved เอง ทำให้ผู้ตอบเข้าใจสถานะผิด

## ผลตรวจตาม checklist

สถานะ **OBSERVED** หมายถึงมีหลักฐานภาพ/โครงสร้างรองรับเฉพาะข้อความที่ระบุ ไม่ใช่ runtime PASS; **PARTIAL** หมายถึงตรวจได้บางส่วนหรือ specification ยังไม่ครบ; **NOT REVIEWED** หมายถึงไม่มีหลักฐานพอตรวจประเด็นนั้น ผลกระทบและ severity ของ finding อยู่ด้านบน

| Checklist ID | สถานะ | ผลจริง / reference |
|---|---|---|
| WF-SCOPE-01 | PARTIAL | `structure.json:2–3,345–353` ระบุ file/page และ root 7:2; ผู้ใช้รายงาน metadata ปัจจุบันจาก Coordinator แต่ QA ไม่ได้อ่าน Figma สด |
| WF-SCOPE-02 | PARTIAL | รับข้อมูลผ่านผู้ใช้ว่า 0:1/1:3 ว่างใน metadata ล่าสุด; ไม่มี before/after screenshot และ property comparison ครบ จึงยืนยัน preservation ทั้งหมดไม่ได้ |
| WF-SCOPE-03 | NOT REVIEWED | ไม่มี before/after evidence ของ file-global styles/tokens/library และ audit ไม่พิสูจน์ว่าไม่มีการ publish |
| WF-SCOPE-04 | PARTIAL | ภาพทั้งสามเป็น grayscale low-fi; audit ระบุ nongray/placeholders ว่าง แต่ไม่ยืนยันทุก property หรือการเคลื่อนไหวจากภาพนิ่ง |
| WF-SCOPE-05 | PARTIAL | ภาพแสดง 19 screens สอดคล้องรายการ `screens`; `roleScreenCounts.P=12` ขัดรายการ P01–P10 ตาม finding 1; audit ระบุ overflow/overlaps ว่าง แต่ไม่ได้ตรวจทุกข้อความที่ระดับเต็มและไม่ยืนยัน clipping ทุกชนิด |
| WF-P-01 | PARTIAL | P01 `7:19` มี join code ตัวอย่างและ data notice; นโยบายข้อมูลจริงยังต้องอนุมัติ |
| WF-P-02 | PARTIAL | P10 `7:140` แสดงรหัสผิดและ annotation สำหรับห้องไม่พบ/ปิด/ระบบไม่พร้อม; ไม่เห็นทุก state แยกชัดและ loading/checking ครบ |
| WF-P-03 | PARTIAL | P02 `7:34` แสดง waiting และ annotation ไป P08/P09; loading/recovered แยกเฉพาะยังไม่ครบ |
| WF-P-04 | PARTIAL | P03 `7:46` และ P04 `7:62` แสดง rating/poll, selection และปุ่มส่ง; annotation กล่าวถึง validation แต่ไม่ได้เห็นทุก state แยก |
| WF-P-05 | OBSERVED | P05 `7:75` แสดง “กำลังส่งคำตอบ” และ “ยังไม่ยืนยันการบันทึก” แยกจาก P06; เป็นการสังเกต design เท่านั้น |
| WF-P-06 | OBSERVED | P08 `7:113` แสดง “ยังยืนยันการบันทึกไม่ได้”, อาจบันทึกแล้วหรือยังไม่บันทึก และตรวจสถานะก่อน retry; เป็น design annotation |
| WF-P-07 | PARTIAL | P06 `7:87` ระบุยืนยัน persistence; P07 `7:99` และ P08 แยก rejected กับ unknown แต่ผลหลังปิดยังไม่แจกแจงครบตาม finding 2 |
| WF-P-08 | PARTIAL | P09 `7:126` ระบุปิดรับและตรวจคำตอบล่าสุดโดยไม่เดาสถานะ แต่ผล closed ระหว่าง reconcile ยังไม่ครบตาม finding 2 |
| WF-P-09 | PARTIAL | P06/P09 มี annotation กลับไป waiting/closed และ P09 ระบุไม่ส่ง HR link; prototype navigation จริงไม่ได้ตรวจ |
| WF-F-01 | PARTIAL | F01 `7:158` มีวิธีร่วมและจำนวน join ตัวอย่าง แยก join กับตอบ/ออนไลน์; ไม่เห็น state ไม่มีผู้เข้าร่วมใน lobby โดยตรง |
| WF-F-02 | PARTIAL | F01 มีปุ่มเปิดและ annotation กำลังเปิด/ล้มเหลว; F02 `7:172` มีปิดคำถาม และ F05 `7:240` มี confirmation/pending จบ session; ยังไม่เห็น state ปิดคำถาม pending/error ครบ |
| WF-F-03 | OBSERVED | F02 แสดงคำถาม, ผู้ตอบ 18 / ผู้ร่วมมีสิทธิ์ 30 เป็นตัวอย่าง, การกระจาย; F03 `7:197` ระบุยังไม่มีคำตอบ ไม่ตีเป็นคะแนนศูนย์ |
| WF-F-04 | OBSERVED | F04 `7:211` แสดง “ข้อมูลอาจไม่ใช่ค่าล่าสุด”, “ไม่ใช่ Live”, ตรวจสถานะใหม่ และรอยืนยันก่อนสั่งเปิด/ปิดซ้ำ |
| WF-F-05 | PARTIAL | F05 แสดงยืนยันและ annotation pending/error; F06 `7:256` แสดง ended หลังยืนยัน แต่ผลปิดคำถามที่ยืนยัน/เปิดข้อถัดไปไม่ได้เห็น state ครบ |
| WF-F-06 | OBSERVED | ภาพ facilitator ที่ส่งมาตรวจไม่เห็นชื่อหรือคำตอบรายบุคคล; ไม่ครอบคลุม payload หรือ screens นอกภาพ |
| WF-HR-01 | PARTIAL | H01 `7:271` ระบุ session ปิด; H02 `7:299` มี annotation แยกเข้าถึงไม่ได้/ยังไม่พร้อม และ error ไม่ใช่ 0; loading/error variants ไม่ได้ตรวจครบ |
| WF-HR-02 | OBSERVED | H02 แสดงไม่มีคำตอบ; H03 `7:315` แสดงข้อมูลบางส่วน/ข้อมูลขาดโดยไม่แทนศูนย์ |
| WF-HR-03 | PARTIAL | H01 แสดงจำนวนผู้ตอบและ 10/18 เป็นตัวอย่าง; H03 ระบุไม่ทราบฐานและไม่คำนวณเปอร์เซ็นต์ coverage; ไม่ยืนยันสูตรที่ยังรอตัดสินใจ |
| WF-HR-04 | OBSERVED | H03 มีข้อความซ่อนรายละเอียดเมื่อจำนวนน้อยและระบุ minimum count ยังรอผู้ใช้เลือก ไม่ระบุ threshold ที่ยังไม่อนุมัติ |
| WF-HR-05 | OBSERVED | H01 ระบุไม่แสดงชื่อ identifiers หรือคำตอบรายบุคคล และภาพ HR ไม่เห็น join code/control credential; ไม่พิสูจน์ authorization หรือ API payload |
| WF-HR-06 | PARTIAL | H01 ระบุ self-report ไม่ใช่การวินิจฉัย/ประเมินพนักงาน และอุปสรรคไม่พิสูจน์เหตุ; P01 ระบุไม่รับรอง anonymous สมบูรณ์ แต่ HR ไม่ระบุข้อห้ามใช้ข้อมูลชุดเดียวตัดสินจ้าง/เลื่อนตำแหน่งโดยตรง |
| WF-DATA-01 | PARTIAL | F02/F03/F04 และ H01/H02/H03 มีตัวอย่างหรือข้อความครอบคลุมข้อมูล; P01/P05–P08 มีป้ายตัวอย่างบางค่า แต่ยังไม่ได้ตรวจทุกตัวเลขทุก node ใน full resolution |
| WF-DATA-02 | PARTIAL | H01 ระบุ design example และไม่ใช่ข้อมูลผู้ร่วมจริง; P06/F02/F06 มี annotation ว่าไม่พิสูจน์ DB/realtime; prototype links และทุก annotation ไม่ได้ตรวจสด |
| WF-TH-01 | PARTIAL | ซูม P07/P08, F04 และ H01 อ่านได้และไม่เห็นข้อความซ้อน/ถูกตัดในบริเวณนั้น; ภาพรวม downscale จึงไม่รับรองทุกข้อความ/ทุก frame |
| WF-TH-02 | PARTIAL | P05/P06/P08/P09 ใช้ข้อความแยกกำลังส่ง, saved, unknown และ closed; ยังมีช่องว่าง transition ใน finding 2 |
| WF-A11Y-01 | PARTIAL | ภาพใช้ข้อความร่วมกับสถานะและกราฟมีตัวเลข; ยังไม่ตรวจทุก label หรือการขยายข้อความบน UI จริง |
| WF-A11Y-02 | NOT REVIEWED | ไม่มีหลักฐาน interactive spec ครบเรื่อง focus, dialog และ screen reader ในภาพที่ตรวจ; ภาพนิ่งไม่พิสูจน์การใช้งาน keyboard |

## สิ่งที่ยังไม่ตรวจและ gate ถัดไป

- ไม่ได้เรียก Figma สด ตรวจ version ปัจจุบัน/prototype links หรือเปรียบเทียบ canvas และ global styles ก่อน/หลังอย่างครบถ้วน; audit bounds ว่างไม่ใช่หลักฐานว่าไม่มี clipping ทุกชนิด
- ไม่มี application/runtime, API, database, realtime, security, privacy enforcement, mobile browser, keyboard, screen reader หรือ 30 concurrent clients test; ทุกอย่างเหล่านี้ยัง NOT RUN ไม่ใช่ PASS
- Coverage denominator, minimum count, การเก็บ/ลบข้อมูล, สิทธิ์ HR และกติกาคำตอบยังต้องได้การตัดสินใจจากผู้ใช้; อย่านำตัวอย่างใน wireframe ไปถือเป็น policy จริง
- ผู้ใช้ review ทิศทางและ flow ได้ทันทีโดยเห็น finding และข้อจำกัดนี้; ให้ Product/Coordinator จัดการความคลาดเคลื่อน inventory และเติม closed/reconnect specification แล้ว QA ตรวจ artifact ฉบับใหม่ซ้ำก่อนสรุป acceptance การยืนยัน scope เต็มต้องมีหลักฐานก่อน/หลังและ global styles เพิ่มเติม
- ไม่ได้แก้ Figma/code, commit หรือ install MCP; สร้างเฉพาะรายงาน QA ฉบับนี้

Verdict: ส่งให้ผู้ใช้ review wireframe ได้โดยมีข้อแม้; finding 1–2 และหลักฐาน scope ยังเปิดอยู่ ไม่ใช่ release approval
Not checked: Figma สด, global styles ก่อน/หลัง, prototype และ runtime/accessibility/security ทั้งหมด
