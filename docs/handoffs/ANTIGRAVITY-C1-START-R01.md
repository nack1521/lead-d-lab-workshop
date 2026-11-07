# Antigravity C1 — START local build R01

**คำสั่งที่ผู้ใช้อนุมัติ: เริ่ม C1 local implementation ได้แล้ว ไม่ใช่ preflight-only อีกต่อไป.** อ่าน `docs/implementation/C1-LOCAL-BUILD-APPROVAL-R01.md` เป็น current authorization และทำงานเฉพาะ `/Users/aiink/Nack/Lead+D-Lab`.

## Read / precedence
อ่าน AGENTS/TEAM-WORKFLOW, `docs/ANTIGRAVITY-RESULT-PROTOCOL.md`, `docs/results/INDEX.md`, protected `docs/handoffs/ANTIGRAVITY-C1.md`, reproducible-setup/stack docs, preflight R03 result+Coordinatorreview และ `docs/product/UI-05-R02-TARGETED-FIXES.md`/currentProducthandoff. Historicalhold/preflightstop/edited-onlywordingใช้แทนcurrentapproval/R02amendmentไม่ได้. ไม่แก้protecteddirtyfilesเพื่อให้สถานะดูสะอาด.

## Execute the smallest complete C1
1. ตรวจGit/dirtyfiles/ports/currentBun/Dockerและsourceก่อนแก้. DockerDesktopdaemonตรวจพร้อมแล้วล่าสุด29.9.2/aarch64 แต่ให้recheckตามจริง. Candidateports5173/3000/5433ยังไม่reserved ห้ามkillprocessคนอื่น. R03pinsเป็นapproved starting setที่ต้องตรวจcompatibility/securityจริง; ไม่ใช้latest/เปลี่ยนstackเงียบ ๆ. ถ้าไม่มีactualblockerเริ่มbuildต่อ ไม่เปิดpreflightR04paperworkซ้ำ.
2. สร้างโครงสร้างเล็กที่สุดตามpermittedpathsC1: apps/web, apps/api, db, tests และrootpackage/lock/toolconfigs/Dockerfile/Compose/envexample/ignore/READMEตามจำเป็น. ไม่แตะskills/Figma/ProductQAevidence/protecteddirtydocs. SyntheticfixturesA/B/rating/pollสร้างผ่านAPI/bootstrapจริง.
3. ใช้TDDทีละbehavior: failingbusiness-test→runRED→minimalimplementation→runGREEN→regression. Bootstrap/installfailureไม่ใช่TDDRED. ใช้React + Elysia/Bun + PostgreSQLจริง + authenticatednativeWS, oneAPIinstance; ไม่ใช้mockDB/SQLite/inmemoryแทนpersistence.
4. พิสูจน์joinโดยไม่สมัครบัญชี, optionalnickname40/comment500graphemes, rating/poll+commentatomicหลังcommit, stablekeyreplay/conflict/oneaccepted, freshattemptตามR02guards, close/race/reconnect/snapshotrevision/restart/isolation/origin/authและaggregateไม่มีrawnicks/comments. Frontendเป็นfunctionaltracerbullet ไม่ทำpolished19screensหรือHRdashboard.
5. ModeA nativeBun+DockerDB; ModeB Docker-onlyในfreshworktreeใต้workspaceที่ไม่มีhostnode_modules/DBเดิมและไม่ใช้hostBun. แยกports/volumes/networksอย่างsafe ไม่เอาผลModeAมาอ้างModeB. Normalstop/restartไม่ลบvolume; destructiveresetต้องขอผู้ใช้แยก. ห้ามcompose down -v/prune/deleteusercontainersเอง.
6. คงR03localsecuritycontract/currentR02policy; genlocalcredentials/grantsเป็นprivateuntrackedfilesไม่พิมพ์ค่าในchat/log/publicdocs และไม่VITE_ secret. EntryURLใช้actuallocaloriginในimplementationไม่ใช้designplaceholderเป็นworkinglink. Systempermissions/login/payment/2FA/paid/cloudresourceนอกscopeให้หยุดขอ ไม่bypass.
7. รันacceptanceC1-01–C1-16ในModeA/Bตามhandoff. สถานะทุกข้อเริ่มNOTRUN; ใช้actualcommands/exitcodes/currentbuildDB/API/browserreadback. ขาดหลักฐานให้PARTIAL/BLOCKED/NOTRUN ไม่แต่งPASS. Basicbrowserflowแยกparticipant/facilitatorcontext; actualmobile/load/securityauditนอกC1ระบุNOTRUNชัด.

## Output / finish
ใช้ task `C1-LOCAL-BUILD`, เลือกrunว่างจริงเริ่มR01ถ้ายังไม่มี. เก็บimmutable `docs/results/C1-LOCAL-BUILD/<RUN>/result.md`, `result.json`, sanitizedactualevidence ตามprotocol และ `docs/implementation/C1-REPORT.md` เป็นexecutivesummaryชี้run ไม่ทำdetailซ้ำ. ทุกC1IDมีModeA/Bstatus/actual/command/exit/evidence; skill_usageแยกread-loaded/applied/activationtraceตามจริง. อัปเดตresultsINDEXเป็นขั้นตอนสุดท้าย.

Commitownedimplementationเป็นmeaningfulincrements/fullhistory; ไม่stageprotecteddirtydocs ไม่reset/squashประวัติหรือpush. หากทำนาน/ติดblockerให้ส่งactualPARTIAL/BLOCKEDพร้อมสิ่งที่รันแล้วและconcreteassistedstep ไม่อ้างเสร็จจากเพียงplan.

**No deploy/publictunnel/push/imagepublish/paidresource/Redis/queue/HR/fullUI scope expansion.** ผู้ใช้รับimplementationหลังCoordinator/SeniorQAตรวจหลักฐาน ไม่ให้producerรับรองตนเอง.

## Operator delivery rule
`lead-d-impl` เป็นผู้dispatchคนเดียว: ยืนยันworkspace/context/modelใน existingIDE C1 ก่อนส่งSTARTนี้ครั้งเดียว; ขอให้ลุงอ่านpathเอกสาร ไม่แปะprivatechatทั้งหมด. Modelที่กำหนดสำหรับagy=`gemini-3.8-flash-high`; GUIเลือกGemini3.8FlashHighเมื่อยืนยันได้ ไม่สลับเงียบ ๆ. CLIexistingconversationเคยtrajectorynotfound จึงไม่retryblind/fallbacknewconversation/smokeแทน. GUIbackground-firstได้ตามสิทธิ์เดิม; OSpermission/credential/foregroundfocusที่ต้องapprovalเพิ่มให้หยุดถาม.

หลังส่งให้readbackexactconversationเพื่อยืนยันpromptได้รับและมีการรับงาน/เริ่มจริง; requestqueuedไม่เท่ากับลุงรับแล้ว. บันทึกเฉพาะ `docs/implementation/C1-LOCAL-BUILD-DISPATCH-R01.md` และsanitizedevidenceใต้ `docs/implementation/evidence/C1-LOCAL-BUILD-DISPATCH-R01/`; rawprivatecaptures/logsในignoredcacheตามสิทธิ์เดิม. ห้ามOperatorเขียนapp/tests/configแทนIDEหรือdispatchซ้ำขณะมีwriterรันอยู่. ถ้าbinding/GUIยืนยันไม่ได้ให้BLOCKEDพร้อมassistedstepเดียวและpromptpathนี้ ไม่เปลี่ยนช่องทางโดยพลการ.
