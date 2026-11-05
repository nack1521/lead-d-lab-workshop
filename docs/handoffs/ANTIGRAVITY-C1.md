# Antigravity C1 — Local runtime, persistence และ realtime tracer bullet

สถานะ: HANDOFF PREPARED / READY FOR IDE PREFLIGHT — ยังไม่เริ่ม implementation
Static review: [Senior Tester — READY WITH GATES](../qa/C1-HANDOFF-REVIEW.md), สำหรับเอกสาร/preflightเท่านั้น ไม่ใช่ runtime PASS
Workspace: `/Users/aiink/Nack/Lead+D-Lab`
เจ้าของการตัดสินใจ: ผู้ใช้ | Coordinator: lead-d-setup | QA: lead-d-qa
Baseline code/history ณ เตรียม: `e0666c095983f1d4eb0238d92c9b9e0e6d3a9c13` (เป็น docs/design baseline ไม่ใช่ app build)

## 1. Approval และขอบเขต
- 2026-11-05 ผู้ใช้ยืนยัน flow WF-01-R1 และขอเตรียม C1 handoff. ยอมรับ flow เป็น baseline สำหรับพัฒนา ไม่ใช่ runtime/release acceptance
- คำขอนี้อนุมัติการเตรียม handoff เท่านั้น. Antigravity เริ่มด้วย read-only preflight → เสนอ technical decisions/test seams → รอผู้ใช้สั่งเริ่ม C1 local build ใน IDE ก่อนแก้ application/config/test files หรือติดตั้ง project dependencies
- Hermes ทำ specification/review/verification เท่านั้น; application code, tests, migrations, Docker/Compose และ build configuration ทั้งหมดเป็นงาน Antigravity IDE
- ไม่ deploy, สร้าง cloud resource, authorize MCP, ใช้ paid service, publish image, เปลี่ยน global config, เปิด public tunnel หรือ push โดยอัตโนมัติ. Git commits หลังอนุมัติ build เป็นชุดงานที่มีความหมาย; ผู้ใช้/Coordinator ควบคุม push ตาม approval

## 2. อ่านก่อนและ entry gate
1. `AGENTS.md`, `docs/TEAM-WORKFLOW.md`, `docs/STACK-DECISION.md`, `docs/REPRODUCIBLE-SETUP-REQUIREMENTS.md`
2. `docs/product/WF-01-R1-DELIVERY.md`, `docs/qa/WF-01-R1-DESIGN-RETEST.md`; baseline flow link อยู่ใน Product delivery
3. `docs/SKILLS-REGISTER.md` และ skill instructions ที่เกี่ยวข้องจริงใน `.agents/skills/`: tdd, codebase-design, diagnosing-bugs, ponytail. Unslop พักจนมี UI จริงและ visual direction ที่อนุมัติ
4. ตรวจ IDE skill discovery ด้วยชื่อ/path ที่โหลดได้จริง; ถ้าอ่านได้เพียงไฟล์แต่ไม่ได้ activate ให้รายงานตามจริง ไม่แก้ global configuration เพื่อฝืนให้ผ่าน
5. ตรวจ Git branch/status และงานเดิมก่อนแก้; หยุดเมื่อมี conflicting user changes. อ่านไฟล์ก่อนแก้ ไม่ overwrite เอกสาร foundation/skills/Figma evidence
6. ตรวจ runtime, Docker engine/Compose, image architecture และพอร์ตที่เสนอใหม่ด้วยคำสั่งจริง. ไม่มีแอป/Compose ใน root ณ เตรียม ห้ามอ้างคำสั่ง start/test ว่ารันได้แล้ว

### Preflight observation ของ Coordinator (ไม่ใช่ app tests)
- 2026-11-05T11:59:21+07:00: native Bun `1.4.4`; gh `2.103.3`; root ยังไม่มี package.json, bun.lock, compose.yaml หรือ docker-compose.yml
- Docker CLI พบที่ `/Applications/Docker.app/Contents/Resources/bin/docker`; `docker context show` คืน `default`
- `docker info --format '{{.ServerVersion}}'` exit1: ติดต่อ `unix:///var/run/docker.sock` ไม่ได้ (socket ไม่มี)
- ตรวจ `docker context ls` ต่อแล้วพบเฉพาะ default; ยังไม่มี local alternate context ให้พิสูจน์. ไม่ได้เริ่ม Docker Desktop หรือเปลี่ยน context แทนผู้ใช้
- **Local DB execution BLOCKED จนผู้ใช้เปิด/แก้ Docker engine**; ไม่เป็นเหตุให้แทน PostgreSQL ด้วย SQLite/in-memory หรือเปลี่ยน stack. ให้ recheck ใน IDE เพราะ observation อาจเปลี่ยนแล้ว

## 3. Outcome และ scope ที่เล็กที่สุด
พิสูจน์ local end-to-end: fixture session → participant join โดยไม่สมัครบัญชี → ส่ง rating หรือ poll พร้อม optional comment → PostgreSQL commit → facilitator อีก browser context เห็น aggregate ผ่าน WebSocket → reconnect/restart แล้วยังอ่านผลเดิมได้

In scope หลังอนุมัติ local build:
- React (เสนอ Vite) frontend แบบ functional ไม่ทำ visual polish; Elysia บน Bun จริง; PostgreSQL จริง; native WebSocket; API instance เดียว
- fixture sessions A/B และคำถามตัวอย่าง rating1–5 / single-choice poll; synthetic data ระบุชัดและสร้างผ่าน API/bootstrap ที่ตรวจสอบได้ ไม่ใส่ mock success ใน UI
- Minimal facilitator control: เปิด/ปิดคำถามและอ่าน aggregate; ไม่ทำ session authoring suite ทั้งระบบ
- สอง client contexts แยกจริง (participant/facilitator) และ participant/session อื่นสำหรับ negative/isolation cases
- Mode A: native Bun frontend/API + Docker PostgreSQL; Mode B: frontend/API/DB ผ่าน Docker-only ใน fresh worktree โดยไม่ต้องใช้ host Bun
- health/readiness, schema migrations, tests, README/setup/env contract และ evidence

Out of scope C1:
- HR dashboard/insight formulas, multi-organisation, account/login platform, queue/Redis/BullMQ, AI summary, raw-comment wall/export, polished UI ครบ19screens
- production load claim/30-client SLA, full mobile-device certification, full accessibility audit, cloud deployment และ image registry publication. ไม่ตัดสิทธิ์/validation หลักเพียงเพราะเป็น spike

## 4. Technical decisions ที่ต้องเสนอใน preflight (ยังไม่อนุมัติโดยปริยาย)
| หัวข้อ | ข้อเสนอสำหรับ C1 / สิ่งที่ต้องส่งกลับก่อน build |
|---|---|
| Stack | คง React + Elysia/Bun + PostgreSQL + native WS; ห้ามย้าย backend ไป Workers แล้วอ้างว่าเป็น Bun runtime |
| Versions | คง Bun1.4.4 เว้นพบ blocker; เสนอ exact React/Vite/Elysia/DB driver/PostgreSQL image version ที่เข้ากันได้และแหล่งอ้างอิง; lockfile และ image pin/digest หลังตรวจจริง ไม่ใช้ latest ลอย |
| ORM/driver | เลือกทางเล็กที่สุดที่ transaction/migration/test ได้; Drizzle ยังเป็นข้อเสนอ ไม่ใช่ข้อบังคับ. ระบุ driver และเหตุผลก่อนเพิ่ม dependency |
| Origins | เสนอ direct browser→API แบบ explicit local allowlist เพื่อพิสูจน์ topology Cloudflare→Railway ภายหลัง; Vite proxy ใช้ได้แต่ต้องไม่ข้าม direct-origin negative tests |
| Local endpoints | candidate frontend127.0.0.1:5173, API127.0.0.1:3000, DB127.0.0.1:5433; เป็นข้อเสนอ ยังไม่เช็กว่าพอร์ตว่าง. localhost กับ127.0.0.1 เป็นคนละ origin ต้องตั้งชัดเจน |
| Auth | เสนอ opaque per-session participant/facilitator capability, server ตรวจ role+session ทุก action. ไม่ใช้ nickname หรือ join code เป็นสิทธิ์ facilitator; production HR/access distribution ยังอยู่นอก C1 |
| WS authentication | browser ส่ง Authorization header เองไม่ได้: เสนอ first-message authentication มี bounded timeout, ยังไม่ subscribe/send data ก่อน auth, ตรวจ Origin ก่อน upgrade. ไม่ใส่ grant ใน URL/query หรือ logs; ถ้าเลือก cookie/ticket ให้เสนอนโยบาย CSRF/expiry แทนก่อน build |
| Optional fields | nickname40/comment500 ตาม baseline; whitespace-only→absence; เสนอวิธีนับ Unicode ที่ frontend/backend ตรงกัน พร้อม Thai combining/emoji tests. ค่า character limit ไม่ใช่ JS string.length ที่ถือว่าถูกเอง |
| Editing | C1 ไม่แก้ response ที่ accepted แล้ว; แก้ draft หลัง terminal rejected/non-save ได้ขณะคำถามเปิด; unknown reconcile ก่อน ไม่ถือ transient404 เป็น terminal |
| Security budgets | เสนอ grant expiry, bounded auth timeout, body/frame size และ local abuse/rate limit ที่ไม่ขัด workshop30คน; ระบุค่าจริงใน preflight ให้ผู้ใช้ยืนยัน ไม่มี approved SLA/retention ที่เดาแทน |

Exit ของ preflight: รายงาน discovery, blockers, proposed choices, test seams และ permitted changed paths ให้ผู้ใช้ แล้วหยุดรอคำสั่งเริ่ม local implementation. หากเปลี่ยน stack/security/feature scope กลับมาขอ decision ไม่ขยายเอง

## 5. Data และ behavior contract สำหรับ C1
เสนอ logical model ขนาดเล็ก (ไม่ใช่ DDL/migration ที่ implement แล้ว):
- `sessions`: join code, lifecycle, active question, monotonic revision; grants ต้องจำกัด session
- `questions`: session FK, type, rating bounds หรือ option IDs, receiving state
- `participants`: opaque ID, session FK, nullable nickname; identity แยก nickname; join operation key แบบ clientสร้างก่อนส่งเพื่อ retry join ไม่สร้างคนซ้ำ
- `responses`: participant+question unique, typed answer, nullable comment, accepted timestamp. FK/validation ป้องกันข้าม session; ห้ามเก็บ nicknameซ้ำใน response/aggregate
- `submission_receipts`: participant/session/question scope, idempotency key, normalized payload fingerprint, terminal outcome และ stable response reference. อาจรวม receipt กับตารางเดิมถ้ายังรักษา contract ได้; ไม่เพิ่ม service/queue
- Capability issuance/revocation/expiry เป็น server-side concern; เลือก schema ที่เล็กและตรวจได้ใน preflight ห้ามมี admin credential ใน VITE_* หรือ bundle

### คำตอบ/ข้อความและการส่งซ้ำ
- answer+comment บันทึกใน transaction เดียว; success ack หลัง commit เท่านั้น; DB failure ต้องไม่มีคะแนนที่หลงเหลือโดย comment หาย
- unchanged retry: keyเดิม+payloadเดิม → คืน stable outcome เดิม ไม่เพิ่ม response/count; keyเดิม+payloadต่าง → conflict ชัดเจน ไม่ overwrite เงียบ
- accepted response เดียวต่อ participant/question แม้ keyใหม่; nicknameซ้ำหรือ blank ไม่เปลี่ยน identity/count
- GET ไม่พบ receipt ชั่วคราวหรือ timeout = unknown ไม่ใช่ permission ให้สร้าง keyใหม่; retry keyเดิม/reconcile in-flight ก่อน
- edited new submission/keyใหม่ได้หลัง terminal confirmed rejection/non-save ที่ requestเดิมไม่สามารถ commit ภายหลัง และคำถามยังเปิด; ไม่มี accepted-answer edit ใน C1
- server เป็นผู้ตัดสิน active question/close order; ทำ close/submit ordering ผ่าน DB transaction/locking หรือกลไกที่พิสูจน์ได้ และนับเพียง accepted rows
- key conflict และผล replay ไม่ควรถูก revalidate เป็นคำขอใหม่หลังปิด: accepted retry หลัง close/restart ต้องยังคืน accepted เดิม ไม่แจ้งว่าคำตอบหาย

### Realtime และ privacy
- aggregate broadcast หลัง DB commit; ส่งเฉพาะตัวเลขรวม/state/revision ไม่มี nickname, comment หรือ capability
- authoritative snapshot ต้องอ่าน DBอย่างสอดคล้องและส่ง revision เดียวกับ state; reconnect/refetch resync ได้ ไม่พึ่ง event history ใน memory เป็น source of truth
- clientไม่รับ state revisionเก่าย้อนทับใหม่; ฝั่ง participantอ่านได้เฉพาะคำตอบ/สถานะของตน ไม่ subscribe facilitator aggregate ด้วย grantผู้ร่วม
- ถ้า DB commitแล้ว processตายก่อนbroadcast ให้กู้ snapshotหลัง reconnectได้; C1ไม่รับรอง multi-instance fanout/outbox และไม่เพิ่ม Redisแก้โดยพลการ
- nickname optional blank ใช้ “ผู้เข้าร่วม”; comment blankไม่เป็น0/partial. คง draftในแท็บระหว่างเครือข่ายหลุด; ไม่รับรองร่างข้ามrefresh/ปิดแท็บและไม่แอบเพิ่ม persistent browser storage
- Escape/render free text เป็นข้อความ; validateบนserver; ไม่ log raw nickname/comment/tokens/connection strings. synthetic dataเท่านั้นในevidence

## 6. Test seams และลำดับ tracer bullets
ใช้ TDD ทีละพฤติกรรม: failing testที่เกิดจากbehaviorยังไม่มี → run RED → minimal implementation → run GREEN → refactor/regression. ไม่เขียน testsทั้งหมดแล้วค่อยimplementationทั้งหมด และไม่ลบงานผู้ใช้ตามคำแนะนำ generic skill
1. Toolchain/bootstrap: pin dependencies, health/readiness และ migrations; สร้างเฉพาะ scaffoldingที่จำเป็นต่อ test seam พร้อมรายงานว่า config/tool setupไม่ใช่ business-behavior RED evidence
2. Join API → real PostgreSQL participant + nickname/blank/join retry; boundary testsที่HTTP/repository ไม่ผูก private method
3. Rating+comment → transactionและ receipt/duplicate tests; UI basic submit/sending/saved/unknown เชื่อม APIจริง
4. Poll+comment ใช้submission contractเดียวกัน; wrong type/option และ limits/whitespace cases
5. Facilitator control + DB aggregate → authenticated WS snapshot/event ที่clientแยก; close/reconnect/restart/isolation tests
6. Production frontend build/deep-link และทั้งสอง setup modes; สรุปคำสั่งจริงพร้อมexit codes

Critical seams: HTTP integrationกับPostgreSQLจริง, DB transactions+constraints, authorized WS handshake/auth/subscription, browser flowข้ามcontexts. Fake clock/transport fault injectionใช้เฉพาะจำลองack/eventหลุด แต่ persistence/aggregate assertionsต้องอ่านDB/APIจริง ไม่ mock DBแล้วอ้างintegrationผ่าน

## 7. Acceptance matrix — runtime ทุกข้อยัง NOT RUN
| ID | พิสูจน์อะไร / expected | Evidence ที่ต้องมี | สถานะเริ่มต้น |
|---|---|---|---|
| C1-01 | Mode A รันnativeBun+DockerPostgreSQLได้จริง | versions,commands/exit,health+DBready | NOT RUN |
| C1-02 | Mode B fresh worktreeไม่มีnode_modules/DBเดิม ไม่ใช้hostBun แล้วfrontend/API/DBทำงาน | commands,imagepins,health,HTTP+DBreadback | NOT RUN |
| C1-03 | joinไม่สมัครบัญชี, nicknameblank/ซ้ำได้, joinretryคนเดิม | HTTP+participantrows,count | NOT RUN |
| C1-04 | rating+commentหรือblankcommitครบ; DBfailureไม่มีpartial | ack+transactionfailure+DBreadback | NOT RUN |
| C1-05 | poll+commentใช้จริง; wrongoption/type/ratingrangeปฏิเสธ | boundarytests+rowcounts | NOT RUN |
| C1-06 | whitespace,limits,Unicode/Thai/emojiและHTML-like textตรงcontract | frontend/servercases+safeDOMrender | NOT RUN |
| C1-07 | unchangedretryทั้งsequential/concurrentนับครั้งเดียว; keypayloadmismatchปฏิเสธ | requestIDs,receipts,uniquerows | NOT RUN |
| C1-08 | acceptedคำตอบไม่ถูกoverwriteด้วยkeyใหม่; terminalrejectedแก้ส่งได้เมื่อยังเปิด; unknownห้ามnewkey | integration/UIstate+DBresults | NOT RUN |
| C1-09 | facilitatorอีกcontextเห็นaggregateจากcommitจริง ไม่มีnickname/comment | separateclientcapture+sanitizedWS+DB | NOT RUN |
| C1-10 | close/submitorderแน่นอน; stalequestionและหลังcloseไม่รับ; replayacceptedหลังcloseยังเดิม | controlledrace/serverorder+DB | NOT RUN |
| C1-11 | dropack/reconnect/oldereventแล้วsnapshotตรงDB ไม่มีfakesaved/duplicate | transportfault+revision+DBcomparison | NOT RUN |
| C1-12 | restartAPIและDBโดยไม่ลบvolumeแล้วaccepteddata/receipts/stateยังอยู่ | before/afterreadback+restartcommands | NOT RUN |
| C1-13 | participantสั่งcontrol/อ่านaggregateหรือsessionอื่นไม่ได้; expired/missinggrantและWSpreauthไม่มีdata | negativeHTTP/WSresults | NOT RUN |
| C1-14 | CORSallowed/denied/null + WSallowed/denied/null/missingOriginตามcontract; originไม่แทนauth | browserpreflight/error+WSnegativechecks | NOT RUN |
| C1-15 | productionfrontendbuildและreloaddeep-linkใช้ได้; labels/multilineEnter/errorrecoveryพื้นฐาน | buildexit+browserchecks; realmobileแยกNOT RUNถ้าไม่มี | NOT RUN |
| C1-16 | ไม่รั่วsecrets/rawnicks/commentsในaggregate/logs/imagecontext; READMEคำสั่งตรงจริง | sanitizedpayload/loginspection+trackedfilecheck | NOT RUN |

C1-03–C1-14 ต้องรันกับทั้ง Mode A/B; C1-15 browserflow/buildใช้ปลายทางของแต่ละmode; C1-16ตรวจทั้งsourceและcontainer/log. ไม่ลดcoverageMode Bเหลือแค่containerขึ้น. ห้ามถือสองcontextsผ่านเท่ากับรองรับ30concurrent; load/SLAเป็นgateภายหลัง

## 8. Environment contract — ให้ Antigravity สร้างไฟล์จริงหลังอนุมัติ build
| ชื่อที่เสนอ | ฝั่ง/visibility | ข้อกำหนด |
|---|---|---|
| DATABASE_URL | server secret | nativeใช้loopbackmappedport; containerใช้DBserviceDNS; ห้ามVITE_ |
| API_HOST / API_PORT | server setting | containerlisten0.0.0.0 แต่publish127.0.0.1; nativeกำหนดlocalชัด |
| ALLOWED_ORIGINS | server setting | exactfrontendorigins; no wildcardwithcredentials; error/preflightต้องตรง |
| VITE_API_BASE_URL / VITE_WS_URL | browser public | URLเท่านั้น ไม่มีtoken/password |
| grantTTL / WSauthtimeout / payloadlimits | server settings | เสนอชื่อและค่าจริงในpreflight; applicationconfigเป็นแหล่งความจริง ไม่ทำหลายenvซ้ำ |
| localcapabilities / DBcredentials | secretmaterial | generatedต่อlocalfixture,เก็บuntracked/privately,ไม่ใส่README/commits/evidence |

ดู dual-mode contract สำหรับ volume/network/node_modules separation, ARM64, healthchecks/migration readiness และ safe shutdown. Normal stopต้องไม่ลบvolume; destructive resetต้องเตือนและขอผู้ใช้แยก. `.env.example`มีแต่safeplaceholders; `.dockerignore`กันsecrets/PDF/.research; ไม่mounthostcredentials

## 9. Permitted paths และ output contract หลังเริ่ม build
เสนอ `apps/web/`, `apps/api/`, `packages/`เมื่อจำเป็นจริง, `tests/`, `db/`, rootpackage/lockfile/toolconfigs, Dockerfile/Compose/.dockerignore/.env.example/.gitignore, README และ `docs/implementation/`. ให้ยืนยันโครงสร้างก่อนสร้าง; ไม่แก้ `.agents/`, `.hermes/`, existingproduct/QAevidence หรือ Figma โดยอัตโนมัติ

ให้ส่ง `docs/implementation/C1-REPORT.md` หลังมีexecutionจริง ประกอบด้วย:
- baselineและresultcommit/diff,changedpaths,versions/imagepins/architecture,mode/origin/authchoicesและเหตุผล
- setup/start/test/build/stop/restartcommandsที่มีอยู่จริงพร้อมexitcodes; safeenvnames/URLs ไม่เปิดเผยcredentials
- TDD RED/GREEN evidenceต่อcriticalbehavior และ regressionresult; installfailureไม่ใช่expectedRED
- C1-01–C1-16 ทุกID: PASS/FAIL/BLOCKED/NOT RUN,actual,modeA/B, timestampและevidencepath; ขาดหลักฐานห้ามPASS
- screenshots/sanitizedHTTP/WS/DBreadback,duplicate/race/restartcounts,knownlimitationsและnextgate
- reproductionแบบfreshcheckout; ถ้าติดnetwork/install/Dockerให้บอกerrorจริง ไม่สร้างผลสำเร็จแทน

Exit: Coordinator/SeniorTesterรันหรืออ่านหลักฐานของcurrentbuildแล้วครบcriteria ไม่มีcriticaldata-loss/auth/core-flowfindingเปิด; ผู้ใช้ทดลองและยอมรับจึงปิดC1. การเตรียมเอกสารนี้ไม่ใช่C1ผ่าน และไม่ใช่การรับรองliveURL/production/mobile/load/securityทั้งหมด
