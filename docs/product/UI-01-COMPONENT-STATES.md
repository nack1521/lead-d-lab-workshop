# UI-01 — Component / State Contract และ Design Review Checklist

สถานะ: **DRAFT_FOR_USER_DECISION**; ใช้คู่ [UI direction](UI-01-DIRECTION.md). ไม่ใช่ implementation/handoff ที่อนุมัติแล้ว และไม่เปลี่ยน approved WF-01-R1 flow

## 1. Component contract ที่เสนอ

| ID / Component | Variants ที่ต้องมี | Behavior / accessibility |
|---|---|---|
| UI-C01 Button | primary, secondary, destructive, disabled, pending | label เป็น action ชัดเจน; target48px; keyboard focus มองเห็น; pending กัน repeated action แต่ไม่แสดง saved/closed ก่อน server ยืนยัน |
| UI-C02 Text field | empty, focused, filled, invalid, disabled | visible label + optional marker; helper/error ผูกกับช่อง; คงค่าเมื่อ error; nickname ไม่ใช้เป็น identity และไม่บังคับ unique |
| UI-C03 Comment textarea | empty, filled, focused, invalid, pending/unknown | multiline Enter เป็นขึ้นบรรทัดใหม่ไม่ submit; คง draft; server grapheme count authoritative; ไม่ใช้ maxlength ที่นับ UTF-16 แล้วตัด Thai/emoji เงียบๆ |
| UI-C04 Rating | unselected, selected, focused, pending, accepted-read-only, closed | native radio semantics เป็น default ที่เสนอ; label ทุกค่าและความหมาย endpoints; กดที่ label ได้; selected มีมากกว่าสี; ไม่มี default answer ที่ดูเหมือนผู้ใช้เลือกแล้ว |
| UI-C05 Poll option | unselected, selected, focused, pending, accepted-read-only, closed | single choice; option text wrap ได้ทั้งแถว; native radio/radiogroup semantics; ไม่เพิ่ม multi-select |
| UI-C06 State banner | waiting, submitting, saved, confirmed-not-saved, unknown, closed, stale | ข้อความ/icon ประกอบ ไม่ใช้สีอย่างเดียว; connection state และ submission outcome เป็นคนละแกน; ข้อความต้องตรง actual outcome |
| UI-C07 Session / Question context | lobby, receiving, closed, ended | แสดง workshop/current question โดยไม่เผย grant token; question close กับ session end ใช้ label/confirmation ต่างกัน |
| UI-C08 Aggregate chart | loading, empty, data, stale, error, partial | แสดง accepted counts/distribution จากข้อมูลจริงหลัง commit; มี textual counts; ไม่ถือ loading/error/missing เป็น0; stale ไม่ติดป้าย live |
| UI-C09 Coverage / limitation block | known denominator, unknown denominator, partial, empty | ระบุ n/ที่มาของ denominator และข้อจำกัด self-report; ไม่ hardcode30; ไม่สรุปประสิทธิภาพรายบุคคลหรือใส่ raw text |
| UI-C10 End-session confirmation | review, submitting, unknown, confirmed | ตัดสินใจก่อนส่งคำสั่งได้; หลังส่งแล้ว timeout ให้ reconcile authoritative session state ไม่กล่าวว่า cancel ย้อน server action สำเร็จ; destructive action ไม่เป็น primary เด่นทุกหน้า |

React/Antigravity จะเลือก implementation ที่เล็กที่สุดภายหลัง; ตารางนี้ไม่บังคับติดตั้ง component/chart library เพิ่ม

## 2. Submission vocabulary ที่ต้องใช้ตรงกัน
| Outcome | ข้อความหลักตัวอย่าง (ร่าง microcopy) | สิ่งที่เสนอให้ทำ |
|---|---|---|
| sending | กำลังส่งคำตอบ… | คง payload/draft; กัน duplicate click; ยังไม่บอกบันทึกแล้ว |
| saved | บันทึกคำตอบแล้ว | แสดง own accepted outcome หลัง authoritative confirmation; ไม่เปิดแก้คำตอบ accepted |
| terminal confirmed non-save | ยังไม่ได้บันทึกคำตอบ | แสดงสาเหตุ/inline error; retry unchanged key+payload เดิมได้ตาม contract; edited new submission/keyใหม่ได้เมื่อ old request ไม่ commit ภายหลังและคำถามยังเปิด |
| unknown | ยังยืนยันการบันทึกไม่ได้ | ตรวจสถานะคำตอบเดิม/reconcile ด้วย key+payload เดิม; ไม่สร้างkeyใหม่/ไม่ส่งร่างอัตโนมัติ; ไม่บอกว่าไม่บันทึก |
| question closed | ปิดรับคำตอบแล้ว | ไม่รับ new writes; แสดง saved/not-saved/unknown ของตนให้ตรงจริง และยังตรวจ receipt ตามสิทธิ์ได้ |
| session ended | จบเวิร์กช็อปแล้ว | ไม่ join/ส่งใหม่; receipt read-only ตาม proposed grace/TTL/revoke contract; ไม่มี participant link ที่ bypass ไป HR |

Microcopy เป็นร่าง ไม่ใช่ UI ที่ publish แล้ว. ข้อความ “ส่งอีกครั้ง” ต้องแยกจาก “แก้คำตอบและส่งใหม่” ไม่ทำให้ผู้ใช้เข้าใจว่า accepted response แก้ได้

## 3. Screen mapping ตาม baseline
ใช้ screen codes เดิมทุกข้อ; เหตุการณ์ asynchronous ไม่ถูกลดเหลือหน้า happy path. node IDs และจำนวนมาจาก archived baseline ไม่ใช่การแก้ live canvas

| Code | Baseline screen | Components / hierarchy และข้อกำหนดสำคัญ |
|---|---|---|
| P01 | Join | C07 context → privacy reminder → C02 room/nickname(optional) → C01 join; ข้อความไม่ต้องสมัครบัญชี ไม่สัญญา anonymous100% |
| P02 | Waiting | C07 current session + C06 waiting; ไม่มีปุ่มตอบหรือ aggregate ของ facilitator ก่อนคำถามเปิด |
| P03 | Rating | question/scale meaning → C04 rating → C03 optional comment → C01 submit; selected ไม่แปลว่าส่งแล้ว |
| P04 | Poll | question → C05 single choice → C03 optional comment → C01 submit; answer จำเป็น comment ไม่บังคับ |
| P05 | Sending | C06 sending และ payloadเดิม; score/comment เป็นชุดเดียว; ไม่กดส่งซ้ำและไม่ประกาศสำเร็จจาก animation |
| P06 | Saved | C06 saved พร้อม own accepted answer/comment; กลับ waiting ได้; ไม่แสดง aggregate หรือ edit accepted |
| P07 | Send error | C06 confirmed non-save + สาเหตุ/inline error; preserve draft; unchanged retry ต่างจาก edited new submission |
| P08 | Reconnect unknown | C06 unknown + ตรวจสถานะเดิม; คง payload/keyเดิม; แยก connection lost จากคำตอบถูกบันทึกหรือไม่ |
| P09 | Closed | C07 closed + own saved/not-saved/unknown; ไม่ส่งร่างเอง; อ่าน receipt ภายในสิทธิ์/grace ไม่ลัดไปHR |
| P10 | Join error | C02 room field error + nickname retained + retry join; errorไม่เปิดเผยข้อมูลsessionอื่น/ไม่ล้างชื่อเล่น |
| F01 | Lobby | C07 lobby/join instructions + joined countจริง + open question action; joinedไม่ใช่accepted responses |
| F02 | Live aggregate | C07 active question → n/denominatorจริง → C08 distribution → close-question action; aggregateไม่มีraw fields |
| F03 | Zero responses | C08 zero responses ที่ยืนยันจริง; ไม่สร้างกราฟ0ระหว่างloading/error; controlยังตรง authoritative state |
| F04 | Stale reconnect | C06 stale/reconnecting + old C08 snapshotติดlabelข้อมูลเก่า + refresh/reconcile; ไม่ติดLiveจนได้fresh state |
| F05 | Close pending | C10 end-session confirmation/pending; แยกจากclose question; timeoutเป็นunknownไม่ใช่ปิดสำเร็จ |
| F06 | Session ended | C07 session ended หลังยืนยันจริง; summary linkเฉพาะสิทธิ์ที่มี ไม่ให้linkแทนauthorization |
| H01 | Post-session summary | C07 closed session/context → C09 coverage → C08 distribution → limitations; self-reportไม่ใช่performance score |
| H02 | Empty summary | C08 empty ที่ยืนยันว่าไม่มีaccepted data; แยกloading/error/not-ended/unauthorized; ไม่ใส่insightsขึ้นเอง |
| H03 | Partial missing | C09 partial/missing + known denominators + limitations; missingไม่เป็น0; subgroupprivacyต้องมีpolicyก่อนแสดงรายละเอียด |

## 4. Accessibility / Thai / responsive review criteria
- Persistent visible labels; optional ระบุชัด; ไม่ใช้ placeholder เป็นคำอธิบายเพียงอย่างเดียว
- Native keyboard semantics: Tab/focus, Arrow keys ของ radio, Space/Enter ตามชนิด control; Enter ใน textarea ไม่ submit
- แจ้ง saved/error/status อย่างพอดีผ่าน accessible status region; ไม่ประกาศ live count ทุก event จนรบกวนผู้ใช้. Actual screen-reader behavior ต้องทดสอบ
- Focus ไม่กระโดดเพราะ aggregate เปลี่ยน; validation พาไป error อย่างชัดเจนโดยไม่ล้าง draft; modalภายหลังต้องตรวจ initial focus/Escape/return focus
- Thai IME composition ไม่ถูกขัดจังหวะ; grapheme limit40/500 ตาม baseline; unsupported Segmenter ใช้ approximate/unavailable count ที่บอกตรงๆ ไม่ตัด input
- Target48px, touch spacing และlong Thai labels; reflowที่320px, 200% zoom, landscape, iOS keyboard/Android keyboard; ไม่รับรองจนรันจริง
- Color pairs ที่ผ่าน static check ใช้เฉพาะforeground/backgroundตามรายการ; อย่าลดopacity/วางบนภาพแล้วอ้างcontrastเดิม; disabled controlsตรวจreadabilityแยก ไม่สรุปจากคู่active
- Distribution มี label/count ไม่ใช้สีเพื่อแยกตัวเลือกอย่างเดียว; animationเคารพreduced motion

## 5. Design-review checklist และสถานะจริง
| Check | สถานะรอบ UI-01 |
|---|---|
| อ่าน WF-01-R1 text + ภาพทั้ง3 role | DONE — Coordinator อ่านจริง |
| จับคู่ screen codes ครบ19 unique: P10/F6/H3 | VERIFIED_STATIC — ตรวจinventory/readbackในPython |
| เปรียบเทียบdirection A/B/C โดยคงflow/privacy | DRAFT — รอผู้ใช้เลือก |
| คำนวณcontrastคู่ที่ระบุ30คู่ | VERIFIED_STATIC — ไม่ใช่WCAGของแอป |
| Nominal rating widthที่320px | VERIFIED_STATIC — runtimefont/zoomยังNOT RUN |
| Product/QA independent design sign-off | NOT RUN — รอบนี้เป็นCoordinator draft |
| Formal DESIGN.md lint/token export | NOT RUN — ยังไม่สร้างnormative spec/ไม่ติดตั้งCLI |
| New hi-fi Figma / clickable prototype | NOT RUN — ไม่มีwrite approvalในรอบเอกสารนี้ |
| Browser/mobile/keyboard/screen reader testing | NOT RUN — ยังไม่มีUIimplementation |
| C1 runtime / security / persistence / realtime | NOT RUN — codingยังไม่ได้อนุมัติ |

## 6. Handoff หลังผู้ใช้เลือก direction (ยังไม่ dispatch)
1. ใช้ direction ที่เลือกเพียงชุดเดียว; formalize typography/tokens พร้อมcontrast/focus/controlvariants และตรวจfontlicense
2. ขอ scope Figma hi-fi ให้ชัดก่อนwrite: ห้ามแก้pagesนอกสิทธิ์เดิม ห้ามทับnative low-fiหรือglobal stylesโดยอนุมานจากการเลือกสี
3. เริ่มrepresentative screens P01/P03/F02/H01; reusecomponent/statecontractขยายไปครบbaselineตามscopeที่อนุมัติ แทนออกแบบ19หน้าต่างกัน
4. Review failure/unknown/closed/stale/empty/partial และmobile text/keyboardก่อนapproveส่งbuild
5. สร้างAntigravityhandoffของsliceที่จะทำ พร้อมdesignreference, acceptance, skill_usage/resultpaths และbuildapprovalแยก. C1ยังใช้technicalproofscopeเดิม ไม่ขยายเป็นfullUIโดยไม่ตกลง

ทั้งหมดนี้เป็นข้อกำหนด/เกณฑ์ทดสอบ ยังไม่ใช่ผลที่รันผ่านจริง. Human approval ให้ direction ไม่ใช่ human acceptance ของแอป
