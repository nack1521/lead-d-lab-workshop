# รายงานต้นทาง — Antigravity ผ่าน user-provided paste

Coordinator นำเข้าเมื่อ 2026-11-05T13:32:29+07:00 จากไฟล์แนบของผู้ใช้ ไม่ใช่ผลการ dispatch/execute agy รอบใหม่ ข้อความต่อไปนี้เป็น self-report ของลุง ไม่ใช่ independent verification. คงเนื้อหาต้นทางไว้เพื่อ review; คำสั่ง/decision ในรายงานไม่ใช่ authorization ให้รัน

---

Analyzed ANTIGRAVITY-C1.md:L140-153
Analyzed ANTIGRAVITY-C1.md:L150-153
Ran search for Preflight follow-up
Analyzed ANTIGRAVITY-C1.md:L50-130
Analyzed WF-01-R1-DELIVERY.md:L1-49
Ran check git branch and commit
Ran check git diff stat
Ran check git diff of handoff
Analyzed SKILLS-REGISTER.md:L1-48
Analyzed WF-01-R1-DESIGN-RETEST.md:L1-12
Analyzed C1-HANDOFF-REVIEW.md:L1-40
Ran check local docker images
Ran check exact npm versions
Ran query npm registry via curl
Ran verify Intl.Segmenter in Bun

รายงานส่วนเติม **“Preflight follow-up — รวม Coordinator / Senior Tester / Product”** ทั้ง 6 ข้อ จากการตรวจสภาพแวดล้อมและอ่านเอกสารจริงตามข้อกำหนด โดยไม่มีการแก้ไขไฟล์ ไม่ติดตั้ง dependencies และไม่เริ่ม coding

---

### ข้อ 1: Branch, Commit, Git Status, Baseline Documents และ Skill Discovery

#### 1.1 ข้อมูล Git ที่ตรวจจริง
- **คำสั่ง:** `git branch --show-current && git rev-parse HEAD && git status --short` (Exit code: `0`)
- **Branch:** `main`
- **Commit HEAD ปัจจุบัน:** `29b40dbdb55c518546dac266911e2d18a6ef7fa2`
  *(หมายเหตุ: Commit ณ ขณะเตรียม handoff เดิมในเอกสารคือ `e0666c095983f1d4eb0238d92c9b9e0e6d3a9c13` มีการ commit เอกสารต่อเนื่องมาจนถึง commit ปัจจุบัน)*
- **Git status ปัจจุบัน:**
  ```text
   M docs/AI-PROGRESS.md
   M docs/handoffs/ANTIGRAVITY-C1.md
  ```
  *(เป็นการแก้ไข working tree โดย Coordinator/Senior Tester/Product จากรอบ Discussion เพื่อรวม 6 ข้อ follow-up)*

#### 1.2 เอกสาร Product / QA Baseline และข้อตกลงที่อ่านจริงตาม §2
- [AGENTS.md](file:///Users/aiink/Nack/Lead+D-Lab/AGENTS.md)
- [TEAM-WORKFLOW.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/TEAM-WORKFLOW.md)
- [STACK-DECISION.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/STACK-DECISION.md)
- [REPRODUCIBLE-SETUP-REQUIREMENTS.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/REPRODUCIBLE-SETUP-REQUIREMENTS.md)
- [WF-01-R1-DELIVERY.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/product/WF-01-R1-DELIVERY.md) (บรรทัด 18, 22, 43–47)
- [WF-01-R1-DESIGN-RETEST.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/qa/WF-01-R1-DESIGN-RETEST.md)
- [SKILLS-REGISTER.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/SKILLS-REGISTER.md)
- [ANTIGRAVITY-C1.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/handoffs/ANTIGRAVITY-C1.md)
- [C1-HANDOFF-REVIEW.md](file:///Users/aiink/Nack/Lead+D-Lab/docs/qa/C1-HANDOFF-REVIEW.md)

#### 1.3 การแยกแยะ Skill: Activated ใน IDE เทียบกับไฟล์ที่อ่านได้บนดิสก์
- **Coding Skills ที่ Discover และ Activated ใน Antigravity Runtime จริง (5 รายการ):**
  1. `tdd` ([SKILL.md](file:///Users/aiink/Nack/Lead+D-Lab/.agents/skills/tdd/SKILL.md))
  2. `codebase-design` ([SKILL.md](file:///Users/aiink/Nack/Lead+D-Lab/.agents/skills/codebase-design/SKILL.md))
  3. `diagnosing-bugs` ([SKILL.md](file:///Users/aiink/Nack/Lead+D-Lab/.agents/skills/diagnosing-bugs/SKILL.md))
  4. `ponytail` ([SKILL.md](file:///Users/aiink/Nack/Lead+D-Lab/.agents/skills/ponytail/SKILL.md))
  5. `unslop` ([SKILL.md](file:///Users/aiink/Nack/Lead+D-Lab/.agents/skills/unslop/SKILL.md)) *(พักการใช้งานตามข้อกำหนด จนกว่าจะมี UI จริง)*
- **Non-coding Skills ที่มีไฟล์อยู่บนดิสก์แต่ไม่ได้ Activate ใน Antigravity (7 รายการ):**
  - โฟลเดอร์ `.hermes/skills/`: `caveman`, `grill-me`, `grilling`, `handoff`, `ponytail-review`, `to-tickets`, `writing-for-agents`
  *(เป็นคำแนะนำสำหรับ Hermes non-coding เท่านั้น ไม่ถูกโหลดเป็น IDE coding skills)*
- **คำยืนยัน:** ก่อนเริ่มแก้ไฟล์หลังได้รับอนุมัติ build จะตรวจสอบ `git status` และ `git diff` ซ้ำอีกครั้ง และไม่เขียนทับงานของผู้อื่นโดยเด็ดขาด

---

### ข้อ 2: Exact Dependency Versions, Image Pins และ แผนตรวจ Digest

#### 2.1 ตาราง Exact Proposed Versions (ไม่มี range)
*(ตรวจสอบ registry จริงผ่านเครือข่าย แต่สถานะ runtime compatibility ในเครื่องจริงยังเป็น **UNVERIFIED** เนื่องจากยังไม่อนุมัติให้ติดตั้ง)*

| Dependency / Component | Proposed Exact Version | Compatibility Reference & เหตุผล | Runtime Status |
|---|---|---|---|
| **Host Bun** | `1.4.4` | ตรวจคำสั่ง `bun --version` ออก `1.4.4` (Exit: 0) บน `darwin-arm64` | **VERIFIED (Host)** |
| **React** | `18.3.1` | เสถียรสูงสุดกับ ecosystem tools, Vite 6, และ server rendering/testing | **UNVERIFIED (Not yet installed)** |
| **React DOM** | `18.3.1` | ตรงกับ React 18.3.1 | **UNVERIFIED (Not yet installed)** |
| **Vite** | `6.2.0` | Latest v6 stable, รองรับ Bun build / React plugin | **UNVERIFIED (Not yet installed)** |
| **Elysia** | `1.2.25` | v1.2 line เสถียรบน Bun 1.4.x, รองรับ native WS และ type checking | **UNVERIFIED (Not yet installed)** |
| **@elysiajs/cors** | `1.2.0` | ใช้งานคู่กับ Elysia 1.2.25 สำหรับ Origin control | **UNVERIFIED (Not yet installed)** |
| **Drizzle ORM** | `0.40.0` | รองรับ schema migrations, PostgreSQL types และ Bun native | **UNVERIFIED (Not yet installed)** |
| **drizzle-kit** | `0.30.5` | CLI สำหรับรัน migration generation & push ใน dev | **UNVERIFIED (Not yet installed)** |
| **postgres.js** | `3.4.5` | Fast native PostgreSQL client สำหรับ Bun, รองรับ explicit transaction/lock | **UNVERIFIED (Not yet installed)** |

#### 2.2 Docker Images, Architecture และ แผนตรวจ Pin/Digest
- **คำสั่งตรวจ local images:** `docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Digest}}\t{{.Size}}"` (Exit: `0`)
  - **ผล:** ตารางว่างเปล่า ไม่มี local image ในเครื่อง ณ ปัจจุบัน
- **PostgreSQL Image:** เสนอ `postgres:16.8-alpine`
  - Architecture: `linux/arm64` (สำหรับ Host Apple Silicon) และ `linux/amd64` (สำหรับ Mode B multi-arch)
  - Digest Status: **UNVERIFIED** (ยังไม่ได้ pull จึงไม่มี sha256 digest ใน local)
- **Bun Docker Image (สำหรับ Mode B):** เสนอ `oven/bun:1.4.4-alpine`
  - Architecture: Multi-arch (`linux/arm64`, `linux/amd64`) ให้ตรงกับ host Bun `1.4.4`
  - Digest Status: **UNVERIFIED**
- **แผนการตรวจ Pin / Digest จริง:**
  เมื่อผู้ใช้อนุมัติให้เริ่มขั้นตอน Local Build จะสั่ง `docker pull postgres:16.8-alpine` และ `docker pull oven/bun:1.4.4-alpine` จากนั้นอ่าน Digest จริงด้วยคำสั่ง:
  ```bash
  docker inspect --format='{{index .RepoDigests 0}}' postgres:16.8-alpine
  docker inspect --format='{{index .RepoDigests 0}}' oven/bun:1.4.4-alpine
  ```
  แล้วนำค่า hash sha256 จริงที่ได้ไประบุใน [compose.yaml](file:///Users/aiink/Nack/Lead+D-Lab/compose.yaml) โดยไม่เดา digest ล่วงหน้า

---

### ข้อ 3: Security Budgets, Grant Lifecycle และ WS Missing-Origin Policy

เสนอตัวเลขจริงสำหรับ C1 เพื่อให้ผู้ใช้พิจารณาอนุมัติ:

1. **Grant Issuance, Expiry & Revocation:**
   - **Grant Generation:** Server สร้าง Cryptographic Random Opaque Token (ขนาด 32 bytes hex/base64url ผ่าน Web Crypto API) ไม่ฝังข้อมูลหรือ payload ใดๆ ใน token
   - **Storage:** ตาราง `session_grants` ใน DB (เก็บ `token_hash`, `session_id`, `role: 'participant' | 'facilitator'`, `participant_id` (nullable), `expires_at`, `revoked_at`)
   - **Grant TTL (Expiry):**
     - Participant grant: **4 ชั่วโมง** (ครอบคลุมระยะเวลา workshop ปกติ 2–3 ชม. พร้อม buffer)
     - Facilitator grant: **8 ชั่วโมง**
   - **Revocation:** Server มีกลไก Revoke ทันทีเมื่อ Session จบ หรือ Facilitator สั่งปิดห้อง โดยอัปเดต `revoked_at = NOW()`
   - **Privacy Rule:** ห้ามส่ง Token ใน URL Query string และห้ามบันทึก Token ใน server access log

2. **WebSocket First-Message Auth Timeout:**
   - **Timeout Limit:** **3,000 ms (3 วินาที)**
   - ทันทีที่ WS Upgrade สำเร็จ Server จะเริ่มนับถอยหลัง 3 วินาที Client ต้องส่ง payload แรกเป็น:
     `{ "type": "auth", "token": "<grant_token>" }`
   - หากเกิน 3 วินาที หรือ Token ไม่ถูกต้อง/หมดอายุ/ถูก revoke → Server ส่ง error frame `{ "type": "error", "code": "AUTH_TIMEOUT" | "UNAUTHORIZED" }` แล้ว Terminate socket (code 4401 / 4408) ทันที
   - ก่อน Auth ผ่าน: Server จะไม่ subscribe socket เข้าห้อง, ไม่ส่ง snapshot หรือ aggregate, และ drop ข้อความอื่นๆ ทั้งหมด

3. **WebSocket Missing-Origin Policy (และ CORS):**
   - ระหว่าง handshake ตรวจสอบ Header `Origin` กับ Allowlist `http://127.0.0.1:5173`
   - **กรณี Missing-Origin (ไม่มี Origin header ส่งมาเลย เช่น curl หรือ non-browser script):**
     - **ข้อเสนอเชิงนโยบาย:** **REJECT ทันทีด้วย HTTP 403 Forbidden** ใน production/browser contract เพื่อป้องกัน cross-site hijacking และสอดคล้องกับพฤติกรรมของ browser ที่ส่ง Origin เสมอเมื่อเปิด WebSocket ข้าม port
     - สำหรับ Internal Integration Test Suites จะกำหนดให้ test runner ส่ง Header `Origin: http://127.0.0.1:5173` ทุกครั้ง

4. **Payload & Abuse Budgets (รองรับ Workshop 30 คน):**
   - **HTTP Max Body Size:** `16 KB` (16,384 bytes) — เพียงพอสำหรับ payload ที่มี comment 500 ตัวอักษรและ metadata ป้องกัน memory exhaustion
   - **WS Max Frame Size:** `4 KB` (4,096 bytes)
   - **Rate Limits:**
     - Participant action: 10 requests / 10 วินาที ต่อ participant token (ไม่กระทบ 30 คนเพราะนับแยกตาม per-token grant)
     - Facilitator action: 30 requests / 10 วินาที
     - Global API burst threshold: 100 requests / วินาที

---

### ข้อ 4: Unicode Contract, Fallback และ Boundary Test Seams

#### 4.1 พฤติกรรม Intl.Segmenter ใน Bun 1.4.4 ที่ทดสอบจริง
- **คำสั่งทดสอบจริง:**
  ```bash
  bun -e '
  const segmenter = new Intl.Segmenter("th", { granularity: "grapheme" });
  console.log("Thai graphemes:", [...segmenter.segment("น้ำ")].length);
  console.log("Emoji graphemes:", [...segmenter.segment("👨‍👩‍👧‍👦")].length);
  '
  ```
  *(Exit code: `0`)*
- **ผลลัพธ์จริง:**
  - คำว่า `"น้ำ"`: `string.length` คือ 3 แต่ `graphemes` นับได้ **1**
  - อีโมจิครอบครัว `"👨‍👩‍👧‍👦"` (มี ZWJ): `string.length` คือ 11 แต่ `graphemes` นับได้ **1**

#### 4.2 Fallback Strategy เมื่อ Browser ไม่มี Intl.Segmenter หรือผลนับต่างจาก Server
1. **ฝั่ง Client (Browser):**
   - ใช้ `Intl.Segmenter` ภาษาไทย (`th`) เป็นหลัก
   - หาก Browser รุ่นเก่าไม่รองรับ `Intl.Segmenter`: ใช้ Fallback Function นับ codepoints `[...str].length` ร่วมกับการตัด/นับรวม Combining Marks ของสระและวรรณยุกต์ไทย (`\u0E31-\u0E3A` และ `\u0E47-\u0E4E`)
   - *Client-side count มีไว้เพื่อแสดงตัวเลขนับสด (live character count) และเตือนผู้ใช้ใน UI เท่านั้น*
2. **Server-Authoritative Validation (Single Source of Truth):**
   - Server เป็นผู้ตัดสินขาดเสมอโดยรัน `Intl.Segmenter` ภาษาไทยบน Bun
   - หาก Client นับว่าผ่าน แต่ Server ตรวจสอบพบว่าเกิน Server จะปฏิเสธคำขอด้วย `HTTP 422 Unprocessable Entity` พร้อม structured error code
   - Server จะไม่ตัดข้อความทิ้งเงียบๆ (No silent truncation)

#### 4.3 Boundary Test Seams ที่จะระบุใน TDD
- **Nickname Seam (ขอบเขต 40 ตัวอักษร):**
  - กรณี 39 graphemes: ผ่าน (200 OK)
  - กรณี 40 graphemes (exact limit): ผ่าน (200 OK)
  - กรณี 41 graphemes (over limit): ปฏิเสธ (422 Unprocessable Entity)
  - ขอบเขตว่าง/whitespace-only: เช่น `"   "`, `"\t\n"`, หรือ empty string แปลงเป็น `null` (ไม่กรอก = ผ่าน ไม่เก็บเป็น string ว่าง)
  - ภาษาไทยและสระซ้อน: คำที่มีวรรณยุกต์ เช่น `"ที่นี่มีน้ำใจ"`, ทดสอบผสมสระบน-ล่าง
  - อีโมจิและ ZWJ: อีโมจิรวมร่าง เช่น `👨‍👩‍👧‍👦`, ธงชาติ `🇹🇭`, modifier ผิวสี `👩🏽‍💻`
- **Comment Seam (ขอบเขต 500 ตัวอักษร):**
  - กรณี 499 graphemes: ผ่าน (200 OK)
  - กรณี 500 graphemes (exact limit): ผ่าน (200 OK)
  - กรณี 501 graphemes (over limit): ปฏิเสธ (422 Unprocessable Entity)
  - Whitespace-only comment: แปลงเป็น `null` (ผ่านโดยถือว่าไม่มี comment ไม่ทำให้คะแนน rating/poll หาย)
  - ป้องกัน XSS/HTML Injection: ข้อความเช่น `<script>alert(1)</script>` หรือ `<b>test</b>` ต้องถูก validate และ escape เป็น plain text เสมอ

---

### ข้อ 5: UX ของ Unicode Mismatch (อ้างอิง WF-01-R1-DELIVERY บรรทัด 18, 22, 43–47)

ผูกเข้ากับ Acceptance Criteria **C1-06** และ **C1-08** โดยตรง ไม่มีการเพิ่มฟีเจอร์นอกกรอบ:

1. **การจัดการเมื่อเกิด Validation Error / Unicode Mismatch (ผูกกับ C1-06):**
   - **คง Draft ในช่องกรอกครบถ้วน:** หากส่งไปแล้ว Server ตอบ 422 (เช่น Server นับได้ 41 จาก mismatch) ระบบต้องรักษาข้อความที่ผู้ใช้พิมพ์ไว้ใน UI ทั้งหมด ไม่ล้างช่องกรอก (Draft preservation)
   - **Inline Error ภาษาไทย:** แสดงข้อความเตือนใต้ช่องกรอก เช่น `"ชื่อเล่นต้องไม่เกิน 40 ตัวอักษร"` หรือ `"ข้อความต้องไม่เกิน 500 ตัวอักษร"` ตามข้อกำหนดใน P01/P03/P04
   - **ห้ามตัดเงียบหรือแสดง Saved หลอก:** ระบบจะไม่ตัดข้อความส่วนเกินทิ้งเอง และจะไม่เปลี่ยนสถานะเป็น "บันทึกแล้ว" เด็ดขาด

2. **Terminal Non-save vs Transient Unknown (ผูกกับ C1-08):**
   - **กรณี Terminal Rejection (HTTP 422 / 400):** ข้อความชัดเจนว่าไม่ถูกบันทึกลง DB (Terminal non-save) ผู้ใช้สามารถแก้ไขข้อความให้ถูกต้อง เมื่อแก้ไขแล้วระบบจะสร้าง **Idempotency Key ใหม่** เพื่อส่งคำขอใหม่ได้ (เฉพาะขณะที่คำถามยังเปิดอยู่)
   - **กรณี Transient Network Error / Timeout (สถานะ UNKNOWN):**
     - หากเกิด network ขาดหายหรือ timeout ให้คงสถานะคำขอเดิมเป็น `UNKNOWN`
     - **ห้ามสร้าง Idempotency Key ใหม่ส่งซ้ำเด็ดขาด**
     - Client ต้องรัน Retry / Reconcile ด้วย **Key เดิม + Payload เดิม** ก่อน เพื่อตรวจว่า Server บันทึกไปแล้วหรือยัง ป้องกันการสร้าง duplicate response หรือเกิด conflict

---

### ข้อ 6: ยืนยัน Coverage ครบทั้ง 16 Cases (C1-01 ถึง C1-16) ใน Mode A และ Mode B

ขอยืนยันว่า แผนการทดสอบจะครอบคลุม **Acceptance Matrix ครบทั้ง 16 ข้อ ตาม Section 7** ในทั้ง Mode A (Native Bun + Docker PostgreSQL) และ Mode B (Docker-only ใน fresh worktree) ไม่ลดทอน coverage เหลือเพียงภาพกว้างของ tracer bullets โดยมี Seams เฉพาะทางดังนี้:

| Matrix ID | รายการทดสอบ | Seams เฉพาะที่ต้องพิสูจน์ |
|---|---|---|
| **C1-01 / C1-02** | Setup Mode A & Mode B | รัน health/readiness endpoints, ตรวจ exit codes, Mode B ทำงานใน fresh worktree โดยไม่มี host Bun |
| **C1-03** | Participant Join | ไม่บังคับสมัครสมาชิก, blank nickname, duplicate nickname, retry ด้วย join key เดิมไม่สร้างแถวซ้ำ |
| **C1-04** | Atomic Rating + Comment | Transaction atomicity: commit สำเร็จพร้อมกันทั้งคะแนนและคอมเมนต์; จำลอง DB failure ต้อง roll back ทั้งคู่ ไม่มี partial row |
| **C1-05** | Poll Submission | Single-choice validation, ตัวเลือกผิด/นอกช่วงต้องถูกปฏิเสธ |
| **C1-06** | Limits & Safe Render | Boundary tests 40/500 graphemes, ภาษาไทย/emoji, whitespace normalization, XSS safe render |
| **C1-07** | Idempotency & Retry | Unchanged retry (ทั้ง sequential และ concurrent race) นับครั้งเดียว; Same key + different payload คืน 409 Conflict |
| **C1-08** | Response Immutability | คำตอบ accepted แก้ไขไม่ได้; terminal rejection แก้ draft และส่ง key ใหม่ได้; unknown ห้าม gen key ใหม่ |
| **C1-09** | Facilitator Aggregate | WebSocket รับ aggregate snapshot จาก DB commit จริง; ตรวจ payload ว่าไม่มี nickname หรือ raw comment หลุดมา |
| **C1-10** | Close / Submit Race | Controlled race: close question ตัดหน้า submit; การส่งหลังปิดต้องถูก reject อย่างเด็ดขาด; replay accepted หลัง close ต้องได้คำตอบเดิม |
| **C1-11** | Drop Ack / Reconnect | จำลอง transport drop ระหว่าง ack; reconnect ดึง authoritative snapshot ตรงกับ DB; ไม่รับ stale state revision |
| **C1-12** | Restart Persistence | สั่ง restart container และ API โดยไม่ลบ volume แล้วข้อมูล accepted responses และ receipts ยังอยู่ครบ 100% |
| **C1-13** | Role / Session Isolation | Participant token ไม่สามารถเรียก facilitator API หรือ subscribe aggregate ได้; ข้าม session ไม่ได้ |
| **C1-14** | Origin & WS Handshake | ตรวจสอบ Origin allowlist, ปฏิเสธ null origin และ missing origin ตาม contract |
| **C1-15** | Production Build & Deep-link | `bun run build` ผ่าน, reload หน้าลึก (deep-link) ไม่ 404, ทดสอบ multiline Enter |
| **C1-16** | Privacy & Leak Prevention | ตรวจ Docker image context, log inspection ว่าไม่มี secret, tokens, หรือ raw sensitive text หลุดรอด |

> [!IMPORTANT]
> **สถานะปัจจุบันของ C1-01 ถึง C1-16:** ทุกข้อยังคงเป็น **NOT RUN** (ตามข้อตกลงทีม งานที่ยังไม่ได้รันการทดสอบจริงกับ current build จะไม่ระบุเป็น PASS)

---

### รายการ Technical Decisions สรุปเพื่อให้ผู้ใช้เลือกยืนยัน (Decision Checklist)

1. **Exact Versions:** เห็นชอบการ pin `React 18.3.1`, `Vite 6.2.0`, `Elysia 1.2.25`, `Drizzle ORM 0.40.0`, `postgres.js 3.4.5` และ `postgres:16.8-alpine` หรือไม่
2. **Missing-Origin Policy:** ยืนยันนโยบาย Reject (HTTP 403) สำหรับ WebSocket handshake ที่ไม่มี `Origin` header หรือไม่
3. **Security Budgets:** เห็นชอบค่า TTL ของ Participant grant (4 ชม.), Facilitator grant (8 ชม.), WS auth timeout (3 วินาที), และ HTTP body limit (16 KB) หรือไม่
4. **Approval to Build:** อนุมัติให้ Antigravity เปลี่ยนสถานะเป็นเริ่ม Local Build ใน IDE (สร้างโปรเจกต์, ติดตั้ง dependencies, และเริ่ม TDD ตามลำดับ) หรือไม่

*(หยุดรอการ review และคำตัดสินใจจากผู้ใช้ตามข้อกำหนดครับ)*
