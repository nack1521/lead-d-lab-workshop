# Architecture options — C0 research / ยังไม่ใช่ ADR ที่อนุมัติ

วันที่ค้นคว้า: 2026-11-04 (+07) ข้อสรุปมาจากเอกสารทางการ ไม่ใช่ผล performance/compatibility test ของแอปนี้
ผู้ใช้ให้เดินหน้า React บน Cloudflare ถ้าไม่มีปัญหา และสนใจ Elysia + Bun; ยังไม่เลือก backend/DB/deployment และยังไม่อนุมัติสร้าง cloud resources

## Executive recommendation
- Frontend: React + TypeScript + Vite บน Cloudflare Workers Static Assets (Cloudflare Pages ก็เป็นทางเลือก) ทำ SPA routing และแยก API/WS path ไม่ให้ตกเป็น index.html
- ถ้าต้องการ **Bun runtime จริงและลอง Elysia**: Elysia + Bun ใน Docker บน Railway, PostgreSQL พร้อม persistent volume ใน region ใกล้ backend, WebSocket ที่ Bun ให้มา เริ่มหนึ่ง replica
- ถ้าต้องการ **Cloudflare-native และชิ้นส่วนน้อย**: Workers + Hono/Fetch API + D1 + Durable Objects/WebSocket; ใช้ Bun เป็นเครื่องมือ local ได้ แต่ production ไม่ใช่ Bun runtime
- ไม่ต้องเพิ่ม Redis หรือ BullMQ ใน MVP ปัจจุบันโดยไม่มี use case; ให้บันทึกฐานข้อมูลก่อนประกาศ success และ broadcast
- หากต้องการ Elysia บน Workers: adapter ระบุ experimental ต้องให้ Antigravity ทำ compatibility spike ก่อนเลือก และห้ามถือว่า Bun APIs/Elysia.ws ใช้แทน Durable Objects ได้โดยตรง

## 1. Deployment options

### A — Elysia/Bun จริง + Cloudflare frontend (แนะนำเมื่อยึดความสนใจ Bun)
Browser → Cloudflare React static assets
Browser → HTTPS/WSS → Railway Elysia/Bun (1 replica) → PostgreSQL (private network, same region)
ตัวเลือก same-origin: Browser → Cloudflare Worker `/api/*`, `/ws` → Railway origin; static assets อยู่ hostname เดียวกัน

Tooling: Bun (pin exact version + lockfile), Docker/official oven/bun image, Wrangler สำหรับ frontend/proxy, Railway dashboard หรือ CLI สำหรับ backend/Postgres, database migration tool เช่น Drizzle Kit (เลือกหลังทดสอบ), GitHub integration/CI หลังอนุมัติ
Railway เอกสาร Bun ระบุให้ใช้ Dockerfile อย่าสมมติ build autodetection จาก package manager; Dockerfile/CI เป็นงาน Antigravity
Backend ต้อง bind 0.0.0.0 และ PORT ที่ host กำหนด, มี liveness/readiness, graceful termination, TLS ที่ ingress, app sleep ปิดระหว่าง workshop
DB ไม่อยู่บน ephemeral app filesystem; ติด persistent volume และทดสอบ backup/restore ไม่ถือว่าการเพิ่ม Postgres service = มี managed backup ครบแล้ว
ข้อแลกเปลี่ยน: ดูแลสอง providers, ค่า backend/DB/egress, secret management, CORS หรือ proxy, DB network latency; ไม่รับรอง free tier โดยไม่ตรวจ account/plan
หนึ่ง replica เป็น deployment constraint: Bun in-process pub/sub ไม่ข้าม replica/cluster. Rolling deploy อาจเกิด overlap; หลีกเลี่ยง deploy ขณะ workshop และทำ version reconciliation/reconnect แม้เริ่ม instance เดียว
หากต้องการหลาย replica: เพิ่ม cross-instance fanout (Redis Pub/Sub + snapshot recovery หรือ durable event mechanism), ไม่ใช้ sticky sessions แทนการ sync ทั้งห้อง

### B — Cloudflare-native (แนะนำเมื่อยึด Cloudflare สูงสุด)
Browser → Worker Static Assets (React)
Browser → Worker API (Hono หรือ Fetch API) → Durable Object ราย session → D1
Browser ⇄ Durable Object WebSocket
HR → Worker read API → D1

Tooling: Wrangler, Cloudflare Vite plugin, Workers bindings, D1 migrations, Durable Object migration declarations, Cloudflare dashboard/logs
API/WS/static ใช้ hostname เดียวกันได้ ลด cross-origin complexity; secret เก็บ Workers Secrets; D1/DO binding ไม่ใช่ browser credentials
เลือก D1 เป็น authoritative persisted session/questions/responses. DO เป็น coordinator/fanout ไม่ใช่ฐานข้อมูลเงาของคะแนนอีกชุด
การ close/submit ทุกช่องทางผ่าน coordinator เดียวและ DB checks/atomic operations; DO มี async interleaving ได้ อย่าอ้างว่าไม่มี race เพียงเพราะมี DO
หลัง commit บันทึก version แล้วค่อย broadcast; หาก publish ขาด ให้ resync snapshot/version จากข้อมูลที่ commit แล้ว
หากใช้ read replicas ต้องอ่าน snapshot แบบ consistency/session ที่เหมาะสมหลังเขียน ไม่รับประกัน read-your-writes โดยไม่มี design
ข้อแลกเปลี่ยน: Workers ไม่ใช่ Bun; ใช้ Workers-compatible dependencies, DB SQLite semantics และ platform bindings; ต้องทดสอบ hibernation/reconstruction ไม่เก็บ state สำคัญเฉพาะ memory

### C — Elysia/Bun ภายใน Cloudflare Containers (เป็นไปได้ แต่ยังไม่แนะนำรอบแรก)
React/Worker → Cloudflare Container ที่มี Bun/Elysia → persistent DB ภายนอก หรือเชื่อม D1 ผ่าน Worker bridge ที่ออกแบบและพิสูจน์แล้ว
Containers รองรับ runtime/ภาษาอื่นจริง และต้องใช้ Workers Paid plan ตามเอกสารปัจจุบัน
Tooling: Docker image + Wrangler + Worker/container routing + lifecycle/health/instance policies; เพิ่ม cold-start, placement, instance lifecycle และ persistent storage design
ไม่เอา PostgreSQL/Redis authoritative data ไว้บน container disk โดยสมมติว่าถาวร; ไม่ถือว่า D1 binding ใช้ใน Bun container ได้เหมือนใน Worker
ทางนี้ตอบโจทย์ Cloudflare+Bun แต่ complexity สูงกว่า A สำหรับ workshop MVP ต้อง spike runtime/network/WS/restart และตรวจราคา/account access ก่อน

## 2. Elysia + Bun limitations
- TypeScript end-to-end และ validation/schema เป็นจุดน่าสนใจสำหรับคนถนัด React/NestJS แต่ Elysia ไม่ได้มี NestJS DI/modules/guards แบบเดียวกัน ต้องตั้ง convention ให้พอดี MVP
- HTTP request handling และ WebSocket บน Bun มี API ที่เหมาะกับ runtime นี้; portability ไป Workers/Node ไม่อัตโนมัติ
- Elysia Cloudflare adapter ยังระบุ experimental; limitations ที่ docs ระบุ: Elysia.file/static plugin และ OpenAPI type generation บางส่วน, Response creation ก่อน runtime start และ inline route values
- Plugin compatibility สำคัญกว่าชื่อ framework: auth, DB driver, migration, telemetry และ tests ต้องทดสอบบน runtime ที่ deploy จริง
- ไม่อ้าง speed จาก benchmark ของ framework ว่าแอปนี้เร็วแล้ว; สำหรับ 30 users correctness/recovery และ DB latency สำคัญมาก
- Event loop ยังถูก CPU-bound task บล็อกได้; AI/report generation ยาวไม่ควรอยู่ใน vote request
- Bun websocket ไม่ใช่ Socket.IO protocol; React ใช้ native WebSocket หรือ client ที่ตรง protocol ห้ามติด Socket.IO client แล้วสมมติว่าเข้ากัน

## 3. Database proposal
### A: PostgreSQL + Drizzle (proposal)
เหมาะกับ relational session/question/response, constraints, transactions และ SQL aggregation. ใช้ connection pool ที่จำกัดและ DB ใกล้ backend; TLS สำหรับ public DB connections; migrations ใช้ privileged credential แยกจาก runtime ตามสมควร
### B: D1 + prepared SQL/Drizzle SQLite dialect (proposal)
เหมาะเมื่ออยู่ Workers; SQL semantics ของ SQLite. อย่าใช้ Postgres-specific SQL/migration โดยไม่แปลง; D1 ไม่ควรกลายเป็น HTTP dependency ที่อ้อมสำหรับ Bun โดยไม่มีเหตุผล

### Logical schema — ไม่มี migration code ใน C0
| Entity | Fields/constraints หลัก | หมายเหตุ |
|---|---|---|
| workshop_sessions | id, title, join_code unique, status, active_question_id, state_version, created_at, closed_at | join code ไม่ใช่ facilitator credential; state transitions ตรวจฝั่ง server |
| questions | id, session_id FK, position, type, prompt, dimension, config, status | เริ่ม rating + single-choice; config validate ตาม type |
| question_options | id, question_id FK, label, position | ป้องกันเลือก option ของคำถามอื่น |
| participants | id, session_id FK, token_hash, joined_at | anonymous-style device identity ไม่ใช่ account; ไม่เก็บชื่อ/อีเมลโดยไม่จำเป็น |
| responses | id, session_id, question_id, participant_id, rating_value หรือ option_id, submission_id, created_at | unique(question_id, participant_id), unique submission key ตามขอบเขต; enforce session relationships และ type-specific value |
| access_grants | id, session_id, role facilitator/HR, credential_hash, expires_at | role/session-scoped, rotate/revoke; secret ไม่ไป public repo |

เชิง implementation ต้องยืนยัน FKs/constraints ข้าม session, rating range และ option ownership; application validation อย่างเดียวไม่พอสำหรับ duplicate/concurrency
นโยบายเสนอ: หนึ่งคำตอบต่อคนต่อคำถามและ retry ด้วย submission_id เดิมไม่เพิ่มคะแนน; จะอนุญาตแก้คำตอบหรือไม่รอ user decision
Postgres: close และ submit lock session row เดียวกันใน transaction; ตรวจ active question/status, persist response, update state_version แล้ว commit. ห้าม check-then-write แยก transaction
D1: ใช้ conditional writes/atomic batch ที่พิสูจน์ได้ร่วมกับ session coordinator; ห้ามยก Postgres row locking มาใช้ตรง ๆ
ยังไม่ต้องมี organisations/accounts/permissions framework เต็มระบบ; scope session ให้แข็งแรงและเตรียมเพิ่ม organisations เมื่อมี requirement จริง

### HR insights
Coverage = จำนวนผู้ตอบ unique ต่อคำถาม / จำนวนผู้เข้าร่วมใน denominator ที่นิยามชัด; missing ไม่ใช่ score 0
Strengths/gaps = ค่าเฉลี่ยและการกระจาย rating ที่มีจำนวนผู้ตอบกำกับ; blockers = counts/percent ของ poll
แสดงว่าเป็น self-report ใน workshop ไม่ใช่เครื่องมือวินิจฉัยหรือ performance ranking; ระงับ small-group drilldown และไม่ให้ raw individual responses เกิน scope ที่อนุมัติ

## 4. Realtime และ Redis
Redis เป็น in-memory datastore ที่ตั้ง persistence ได้ แต่ **Redis ไม่ใช่ช่องทางส่งข้อมูลเข้าหน้าจอ browser โดยตัวมันเอง** ยังต้องมี WebSocket/SSE server
Redis Pub/Sub เป็น at-most-once: subscriber หลุดแล้ว message นั้นหาย ไม่มี replay. ห้ามใช้เป็น source of truth ของคำตอบหรือหลักฐานว่าบันทึกแล้ว

MVP A: POST vote → validate/auth → DB transaction commit → ack → Bun WebSocket broadcast aggregate/version. Client reconnect รับ snapshot ล่าสุด. Memory เก็บ connection/presence แบบชั่วคราวได้
MVP B: API → session DO → DB commit → DO broadcast. Restore state หลัง hibernation/restart จาก persistence; ไม่ถือ memory เป็น authority
ทุกทางต้องมี resync เมื่อ version gap, reconnect, tab resume และ bounded periodic reconciliation เพื่อซ่อมกรณี commit สำเร็จแต่ broadcast พลาดโดย socket ยังไม่หลุด
Client ไม่ควรเพิ่ม counter แบบ blind ทุก event; ใช้ versioned snapshot/aggregate หรือ event deduplication. Pending/unknown ต่างจาก saved

เพิ่ม Redis เมื่อมีหลาย API replicas, shared rate-limit/presence หรือวัดพบว่า cache จำเป็น; cache ต้อง rebuild จาก SQL ได้และ TTL/invalidation ชัด
แม้ใช้ Redis ก็ต้องแก้ dual-write DB+publish failure; ใช้ snapshot reconciliation สำหรับ MVP หรือ transactional outbox+durable consumer เมื่อมี delivery guarantee ที่แรงขึ้นจริง
Redis credentials อยู่ server เท่านั้น, network private/TLS, ไม่ให้ frontend ต่อ Redis โดยตรง

## 5. Queue และ BullMQ
**ไม่จำเป็นสำหรับ live vote/แสดงผลสด** และไม่ควร enqueue แล้วโชว์ saved ก่อน durable acceptance
เริ่มใช้ queue เมื่อมี AI summarisation, email, file export, scheduled retry หรือ long-running report ที่ผู้ใช้อนุมัติ

- Bun/container: BullMQ เป็นตัวเลือก แต่ต้องเลือก backend/client adapter/version ให้ตรงจริง. Redis backend ต้องรองรับ blocking commands/duplicate connections และ persistence; HTTP-only Redis endpoint ไม่ใช่ drop-in replacement
- แยก worker process จาก API, ใช้ retries/backoff/dead-letter/observability, จำกัด concurrency, job idempotency และ graceful shutdown
- Redis ที่เก็บ queue ต้อง noeviction และ persistence ตาม BullMQ docs; ไม่ปน cache ที่ตั้ง eviction โดยไม่มี isolation
- Cloudflare: Queues consumer Worker เป็นตัวเลือก native; ไม่ย้าย BullMQ long-running polling worker เข้า request Worker โดยสมมติว่ารันถาวรได้
- Cloudflare Queues เป็น at-least-once; consumer ต้อง deduplicate, ไม่สมมติ exactly-once/order สำหรับ vote
- ข้อจำกัดจาก docs ที่ตรวจ: message 128 KB, consumer wall clock 15 นาที, configurable retention ถึง 14 วัน (Free 24 ชั่วโมง), batch/retry/throughput มีขอบเขต; ตรวจอีกครั้งกับแผนจริงก่อน provisioning

## 6. CORS, cookies, WebSocket และ security
### Cross-origin แบบ direct (Cloudflare frontend → Railway API)
- ใช้ exact origin allowlist พร้อม scheme+host+port ทั้ง production และ local. Origin ไม่มี path. ไม่อนุญาต *.pages.dev หรือทุก preview แบบกว้าง
- OPTIONS preflight ต้องตอบ methods/headers ที่ใช้จริง เช่น Content-Type, Authorization, Idempotency-Key; ไม่ redirect ไป login ก่อนตอบ preflight
- Credentialed requests ห้าม Access-Control-Allow-Origin: *; ใช้ origin ที่อนุญาต + Access-Control-Allow-Credentials เมื่อจำเป็น และ Vary: Origin เมื่อ response เปลี่ยนตาม Origin
- อย่าใช้ Elysia cors() defaults โดยไม่ตรวจ; docs ระบุ permissive defaults. Authentication/authorization ต้องตรวจ server เสมอ เพราะ CORS ไม่บล็อก curl/attacker server
- API error responses ต้องมี CORS headers ตาม policy เช่นกัน มิฉะนั้น browser เห็นเพียง CORS error กลบสาเหตุจริง
- Cookie ข้าม pages.dev/railway.app เป็น cross-site; SameSite=None; Secure ยังอาจถูก browser third-party policy บล็อก. เลือก same-origin proxy หรือออกแบบ token flow ไม่ใช่ปิด browser security

### Same-origin ที่แนะนำถ้าทำ proxy
Cloudflare Worker เสิร์ฟ React และ proxy เฉพาะ `/api/*` กับ `/ws` ไป fixed backend origin; ห้าม open proxy รับ arbitrary URL
Browser ใช้ HTTPS/WSS hostname เดียวกัน, auth cookie HttpOnly/Secure/SameSite เหมาะสม; mutating routes ตรวจ CSRF/Origin ตาม threat model
Proxy ต้อง preserve status/Set-Cookie/WS upgrade อย่างถูกต้อง, ห้าม cache authenticated API/session data, ใช้ secret ป้องกัน origin bypass ถ้าจำเป็น. Cloudflare และ Railway ค่า origin/forwarded headers ต้องตรวจเฉพาะ trusted proxy
ข้อดีลด cross-origin และ third-party cookies; ข้อเสีย extra hop/config และต้องทดสอบ WebSocket upgrade end-to-end ไม่ถือว่าทำแล้วใน C0

### WebSocket ไม่ได้ปลอดภัยด้วย CORS plugin
- ตรวจ Origin ใน HTTP upgrade แยกจาก HTTP CORS; policy missing/null ต้องชัด (browser app ปฏิเสธได้; non-browser clients ต้องมี auth ตาม contract)
- Authenticate ก่อน subscribe และ authorize session/role ทุก privileged action; Origin เพียงอย่างเดียวปลอมได้จาก non-browser client
- Browser WebSocket ไม่ส่ง arbitrary Authorization header แบบ fetch. เลือก same-origin cookie หรือ short-lived one-use WS ticket จาก authenticated API; ไม่ใส่ long-lived bearer ใน query/logs
- ใช้ WSS จากหน้า HTTPS, heartbeat/reconnect backoff+jitter, payload size limits และ backpressure
- Rate limit ไม่ใช้ IP อย่างเดียวจนผู้เข้าร่วมทั้งห้องหลัง NAT ถูกบล็อกพร้อมกัน; ผสม participant/session budget และป้องกัน join-code brute force
- CSP connect-src ต้องรวม API/WSS ที่อนุญาต; output encoding กัน XSS, input validation ฝั่ง server, sensitive routes Cache-Control: no-store, redacted logs

## 7. Environment/config inventory (ยังไม่สร้าง credentials)
| ค่า | ประเภท/ตำแหน่ง |
|---|---|
| PUBLIC_APP_URL, ALLOWED_ORIGINS | server config ไม่ใช่ secret |
| PORT, NODE_ENV | Bun/container runtime config |
| DATABASE_URL | server secret สำหรับ Postgres ไม่ใช่ VITE_* |
| AUTH_SECRET / credential hashing material | server secret ที่สร้างภายหลัง ไม่เขียนค่าในเอกสาร |
| BACKEND_ORIGIN | Cloudflare proxy configuration, fixed allowlisted origin |
| ORIGIN_SHARED_SECRET | optional proxy-to-origin server secret |
| VITE_API_BASE_URL, VITE_WS_URL | public frontend build config; ถ้า same-origin ใช้ relative/derived origin |
| D1 DB binding, SESSION_ROOM binding | Workers resource bindings ไม่ใช่ environment string ใน frontend |
| CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID | scoped CI deploy credential/config เมื่อได้รับอนุมัติ; ไม่ใช้ Global API key |
| RAILWAY_TOKEN | optional scoped deployment secret เมื่อได้รับอนุมัติ |
| REDIS_URL | ยังไม่ต้องมี; server secret เมื่อเพิ่ม Redis จริง |

## 8. Local/build/deploy verification plan — ให้ Antigravity implement หลังเลือก
1. Pin runtime/package versions และ lockfile; จัด .env.example ที่ไม่มี secrets
2. A: local Bun + local Postgres container; React dev proxy ให้ topology ใกล้ production. B: Wrangler local D1/DO + Cloudflare Vite plugin
3. Run migrations ใน local/test DB และ seed synthetic session ผ่าน supported path; destructive reset ห้ามชี้ production
4. Prove HTTP health, persistent insert/read, duplicate constraint, WS broadcast, reconnect, close/submit race, restart/re-read
5. Build React production และ test SPA refresh/deep links; API missing route ต้องไม่ตอบ HTML 200
6. Senior Tester ทำ runtime/mobile/permissions/origin matrix; 30 clients ผ่าน API จริง พร้อม overlap evidence และ latency distribution. เสนอเป้าหมาย p95 commit-to-render <= 1s บน test network แต่ยังต้องให้ผู้ใช้อนุมัติและวัดจริง
7. ก่อน cloud: ผู้ใช้เลือก provider/plan/region, auth method, hostname topology และอนุมัติ costs/access/publication
8. Deploy staging → read back exact deployed URL/version → migrate safe → cross-device test → restart/reconnect → inspect logs/no secrets → user acceptance
9. จัด public GitHub full history และ demo credentials flow ที่ไม่เปิด production secrets; release video โดยผู้ใช้

## Sources (retrieved 2026-11-04)
- https://developers.cloudflare.com/workers/static-assets/
- https://elysiajs.com/integrations/cloudflare-worker
- https://elysiajs.com/patterns/deploy
- https://elysiajs.com/patterns/websocket
- https://elysiajs.com/plugins/cors
- https://bun.sh/docs/runtime/http/websockets
- https://docs.railway.com/guides/bun
- https://docs.railway.com/networking/public-networking/specs-and-limits
- https://docs.railway.com/deployments/serverless
- https://docs.railway.com/databases/build-a-database-service
- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/containers/
- https://developers.cloudflare.com/containers/platform/limits/
- https://redis.io/docs/latest/develop/interact/pubsub/
- https://docs.bullmq.io/guide/connections
- https://docs.bullmq.io/guide/going-to-production
- https://developers.cloudflare.com/queues/reference/delivery-guarantees/
- https://developers.cloudflare.com/queues/platform/limits/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS

เอกสาร upstream เปลี่ยนได้ ข้อมูลนี้ไม่ใช่ใบเสนอราคา และไม่มี network/load test ของแอปเกิดขึ้นใน C0
