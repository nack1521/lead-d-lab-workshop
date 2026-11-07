# C1 local build — Human acceptance / start authorization R01

**Authoring amendment 2026-11-07:** ผู้ใช้เปลี่ยนเป็น DeepSeek Harness primary / Antigravity fallback และอนุมัติปรับเอกสาร ดู [current coding workflow](../CODING-WORKFLOW.md) และ [current C1 handoff](../handoffs/C1-LOCAL-BUILD.md). Scope/local-build approval/securityเดิมยังมีผล; tool/channel-specific wording ด้านล่างเป็นบันทึก ณ ตอนอนุมัติแรก ไม่ override current workflow. Hermes ยังคง non-coding และไม่ auto-control DeepSeek จากการปรับเอกสาร

## Current authorization
ผู้ใช้ยืนยันตรงว่า **“รับ UI-05 R02 และให้ลุงเริ่ม C1 local build”**. บันทึกวันที่เครื่อง 2026-11-07 (+07), baseline ก่อนบันทึก `acdf6124af80c065ce5cbe00b5eda4783170a453`.

- **UI-05 R02: ACCEPTED_DESIGN_STATE_PACK** โดยผู้ใช้: R02 delta/spec/transition และ unchanged-state references ตาม current amendment. ไม่ใช่ runtime, full mobile/accessibility/security หรือ unseen expiry implementation acceptance. UI04 approved4viewsเดิมคงเดิม ไม่แก้ Figma ในรอบบันทึก approval.
- **C1: LOCAL_BUILD_AUTHORIZED** ให้ Antigravity IDE ทำ technical tracer bullet ตาม handoff/R03/currentR02amendment พร้อม project dependency install และ local Docker pull/start. ไม่ใช่ C1 QA PASS หรือรับงาน implementationแล้ว.
- Scope React + Elysia/Bun + PostgreSQLจริง + authenticated native WS; ModeA(nativeBun+DockerDB) และModeB(Docker-only/freshworktree) ตาม C1-01–C1-16. ไม่ขยายเป็น polished full19screen UI/HR/dashboard/authoring suite/Redis/queue/AI.
- **ยังไม่อนุมัติ** push/deploy/publictunnel/cloudresources/imagepublish/paidservice/globalconfiguration/privilegedpermissionbypass/destructivereset. ไม่มี liveappURL จาก designapproval.

## Source / precedence ที่ลุงต้องอ่านก่อนแก้
1. `AGENTS.md`, `docs/TEAM-WORKFLOW.md`, `docs/ANTIGRAVITY-RESULT-PROTOCOL.md`.
2. เอกสารนี้ และ `docs/handoffs/ANTIGRAVITY-C1-START-R01.md` เป็น current build authorization; คำว่า build-hold/preflight-stop ใน historicalhandoff/results ไม่ใช่เหตุให้ทำ preflightR04ซ้ำ.
3. `docs/handoffs/ANTIGRAVITY-C1.md` สำหรับ C1 scope/matrix/permittedpaths/dualsetup โดยรักษา dirtyไฟล์เดิมไม่overwrite.
4. `docs/results/C1-PREFLIGHT-FOLLOWUP/R03/result.md` และ `docs/implementation/C1-PREFLIGHT-R03-COORDINATOR-REVIEW.md` สำหรับ proposed startingpins/securitychoicesที่อนุมัติให้พิสูจน์localruntime. ตรวจ current compatibility/security/imageplatformจริงก่อนinstall/pullตามขั้น build; พบblockerให้รายงาน/เสนอchange ไม่เปลี่ยนstackเงียบ ๆและไม่เปิดpaperworkloopโดยไม่มีblockerจริง.
5. `docs/product/UI-05-R02-TARGETED-FIXES.md` และ `docs/handoffs/product-UI-05.md`: user-approvedfresh-attemptpolicy supersedesedited-only/unchanged-retrywordingเก่าเฉพาะจุด; acceptedยังunique/read-only, unknownห้ามfreshkey, stableold-keyreplayคงผลเดิม. ใช้ C1 functional UI ที่เล็กที่สุดคงcorrectstates ไม่สร้างfullUIทั้งหมดเพียงเพราะมีFigma.
6. AGENTS currentUnsloppolicyเหนือwordingพักUnslopในhandoffเก่า. Skillusageแยกread-loaded/applied/activationevidenceตามจริง.

## Security / policy baseline
ใช้ R03 proposedlocalsecuritysettingsเป็น startingcontract: explicitallowedorigins; rejectmissing/nullWSOrigin; participant/facilitatorgrantTTL4h/8h; WSauthtimeout3s; HTTPbody16KB/WSframe4KB; ratebudgetsตาม R02/R03ที่ต้องอ่าน ไม่เดาค่าที่ไม่ได้ดึง; ownreceiptreadgrace15mหลังnormalendโดยไม่ยืดhardTTLหรือข้ามrevocation. ไม่ใส่grantในURLหรือVITEbundle/log.

Retention/deletion/productionhelpchannelและHR/smallgroupsuppressionที่ยังไม่ตัดสินไม่ถูกอนุมัติด้วยการเริ่มC1. ก่อนreceiptseamที่เกี่ยวข้องต้องให้ exactsafeexpiry/revoke/unavailablemappingสอดคล้องR03/currentUX; unavailableคงunknown ไม่ชี้ว่าไม่บันทึก/ให้ส่งใหม่หรือHRbypass. หากต้องตัดสินสิ่งนอกapprovedcontractจริง ให้หยุดเฉพาะส่วนและรายงาน ไม่สร้างpolicyเอง.

## Current machine observations — ไม่ใช่ app tests
Coordinatorใช้คำสั่งจริงวันที่2026-11-07:
- NativeBun `1.4.4` exit0; DockerCompose `5.6.1` exit0.
- InitialDockerinfo exit1 ติดต่อ socket `unix:///Users/aiink/.docker/run/docker.sock` ไม่ได้. Coordinatorร้องขอเปิดDockerDesktopที่ติดตั้งอยู่แบบbackgroundด้วย `open -g -a Docker`; ไม่เปลี่ยนsettingsหรือpermission.
- Readbackเวลา `2026-11-07T15:18:11.656257+07:00`: dockerinfo exit0 `29.9.2/aarch64` หลังboundedhealthcheck2attempts. นี่คือ localdaemonavailable ไม่ใช่ DBcontainer/appready หรือ imagepulled.
- lsof ของ candidateports5173/3000/5433 คืนexit1/stdoutว่าง/stderrว่าง: ไม่พบLISTENentriesในการอ่านครั้งนั้น ไม่ใช่การจองหรือรับรองbindตอนbuild.
- Rootยังไม่มีpackage.json/bun.lock/compose.yaml/docker-compose.ymlในการอ่านก่อนเริ่ม ไม่อ้างมีapplication/server/migrationแล้ว.

## Ownership / channel
Coordinatorคนเดียว=`lead-d-setup`; dispatchowner=`lead-d-impl` AntigravityOperator; codewriter=AntigravityIDEเท่านั้น; independentQA=`lead-d-qa`. Hermesทุกบทบาทไม่เขียนapp/test/migration/CI/deploycodeแทนลุง.

คง existingIDE C1 conversation ที่ผู้ใช้เลือก `9b5e0289-c9f1-4b9a-a74b-9fbfa8ede331`. OP01CLIresumeเคยfailedtrajectorynotfound; ไม่retryคำเดิม/เดาID/importauth/appdata/newconversation/smokeconversationแทน. OperatorตรวจIDEGUIแบบbackground-firstตามcomputer-useskillได้ภายใต้สิทธิ์เดิม; ต้องยืนยันworkspace/context/modelก่อนส่งstartpromptครั้งเดียวและreadbackหลังส่ง. ถ้ายืนยันไม่ได้ให้BLOCKED+ขอassistedstepเดียว ไม่อ้างว่าลุงเริ่มแล้ว.

## Protected work / acceptance
รักษา dirty `docs/AI-PROGRESS.md` SHA256 `d28a75f17c43a7d7a48709e546d6125ec777d72f04b10fa83f401b0fcb384754` และ `docs/handoffs/ANTIGRAVITY-C1.md` SHA256 `d361d2deac8b7fccf1e2f365372d8318c5b11b470722c052e197e10231b5770b`; ไม่stage/overwrite/resetงานเดิม. Product/QA/Figmaevidence/skillsfoundationคงเดิม. Appwritercommitเฉพาะownedchangesอย่างmeaningfulfullhistory ไม่push.

RuntimeC1-01–C1-16ทั้งหมดเริ่มNOTRUNจนมีexecutionจริง. แยกbuildauthorized, dispatchverified, buildrunning, producerresults, independentQA และhumanacceptance. ต้องใช้resultprotocol/taskrun/indexlast ไม่แต่งPASSจากtoolcallหรือconfig.

## AI progress
ผู้ใช้รับUI05R02และอนุมัติlocalC1; Coordinatorอ่านscope/history/protocol ตรวจmachineprerequisitesจริง เปิดexistingDockerDesktopและreadbackdaemonready เตรียมhandoffให้Operator ไม่เขียนappcode. ใช้lead-d-workshop-cycle/operatorreference, writing-for-agents และcomputer-useguidanceเพื่อกำหนดdispatchที่ปลอดภัย; รอบนี้ยังไม่มีIDEdispatchreceiptหรือappbuildresults. เก็บprogressที่นี่แทนsharedprotecteddirtyfiles.
