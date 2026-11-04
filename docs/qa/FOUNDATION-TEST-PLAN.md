# C0 — Foundation Test Plan

ภาษา: ไทย | ประเภท: risk-based test design เท่านั้น
เวลาจัดทำจากเครื่อง: 2026-11-04T13:07:59+0700
สถานะเอกสาร: DRAFT — รออนุมัติ criteria ก่อนทดสอบแอป

## 1. ข้อเท็จจริง บทบาท และขอบเขต

อ่าน `AGENTS.md`, `docs/TEAM-WORKFLOW.md` และ `docs/SKILLS-REGISTER.md` แล้ว
- `lead-d-qa` เป็น **Senior Tester & Delivery**: ออกแบบและตรวจทดสอบ รายงาน findings และ evidence ไม่ปิด ticket หรือ approve release เอง
- `lead-d-setup` เป็น **Project Lead และ Coordinator เพียงคนเดียว**: รวมผล ติดตาม gates บันทึก progress และปิด ACCEPTED หลังผู้ใช้ยอมรับ
- ผู้ใช้เป็นผู้อนุมัติสุดท้าย; Antigravity IDE รับผิดชอบ implementation รวม automated tests/load scripts
- C0 ครั้งนี้สร้างเอกสารฉบับนี้เท่านั้น ไม่เขียน code/test scripts ไม่เรียกบอตอื่น ไม่แก้ progress หรือไฟล์ร่วม
- ตามบริบทงานจากผู้ใช้ยังไม่มีแอป ดังนั้นทุก application case เป็น **NOT RUN** ไม่ใช่ PASS หรือหลักฐาน release readiness
- ยังไม่เลือก backend/database/realtime implementation ในเอกสารนี้ และไม่รัน upstream helpers

หลักฐาน C0 ที่มีจริง: อ่านเอกสารอ้างอิงผ่านเครื่องมือและเขียนแผนนี้ คำสั่ง `git status --short` และ `git branch --show-current` ต่างคืน `fatal: not a git repository (or any of the parent directories): .git` จึงไม่มี branch/commit/build reference ที่ยืนยันได้ แม้คำสั่งรวมจบด้วย exit code 0 จาก `date` ไม่ถือว่า Git checks ผ่าน

## 2. ข้อเสนอที่ต้องอนุมัติก่อนใช้เป็น acceptance criteria

Expected behavior ใน matrix เป็นข้อเสนอทดสอบ ไม่ใช่คำอ้างว่าแอปทำได้แล้ว
1. นิยาม participant identity และนโยบายหนึ่งคำตอบต่อ participant/question: เสนอให้ retry คำขอเดิมไม่เพิ่มคะแนน; ถ้าอนุญาตแก้คำตอบต้องกำหนด version และกติกา overwrite ชัดเจน
2. Server เป็นแหล่งตัดสินคำถามที่ active และเวลาปิด โดยต้องมีลำดับ close/submit ที่ตรวจสอบได้ ไม่ใช้เวลาบน client เป็นตัวตัดสิน
3. ระบุ role/permission ของ participant, facilitator, HR และขอบเขต session/organisation รวมทั้งสิทธิ์เห็นข้อมูลรายบุคคลและผลสด
4. ระบุ response coverage denominator, สูตร strengths/gaps/blockers และการจัดการ missing data/ข้อมูลกลุ่มเล็กก่อนตรวจความถูกต้องของ dashboard
5. กำหนด allowed origins, วิธี authentication, cookie/CSRF policy, rate-limit budget และรูปแบบ error ของ API/WS
6. กำหนดช่วงโหลด ระยะเวลารัน และเกณฑ์ latency/error ที่ยอมรับสำหรับ 30 concurrent clients; ยังไม่มีตัวเลข SLA ที่อนุมัติ
7. ยืนยัน mobile OS/browser versions และเป้าหมาย accessibility; เสนอ WCAG 2.2 AA สำหรับ flow หลัก พร้อม manual keyboard/VoiceOver testing

## 3. วิธีจัดระดับความเสี่ยงและลำดับทดสอบ

Severity คือผลกระทบหาก case ล้มเหลว ไม่ใช่ข้อบกพร่องที่พบแล้ว:
- Critical: ข้อมูลสูญหายถาวร ข้อมูลข้ามองค์กร/สิทธิ์รั่ว หรือควบคุมระบบโดยไม่มีสิทธิ์
- High: join/vote/control/dashboard core flow ใช้ไม่ได้ คะแนนคลาดเคลื่อน หรือผู้ใช้กลุ่มหลักเข้าใช้งานไม่ได้
- Medium: feedback/recovery/usability ผิดโดยยังมีทางทำงานหลักสำเร็จ

Priority แยกจาก severity: เสนอ P0 ตรวจความปลอดภัย/ข้อมูล/core flow ก่อน, P1 ตรวจ recovery/platform/accessibility ตามมา; Coordinator เป็นผู้ triage จริง ไม่ลดความสำคัญ accessibility เพียงเพราะอยู่ลำดับหลัง

ลำดับรันที่เสนอ: join → vote → persisted read/dashboard → duplicate/race/reconnect/restart → authorization/origin → 30-client concurrency → mobile/accessibility และ regression ของทุกกลุ่มหลังแก้ไข

## 4. Preconditions และข้อมูลทดสอบร่วม

ก่อนรันทุก case ต้องมี build ที่ระบุได้, URL ของ local หรือ test environment ที่ได้รับอนุมัติ, API/event contract, criteria ที่อนุมัติ และวิธีอ่านข้อมูล persistent storage อย่างปลอดภัย
ใช้ synthetic participants เท่านั้น แยก session A/B; เตรียม participant token แบบไม่สมัครบัญชี และ facilitator/HR access grants ตาม role matrix, session เปิด/ปิด และคำถามเก่า/ปัจจุบัน ข้อมูลต้องส่งผ่าน API จริงและอ่านกลับได้ ห้ามใช้ mock chart เป็น evidence
หมายเหตุ Coordinator: organisation A/B เป็นกรณีเพิ่มเมื่อมี multi-organisation scope ที่อนุมัติ ไม่ใช่ข้อบังคับให้สร้าง organisation/accounts framework ใน MVP; cases ที่กล่าวถึง organisation ให้ตรวจ session isolation ก่อน
การ restart/network fault/load test ทำใน environment ทดสอบที่อนุมัติและมีแผนคืนสภาพเท่านั้น ไม่ทดสอบโหลด production โดยไม่มี approval

สำหรับทุกแถวด้านล่าง: actual = ยังไม่ได้รัน; environment/build = ยังไม่มีแอป/build ให้ทดสอบ; execution timestamp = ไม่มี; runtime evidence = ไม่มี หากเตรียมแอปแล้วแต่ติดเงื่อนไขจึงค่อยรายงาน BLOCKED พร้อม blocker/owner ไม่เปลี่ยน NOT RUN เป็น PASS จากการอ่านแผน

## 5. Risk-based test matrix

| Case ID / traceability | ความเสี่ยง | Preconditions เฉพาะ | ขั้นตอนทดสอบที่เสนอ | Expected behavior | Severity | Priority เสนอ | Status |
|---|---|---|---|---|---|---|---|
| JOIN-01 / join core | ผู้ใช้ใหม่เข้า session ไม่ได้ | session A เปิดรับ; participant ใหม่ | เปิด join URL/รหัสที่ถูกต้อง → เข้าร่วม → refresh | เข้าถูก session; identity/state คงอยู่ตาม policy; ไม่สร้าง participant ซ้ำจาก refresh | High | P0 | NOT RUN |
| JOIN-02 / join validation | รหัสผิดหรือ session ปิดยังเข้าได้ | รหัสไม่ถูกต้อง/หมดอายุ/session ปิด | กรอกแต่ละชนิด → ลองส่ง request โดยตรง | ปฏิเสธตาม contract; ไม่สร้างสมาชิก; ข้อความไทยบอกวิธีดำเนินต่อและไม่เปิดเผยข้อมูล session อื่น | High | P0 | NOT RUN |
| VOTE-01 / live voting | คะแนนไม่ถูกบันทึกหรือผลสดคลาดเคลื่อน | คำถาม active; ผู้เข้าร่วมที่มีสิทธิ์ | ส่งคะแนนที่รู้ค่า → ดู acknowledgment และผลสด → อ่านกลับหลัง refresh | แจ้งสำเร็จเฉพาะเมื่อยืนยันตาม persistence contract; คะแนน/จำนวนตรงกับข้อมูลที่บันทึก; สิทธิ์ดูผลเป็นไปตาม role | High | P0 | NOT RUN |
| VOTE-02 / duplicate | double-click/retry ทำให้นับซ้ำ | identity/question เดียว; contract idempotency ที่อนุมัติ | กดส่งติดกัน → ส่ง request เดิมซ้ำ/พร้อมกันจากสองแท็บ → อ่านข้อมูลและผลรวม | logical submission เดิมนับครั้งเดียว; retry ให้ผลสอดคล้องกัน; การแก้คำตอบเป็นไปตาม policy ไม่เพิ่ม coverage | High | P0 | NOT RUN |
| VOTE-03 / stale question | ตอบคำถามเก่าหรือส่ง payload ปลอมได้ | เปิดคำถามถัดไปขณะอีก client ค้างหน้าคำถามเดิม | ส่งคำตอบจากหน้าค้าง → ส่ง question/version เก่าโดยตรง | server ปฏิเสธคำถามที่ไม่รับคำตอบ; ไม่ย้ายคำตอบไปข้อใหม่; UI sync state ล่าสุดโดยไม่แสดง success ปลอม | High | P0 | NOT RUN |
| RACE-01 / close-submit | ผลต่างกันตาม instance หรือคำตอบหายช่วงปิด | มี event/order evidence ฝั่ง server | ส่งก่อนปิด, พร้อมปิด และหลังปิด → ทำซ้ำหลายรอบตามแผนที่อนุมัติ | มีจุดตัดสินลำดับเดียว; คำตอบที่รับนับครั้งเดียวและคงอยู่; คำตอบหลัง close ถูกปฏิเสธชัดเจน; ทุก client ลงท้าย state เดียวกัน | High | P0 | NOT RUN |
| RT-01 / reconnect | reconnect พลาดคำถาม/ผลลัพธ์ | client หลุดก่อนเปลี่ยนคำถาม/ปิด session | ตัด network → เปลี่ยน state บน facilitator → ต่อกลับ | ได้ authoritative snapshot/version ล่าสุด; ไม่พึ่งเฉพาะ event ที่พลาด; ไม่แสดงคำถามเก่าว่ายังเปิด | High | P1 | NOT RUN |
| RT-02 / missing acknowledgment | ผู้ใช้ retry หลัง timeout ทำคะแนนซ้ำ | ส่งสำเร็จฝั่ง server แต่ acknowledgment ไม่ถึง client | ตัด network หลังส่ง → reconnect → retry → ตรวจ read-back | UI แสดง pending/unknown อย่างตรงจริงจนตรวจสถานะได้; คำตอบไม่หายและไม่ซ้ำ | High | P0 | NOT RUN |
| RT-03 / missing/out-of-order events | event ซ้ำ/สลับทำผลสดย้อนกลับ | มีวิธี fault injection ที่อนุมัติ | ทำให้ event ขาด/ซ้ำ/มาช้า → reconnect/refresh | client ไม่ย้อนกลับ state เก่า; deduplicate/reconcile ได้; ผลสุดท้ายตรง persistent source | High | P1 | NOT RUN |
| DATA-01 / restart persistence | acknowledged data สูญหายเมื่อ restart | มีคำตอบที่ยืนยันสำเร็จและ state เปิด/ปิดที่บันทึกแล้ว | เก็บ baseline → restart runtime ใน test env โดยไม่ลบ storage → เปิด participant/facilitator/HR ใหม่ | คำตอบและ state ที่ commit แล้วอยู่ครบ; ไม่มีคะแนนซ้ำ; dashboard อ่านข้อมูลเดิมได้ ไม่ใช่ memory-only | Critical | P0 | NOT RUN |
| LOAD-01 / 30 concurrent clients | ระบบล้ม/ข้อมูลผิดเมื่อใช้พร้อมกัน | 30 distinct synthetic clients; load tool ที่ Antigravity จัดทำ; duration/SLA อนุมัติ | ให้ทั้ง 30 ต่อพร้อมกัน → join → ส่งในช่วงเดียวกัน → เปลี่ยน/ปิดคำถาม → อ่านผล; เก็บ active connections/requests/errors/latency | พิสูจน์ overlap ของ 30 clients จริง; จำนวน accepted unique votes ตรง read-back และผลรวม; ไม่มี lost/duplicate votes; latency/error ผ่านเกณฑ์ที่อนุมัติ | High | P0 | NOT RUN |
| HR-01 / dashboard accuracy | coverage/strengths/gaps/blockers ผิด | ชุดข้อมูล known inputs ผ่าน API จริง มีผู้ไม่ตอบและหลายคำถาม | บันทึกข้อมูล → คำนวณ expected ด้วยเครื่องมือจากสูตรอนุมัติ → เทียบ dashboard หลัง refresh | ตัวตั้ง/ตัวหาร/rounding/filters ตรงสูตร; missing ไม่ถูกแทนคะแนนศูนย์โดยไม่มีข้อกำหนด; chart ตรงข้อมูล persistent | High | P0 | NOT RUN |
| HR-02 / dashboard empty/error | ไม่มีข้อมูลถูกตีความว่าได้ผลจริง | session ว่าง/partial; API error/ช้า | เปิด dashboard → สลับ filter → จำลอง error ที่อนุมัติ | แยก loading/empty/error/partial ชัดเจน; ไม่แสดง mock success หรือผลเก่าราวกับข้อมูลล่าสุด; แสดงข้อจำกัดการสรุปข้อมูล | Medium | P1 | NOT RUN |
| AUTH-01 / role bypass | participant สั่งเปิดปิด/อ่าน HR ได้ | role matrix; anonymous/participant/expired identity | เรียก protected API และ WS actions โดยตรง รวมแก้ role ใน client | server ปฏิเสธทุก action นอกสิทธิ์; ไม่มี state mutation หรือข้อมูล HR รั่ว; ไม่พึ่งการซ่อนปุ่ม | Critical | P0 | NOT RUN |
| AUTH-02 / session isolation | session/organisation อื่นอ่านหรือแก้ข้อมูลกันได้ | บัญชีและข้อมูล A/B แยกกัน | สลับ session/question/organisation identifiers ใน request, dashboard filter และ WS subscribe | ตรวจสิทธิ์ทุกช่องทาง; ไม่อ่าน/เขียน/รับ broadcast ข้ามขอบเขต; error ไม่เปิดเผยข้อมูลต้องห้าม | Critical | P0 | NOT RUN |
| SEC-01 / CORS | browser origin ที่ไม่อนุญาตอ่านข้อมูลได้ | allowlist จริง; origin อนุญาต/ไม่อนุญาต/null | ทดสอบ preflight และ credentialed request จากแต่ละ origin ผ่าน browser | headers ตรง allowlist; origin ที่ห้ามอ่าน response ไม่ได้; ไม่ใช้ wildcard กับ credentials; authentication ยังตรวจ server-side เพราะ CORS ไม่ใช่ authorization | High | P0 | NOT RUN |
| SEC-02 / WS Origin | cross-site websocket hijacking | WS endpoint และ Origin policy | handshake จาก trusted/untrusted/null/missing Origin พร้อม identity ตามกรณี | ปฏิเสธ untrusted browser Origin; null/missing ตาม policy ที่อนุมัติ; origin ผ่านไม่แทน authentication; subscribe/actions ยังตรวจ role/session | High | P0 | NOT RUN |
| SEC-03 / CSRF | cross-site mutation ด้วย ambient credentials | ตัดสิน auth/cookie design แล้ว | ส่ง cross-site join/vote/control requests รวม credentialed forms ตาม threat model | ไม่เกิด mutation โดยไม่ได้รับอนุญาต; CSRF/SameSite/origin protections สอดคล้อง design; หากไม่เกี่ยวข้องต้องแนบเหตุผลจาก implementation ไม่ข้ามจากสมมติฐาน | High | P0 | NOT RUN |
| SEC-04 / validation/XSS | payload ผิดหรือข้อความแทรก script | fields และขอบเขตค่าตาม contract | ส่งคะแนนนอกช่วง/type ผิด/ID ปลอม/ข้อความยาว/HTML และ script-like text ใน synthetic fields → ดู participant/HR | server validate และปฏิเสธข้อมูลผิด; ไม่มี script execution; output encode; error ไม่เผย secrets/stack ภายใน | High | P0 | NOT RUN |
| SEC-05 / rate limits | join/vote/WS flood รบกวนผู้อื่น | limit budget และ bounded test อนุมัติ | ส่งเกิน budget ใน test env → ตรวจ client ปกติและ recovery | จำกัดอย่างเป็นธรรมตาม policy; มี error/backoff ชัดเจน; ไม่ lock out ผู้ใช้ปกติโดยไม่ตั้งใจ; ไม่มี bypass ผ่าน WS/API อีกช่องทาง | High | P1 | NOT RUN |
| PRIV-01 / HR privacy | HR/UI/logs เปิดเผยตัวบุคคลเกินสิทธิ์ | visibility/aggregation/minimum group policy อนุมัติ | ตรวจ response payload, chart, filters, errors และ logs ที่อนุญาต | แสดงเฉพาะข้อมูลจำเป็นตามสิทธิ์; ไม่รั่ว token/PII ใน UI หรือ evidence; กลุ่มเล็กและตัวหารไม่เปิดเผยข้อมูลเกิน policy | High | P0 | NOT RUN |
| MOB-01 / mobile Safari | iPhone join/vote/reconnect ไม่ได้ | อุปกรณ์ iOS Safari จริง ระบุรุ่น/เวอร์ชัน | join → เปิด keyboard → vote → หมุนจอ → background/resume → reconnect → refresh | flow หลักสำเร็จ; ไม่มีปุ่มถูก keyboard บัง/ตัดออก; feedback อ่านได้; resume sync ถูกต้องและไม่ส่งซ้ำ | High | P1 | NOT RUN |
| MOB-02 / mobile Chrome | Chrome/mobile layout ต่างจนใช้งานไม่ได้ | Android Chrome จริง ระบุรุ่น/เวอร์ชัน | ทำ join/vote และทดสอบ viewport เล็ก/zoom/network recovery | core flow และผลข้อมูลเหมือน Safari; ไม่มี horizontal overflow ที่ขวางงาน; hit targets ใช้ได้ | High | P1 | NOT RUN |
| A11Y-01 / keyboard | ผู้ใช้ keyboard ส่งคำตอบหรือคุม session ไม่ได้ | participant/facilitator/HR views | ใช้ Tab/Shift+Tab/Enter/Space/Escape โดยไม่ใช้เมาส์ รวม dialog/error | focus เห็นชัดและลำดับสมเหตุผล; ไม่มี trap; controls มีชื่อ/role/state; error focus/recovery ใช้ได้ | High | P1 | NOT RUN |
| A11Y-02 / Thai & screen reader | ภาษาไทย/ผลสด/สถานะเข้าถึงไม่ได้ | Thai UI, VoiceOver/Safari; criteria ที่อนุมัติ | อ่าน join/vote/dashboard ด้วย screen reader → ตรวจผลสด/error → zoom 200% และ reflow เทียบเกณฑ์ | label/ภาษา/ลำดับอ่านถูกต้อง; ประกาศสถานะสำคัญโดยไม่แย่ง focus; ไม่ใช้สีอย่างเดียว; contrast และข้อความไทยไม่ตัดความหมาย; มี textual alternative ของ chart | High | P1 | NOT RUN |

## 6. Evidence และแบบรายงานเมื่อมีแอป

ต่อหนึ่ง case ให้บันทึก:
- Case ID, acceptance criterion/decision reference, risk, severity และ priority แยกช่อง
- Preconditions, synthetic data identifiers, steps และ expected behavior ที่อนุมัติ
- Actual behavior และ PASS/FAIL/BLOCKED/NOT RUN พร้อมเหตุผล
- Environment URL, build/commit หรือ artifact identifier, browser/OS/device และ config ที่ไม่เป็น secret
- Timestamp พร้อม timezone ของการรันจริง; ไม่ใช้วันที่เขียนแผนแทน
- Evidence references: screenshot/recording, sanitized request/response, event ordering/version, logs, persisted read-back และคำสั่ง/exit codes ของเครื่องมือที่มีอยู่
- สำหรับ race/concurrency ต้องมี accepted/rejected/unique counts, หลักฐาน overlap, missing/duplicate check, latency/error results และวิธีวัด ไม่ใช้จำนวนแท็บแทนจำนวน concurrent clients ที่พิสูจน์ได้
- Failure ต้องมี repro, ผลกระทบ, owner ที่ Coordinator กำหนด และ retest/regression reference บน build ใหม่

ห้ามแนบ secrets/ข้อมูลบุคคลจริง และห้ามใช้ benchmark ผู้ขาย เอกสารแผน หรือผลจาก build เก่าแทนผลทดสอบแอปปัจจุบัน

## 7. Gates และข้อจำกัด

Entry gate: ผู้ใช้อนุมัติ criteria/threat model, มีแอปและ test environment, contracts, build reference และเครื่องมือทดสอบที่มีอยู่จาก Antigravity ก่อนเริ่ม execution

Exit gate: ทุก criterion มีผลและหลักฐานจาก build ปัจจุบัน; high/critical security, data loss หรือ core flow failure ต้องรายงาน **CHANGES_REQUESTED** พร้อม repro ไม่ self-approve; หลังแก้ต้องรัน case เดิมและ regression ที่เกี่ยวข้องใหม่ ผู้ใช้ยอมรับและ Coordinator จึงปิดงาน

Delivery รอบหลังต้องตรวจ README/setup กับการรันจริง เตรียม deployment checklist และ video outline; deployment/publish ต้องมี approval แยก และวิดีโอจริงเป็นผู้ใช้ถ่าย one-take 5–8 นาทีเห็นจอและใบหน้า ไม่ใช่งานที่ดำเนินการใน C0 นี้

ข้อจำกัดปัจจุบัน: ไม่มี runtime execution, API/WS/DB verification, mobile/accessibility results หรือ 30-client measurement; ทุก application case ยัง NOT RUN ไม่มีข้อสรุปว่าแอปปลอดภัย รองรับโหลด หรือพร้อม release แผนนี้ไม่ยืนยัน stack/backend และไม่ใช่ automated tests ไม่มีการติดต่อบอตอื่นหรือแก้ไฟล์อื่นในงานนี้
