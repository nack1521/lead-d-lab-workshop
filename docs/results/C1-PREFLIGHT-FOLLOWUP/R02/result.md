# C1-PREFLIGHT-FOLLOWUP / R02 — การตอบข้อตรวจทาน (Preflight Revision)

- **Task ID:** `C1-PREFLIGHT-FOLLOWUP`
- **Run ID:** `R02`
- **บันทึกเมื่อ:** 2026-11-05T13:42:00+07:00
- **Producer:** Antigravity IDE (Direct IDE response)
- **Source Kind:** `direct`
- **Baseline Git HEAD:** `29b40dbdb55c518546dac266911e2d18a6ef7fa2`
- **Working Tree / Dirty Paths:** `docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md` (คงงานเดิมของ Coordinator/Product ไว้ ไม่ stage ทับ)
- **Changed Paths ในรอบนี้:** `docs/results/C1-PREFLIGHT-FOLLOWUP/R02/result.md`, `docs/results/C1-PREFLIGHT-FOLLOWUP/R02/result.json`, `docs/results/INDEX.md`
- **สิ่งที่ทำในรอบนี้:** ตรวจสอบ security advisories จริงของ dependencies ทั้งชุดผ่าน GitHub Advisory database และ npm registry; ตอบ findings `C1-PF-REV-01` ถึง `C1-PF-REV-04` ในเชิงข้อกำหนดและ contract; บันทึกผลรอบ R02 แบบเอกสารเท่านั้น
- **สิ่งที่ไม่ได้ทำในรอบนี้:** ไม่ได้เขียน application code, ไม่ได้ติดตั้ง dependencies (`bun install`), ไม่ได้ pull/start Docker container, ไม่ได้ deploy, และไม่ได้ push
- **สถานะของ Task:** **READY_FOR_REVIEW** (สำหรับเอกสาร preflight revision; runtime C1-01 ถึง C1-16 ยังคงเป็น **NOT RUN**)

---

## สรุปการตอบข้อตรวจทาน (Response to Review Findings)

### C1-PF-REV-01: การตรวจสอบ Security Advisories ทั้งชุด และ Exact Safe Pins ใหม่

#### 1. ผลการตรวจ Security Advisory จริง
จากการสืบค้น GitHub Advisory Database (`https://api.github.com/advisories?ecosystem=npm&affects=...`) ร่วมกับ npm registry:
1. **Vite:**
   - เดิมเสนอ `6.2.0` ซึ่งได้รับผลกระทบจาก [GHSA-356w-63v5-8wf4](https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4) (affected `>=6.2.0, <=6.2.5`), [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) (`<=6.4.3`), และ [GHSA-8g5g-mxqh-grgj](https://github.com/advisories/GHSA-8g5g-mxqh-grgj) (`=6.4.4`)
   - ตรวจสอบ `vite@6.4.5`: พบ **0 advisories** (Fixed all known v6 vulnerabilities)
2. **Elysia:**
   - เดิมเสนอ `1.2.25` ซึ่งพบว่าได้รับผลกระทบจาก 4 ช่องโหว่:
     - [GHSA-9643-4qgh-g8mx](https://github.com/advisories/GHSA-9643-4qgh-g8mx) (`< 1.4.29`) — Inefficient Algorithmic Complexity
     - [GHSA-8hq9-phh3-p2wp](https://github.com/advisories/GHSA-8hq9-phh3-p2wp) (`< 1.4.27`) — Cookie Value Prototype Pollution
     - [GHSA-f45g-68q3-5w8x](https://github.com/advisories/GHSA-f45g-68q3-5w8x) (`< 1.4.26`) — String URL format ReDoS
     - [GHSA-8vch-m3f4-q8jf](https://github.com/advisories/GHSA-8vch-m3f4-q8jf) (`< 1.4.18`) — Arbitrary code injection through cookie config
   - ตรวจสอบ `elysia@1.4.31`: พบ **0 advisories** (Fixed all vulnerabilities)
3. **Drizzle ORM:**
   - เดิมเสนอ `0.40.0` ซึ่งได้รับผลกระทบจาก [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9) (`< 0.45.2`) — SQL injection via improperly escaped SQL identifiers
   - ตรวจสอบ `drizzle-orm@0.45.4`: พบ **0 advisories** (Fixed)
4. **Dependencies อื่นๆ ในชุด:**
   - `react@18.3.1`: **0 advisories**
   - `react-dom@18.3.1`: **0 advisories**
   - `@vitejs/plugin-react@6.2.1`: **0 advisories**
   - `@elysiajs/cors@1.4.2`: **0 advisories**
   - `postgres@3.4.5`: **0 advisories**

#### 2. ตาราง Exact Pins ที่เสนอใหม่ (Clean & Advisory-Free)
| Package / Image | Proposed Exact Pin | GHSA Advisories | Architecture / Platform | Runtime Status |
|---|---|---|---|---|
| **Host Bun** | `1.4.4` | - | `darwin-arm64` | **VERIFIED (Host)** |
| **React** | `18.3.1` | 0 | universal | **UNVERIFIED** |
| **React DOM** | `18.3.1` | 0 | universal | **UNVERIFIED** |
| **Vite** | `6.4.5` | 0 | universal | **UNVERIFIED** |
| **@vitejs/plugin-react** | `6.2.1` | 0 | universal | **UNVERIFIED** |
| **Elysia** | `1.4.31` | 0 | Bun native | **UNVERIFIED** |
| **@elysiajs/cors** | `1.4.2` | 0 | Bun native | **UNVERIFIED** |
| **Drizzle ORM** | `0.45.4` | 0 | universal | **UNVERIFIED** |
| **drizzle-kit** | `0.31.11` | 0 | universal (dev) | **UNVERIFIED** |
| **postgres.js** | `3.4.5` | 0 | Bun native | **UNVERIFIED** |
| **Docker PostgreSQL** | `postgres:16.8-alpine` | - | `arm64`, `amd64` | **UNVERIFIED** |
| **Docker Bun** | `oven/bun:1.4.4-alpine` | - | `arm64`, `amd64` | **UNVERIFIED** |

*แผนตรวจ Digest:* เมื่อเริ่ม build จะรัน `docker pull` และ inspect sha256 digest จริงมาใส่ใน `compose.yaml` โดยไม่สร้าง digest จำลอง

---

### C1-PF-REV-02: การจำแนก Lifecycle และสิทธิ์เข้าถึง Receipt หลังปิด Session

เพื่อแก้ไขปัญหาที่ grant ถูก revoke จน participant ไม่สามารถ reconcile receipt ในกรณี dropped ack ได้ จึงกำหนดการแยก lifecycle อย่างชัดเจนเป็น 3 ระดับ:

1. **Question Closed (`receiving = false`):**
   - ปิดรับคำตอบใหม่ของคำถามนั้น (คำขอ submit ใหม่จะได้รับข้อผิดพลาด `QUESTION_CLOSED`)
   - **สิทธิ์ Reconcile / Read-own:** Participant ยังคงถือ Participant Grant ที่ถูกต้อง และสามารถเรียกอ่าน receipt ของคำถามที่ปิดไปแล้วได้ตามปกติผ่าน authenticated endpoint `/api/sessions/:id/questions/:qid/receipt`
   - Replay accepted submission เดิม ยังคงคืนผลลัพธ์ accepted เดิม
2. **Session Ended (จบ Workshop ตามปกติ):**
   - Facilitator สั่งจบ Session; ปิดรับการ join ใหม่และปิดการส่งคำตอบของทุกคำถาม
   - **Bounded Read-Only Grace Period:** Participant Grants ยังคงมีผลบังคับใช้ในโหมด Read-Only ต่อเนื่องอีก **15 นาที** (Grace Period) เพื่อเปิดโอกาสให้ไคลเอนต์ที่มี in-flight request หรือเพิ่ง reconnect สามารถทำ reconciliation กับ receipt เดิมได้จนเสร็จสิ้น
   - ไม่มีการเปิด unauthenticated endpoint สำหรับอ่าน receipt (ป้องกันการ enumerate หรือสอดแนมคำตอบ)
   - ไม่มีการต่ออายุ grant อย่างลับๆ (ระยะเวลา 15 นาทีถูกผูกกับเวลา `session_ended_at + 15m`)
3. **Security Revocation (`grant_revoked` / Hard Expiry):**
   - เกิดขึ้นเมื่อ Facilitator สั่ง Revoke สิทธิ์รายบุคคล, สั่ง Terminate session แบบฉุกเฉิน, หรือพ้นระยะเวลา Grant TTL / Grace Period
   - อัปเดต `revoked_at = NOW()` ใน DB
   - ยุติสิทธิ์ทั้งหมดทันที: ทุกคำขอ (ทั้ง Read และ Write) จะถูกปฏิเสธด้วย `401 Unauthorized`
- **การผูก Seams:**
  - เพิ่มใน **C1-10**: Replay หลัง close ยังคืนผลเดิม และ reconcile receipt ทำได้สมบูรณ์
  - เพิ่มใน **C1-11**: In-flight ack drop ขณะเกิด session end สามารถกู้ snapshot และอ่าน receipt ได้ภายใน Grace Period
  - เพิ่มใน **C1-13**: Security revocation และการเข้าถึงหลังพ้น Grace Period จะต้องถูกตัดสิทธิ์ด้วย 401 อย่างเคร่งครัด

---

### C1-PF-REV-03: สัญญา Unicode Fallback แบบเรียบง่ายและยึด Server-Authoritative

1. **Client-side Strategy (Browser):**
   - **Primary:** ตรวจสอบ `Intl.Segmenter` ภาษาไทย (`th`) แบบ `granularity: "grapheme"` (เบราว์เซอร์ยุคปัจจุบัน Safari 14.1+, Chrome 87+, Firefox 125+ รองรับทั้งหมด)
   - **Fallback:** หากเบราว์เซอร์รุ่นเก่าไม่มี `Intl.Segmenter`:
     - **ไม่เขียน Thai/Emoji segmentation parser ขึ้นเอง** เพื่อหลีกเลี่ยงความคลาดเคลื่อนกับ ZWJ, flags, และ skin tones
     - แสดงตัวเลขนับแบบประมาณการ พร้อมข้อความระบุชัดเจนใน UI เช่น `"~35/40 ตัวอักษร (ประมาณการ)"`
     - **ห้ามบล็อกปุ่มส่ง หรือตัดทอนข้อความบน Client:** อนุญาตให้ผู้ใช้กดส่งข้อความได้ตามที่พิมพ์จริง เพื่อส่งไปให้ Server ตัดสิน
2. **Server-Authoritative Validation (Single Source of Truth):**
   - Bun runtime 1.4.4 รัน `Intl.Segmenter` ภาษาไทยเป็นผู้ตัดสินขาดเสมอ
   - หาก Server ตรวจพบว่าเกิน 40 (nickname) หรือ 500 (comment): Server ส่ง `422 Unprocessable Entity` พร้อม structured application rejection
   - ฝั่ง Client จะ **คงข้อความร่าง (Draft) ไว้ครบถ้วนในช่องกรอก** ไม่ล้างข้อมูล และแสดงข้อความเตือน Inline ภาษาไทยใต้ช่องกรอก เช่น `"ชื่อเล่นต้องไม่เกิน 40 ตัวอักษร"` หรือ `"ข้อความต้องไม่เกิน 500 ตัวอักษร"` โดยไม่ตัดทอนข้อความเงียบๆ

---

### C1-PF-REV-04: นิยาม Terminal Non-save จาก Structured Application Contract

1. **ปัญหาของ HTTP Status Code ดั้งเดิม:**
   - รหัส HTTP 4xx/5xx จาก Proxy, Load Balancer หรือ Gateway (เช่น Cloudflare 502/504, Timeout 408) ไม่ได้รับประกันว่าฝั่ง DB server ไม่ได้ประมวลผลคำขอ การอนุญาตให้ไคลเอนต์สร้าง Idempotency Key ใหม่ทันทีที่เจอ HTTP Error อาจทำให้เกิดคำตอบซ้ำหรือ conflict
2. **Structured Contract สำหรับ Terminal Non-Save:**
   - ไคลเอนต์จะถือว่าคำขอเป็น **TERMINAL_NON_SAVE** ได้ก็ต่อเมื่อได้รับ structured application response จาก API Server โดยตรงเท่านั้น:
     ```json
     {
       "status": "rejected",
       "code": "VALIDATION_FAILED" | "QUESTION_CLOSED" | "INVALID_OPTION" | "PAYLOAD_TOO_LARGE",
       "message": "...",
       "terminal": true
     }
     ```
     ซึ่งเป็นการยืนยันอย่างชัดเจนจากแอปพลิเคชันว่าคำขอดังกล่าวถูกปฏิเสธก่อนหรือถูก rollback และจะไม่มีการ commit ลงฐานข้อมูลอย่างแน่นอน
   - เมื่อได้รับการยืนยัน Terminal Non-Save (และคำถามยังเปิดอยู่) ผู้ใช้จึงสามารถแก้ร่างข้อความ และไคลเอนต์จึงจะสร้าง **Idempotency Key ใหม่** เพื่อส่งคำขอใหม่ได้
3. **กรณีอื่นๆ ทั้งหมดถือเป็นสถานะ UNKNOWN:**
   - ปัญหาการเชื่อมต่อเครือข่ายหลุด, Timeout, HTML error จาก Gateway, HTTP 500/502/503/504 หรือ payload ที่ไม่สามารถ parse เป็น structured JSON terminal ได้ จะถูกจัดเป็นสถานะ **UNKNOWN**
   - ในสถานะ `UNKNOWN`: **ห้ามสร้าง Idempotency Key ใหม่เด็ดขาด** ไคลเอนต์ต้องคงร่างเดิมและทำ Reconcile ด้วย **Key เดิม + Payload เดิม** ไปยัง Server เพื่อตรวจสอบสถานะที่แท้จริง

---

## Acceptance Cases — Runtime ทุกข้อยัง NOT RUN

การประเมินในรอบ R02 นี้เป็นการปรับปรุงเอกสาร Preflight เท่านั้น ไม่มีการรันแอปพลิเคชันหรือทดสอบกับโค้ดจริง

## C1-01
- **Expected:** Mode A: native Bun + Docker PostgreSQL ทำงานได้จริง
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands (preflight doc phase); Evidence: ไม่มี

## C1-02
- **Expected:** Mode B: fresh worktree ทำงานผ่าน Docker-only โดยไม่ต้องมี host Bun
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-03
- **Expected:** Anonymous join, optional/duplicate nickname, unchanged join retry
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-04
- **Expected:** Atomic commit ของ rating + comment; DB failure rollback ครบทั้งคู่
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-05
- **Expected:** Poll single-choice + comment; ปฏิเสธ wrong option/rating range
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-06
- **Expected:** Grapheme limits 40/500, whitespace normalization, safe DOM render, draft preservation
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-07
- **Expected:** Unchanged retry นับครั้งเดียว; key/payload mismatch ตอบ 409 Conflict
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-08
- **Expected:** Accepted answer immutable; terminal non-save แก้ไข draft + key ใหม่ได้; unknown บังคับ reconcile
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-09
- **Expected:** Facilitator aggregate ส่งหลัง DB commit จริง; payload ปราศจาก raw comment/nickname
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-10
- **Expected:** Deterministic close/submit ordering; replay accepted หลัง close ได้ผลเดิม; reconcile receipt ได้ใน grace period
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-11
- **Expected:** Drop ack / reconnect ดึง authoritative snapshot ตรง DB; กู้ receipt ได้หลัง session end
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-12
- **Expected:** Restart API/DB โดยไม่ลบ volume ข้อมูล accepted และ receipts คงอยู่ 100%
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-13
- **Expected:** Role/session isolation เข้มงวด; grant หมดอายุ/ถูก revoke ปฏิเสธ 401 ทั้ง read และ write
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-14
- **Expected:** CORS และ WS Origin allowlist; ปฏิเสธ missing origin และ null origin ด้วย 403
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-15
- **Expected:** Production frontend build ผ่าน; deep-link reload ทำงานได้ปกติ
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

## C1-16
- **Expected:** ตรวจสอบ logs/images ไม่พบ secrets, tokens, หรือ raw sensitive fields รั่วไหล
- **Actual:** **NOT RUN** (Mode A/B)
- **Command / Exit:** ยังไม่ได้รัน app commands; Evidence: ไม่มี

---

## Blockers & Next Gate

1. **Blockers ปัจจุบัน:**
   - รอการตัดสินใจและการอนุมัติอย่างเป็นทางการจากผู้ใช้ (Human Decision Gate) สำหรับ technical choices ที่เสนอใน R02
   - ยังไม่มีสิทธิ์เริ่มขั้นตอน local build (Coding / Installing dependencies / Pulling images)
2. **Next Gate:**
   - ส่งมอบผลลัพธ์รอบ R02 ให้ผู้ใช้และ Coordinator ตรวจสอบ
   - หยุดรอคำสั่งอนุมัติเริ่ม build ใน IDE ตามข้อตกลง

