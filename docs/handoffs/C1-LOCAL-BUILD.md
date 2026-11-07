# C1 local build — Current tool-neutral handoff

สถานะ: **LOCAL_BUILD_AUTHORIZED / PRIMARY_TOOL_SELECTED_NOT_DISPATCHED**. ผู้ใช้รับUI05R02และอนุมัติC1แล้ว ต่อมาเลือก **DeepSeek Harnessเป็นหลัก / Antigravityเป็นfallbackเมื่อbudgetหมด** และอนุมัติให้ปรับเอกสาร. ผู้ใช้เปิด/สั่งcodingtoolเอง; เอกสารนี้ไม่ใช่หลักฐานว่าHarnessอ่านแล้วหรือเริ่มbuildแล้ว.

## Entry / precedence
1. อ่าน `AGENTS.md`, `docs/CODING-WORKFLOW.md`, `docs/TEAM-WORKFLOW.md`, `docs/ANTIGRAVITY-RESULT-PROTOCOL.md`, `docs/results/INDEX.md`.
2. อ่าน `docs/implementation/C1-LOCAL-BUILD-APPROVAL-R01.md` สำหรับapprovedC1scope/securitychoices; author/channelเดิมถูกoverrideโดยCODING-WORKFLOW. ไม่รอAntigravityเปิดหรือCLIbindingเพื่อให้DeepSeekเริ่ม.
3. อ่านprotected `docs/handoffs/ANTIGRAVITY-C1.md` สำหรับmatrix16cases/ModeA-B/permittedpaths, stackและreproducible-setupdocs, R03result+Coordinatorreview. คำว่าpreflight-only/build-holdเป็นhistorical ไม่ทำR04ซ้ำโดยไม่มีactualblocker. ไม่overwriteprotecteddirtyfiles.
4. อ่าน `docs/product/UI-05-R02-TARGETED-FIXES.md` และ current `docs/handoffs/product-UI-05.md`: fresh-attemptpolicyใหม่เหนือedited-onlywordingเก่า; unknownไม่เปิดnewkey, oldkeyreplaystable, explicitfreshattemptหลังterminalnon-save+no latecommit+stillopen+authvalidใช้newkeyได้แม้payloadเดิม; oneaccepted/read-only/atomicserverrecheckยังบังคับ.
5. ถ้ามีผล/transferล่าสุดให้อ่านก่อนcontinue ไม่bootstrapทับงานที่มี. ชื่อfile/protocolเก่าที่มีAntigravityไม่ใช่ข้อบังคับให้เปลี่ยนtoolหรือปลอมproducer.

## Build scope / execution
- Workspace `/Users/aiink/Nack/Lead+D-Lab` เท่านั้น; ตรวจGit/source/branch/dirtyownership/ports/currentBun/Dockerก่อนแก้. รักษางานเดิม ไม่killprocessที่ไม่ใช่ของtask. สถานะDocker/Bunในรายงานเก่าเป็นhistorical ให้ตรวจปัจจุบันเมื่อเริ่มbuild ไม่claimcurrentruntimeจากmetadata.
- React + Elysia/Bun + PostgreSQLจริง + authenticatednativeWS, oneAPIinstance; frontendfunctionaltracerbullet ไม่polished19screens/HRdashboard/authoringsuite/Redis/queue/AI. ตรวจR03startingpins/peer/security/imageplatformตามจริงก่อนinstall/pull; พบblockerเสนอchange ไม่ใช้latestหรือเปลี่ยนstackเงียบ ๆ.
- Permittedimplementation: apps/web, apps/api, db, tests และrootpackage/lock/toolconfigs/Dockerfile/Compose/envexample/ignore/READMEตามจำเป็น; packagesเมื่อจำเป็นจริง. ไม่แก้skillsfoundation/Figma/ProductQAevidence/protectedhandoffหรือprogress. เอกสารresults/implementationตามoutputcontract.
- TDDเป็นverticalslices: actualfailingbusiness-test→RED→minimalimplementation→GREEN→regression. Install/bootfailureไม่ใช่expectedRED. Schema/transactions/constraints/HTTPintegrationต้องใช้PostgreSQLจริงไม่mockDB/SQLite/inmemoryแล้วอ้างpersistence.
- Anonymousjoin/optionalnickname40/comment500graphemes, rating/poll+commentatomic, stable replay/conflict/uniqueness/freshattempt, facilitatorcontrol/aggregateaftercommit, authenticatedWS/Origin, close/race/reconnect/revision/restart/isolationตามC1handoff. Draftและacceptedrecordไม่ใช่สิ่งเดียวกัน.
- ModeA=nativeBun+DockerPostgreSQL; ModeB=Docker-onlyfreshworktreeใต้workspaceไม่ใช้hostBun/oldnode_modules/DBเดิม. C1-03–14ครอบคลุมทั้งสองmode; C1-15build/browserปลายทางแต่ละmode; C1-16source/container/logsตามhandoff. ไม่มี30-clientSLAจากการทดสอบ2contexts.
- ใช้C1localsecuritycontract/R03ที่approvedตามcurrentapprovalrecord; no secretsในVITE/chat/logs/commits, grantsไม่อยู่URL, F/HRaggregateไม่มีrawnicks/comments. ใช้generatedlocalfixtures/privateuntrackedcredentials ไม่ขอผู้ใช้แปะsecretในchat. Extraexpiry/retention/HRpolicyที่ยังไม่ตัดสินอย่าเดา ให้รายงานเฉพาะactualdecisionblockerของsliceนั้น.
- Normalstop/restartไม่ลบvolumes; no down -v/prune/destructivereset. ไม่deploy/publictunnel/push/imagepublish/paidservice/globalinstall/config/permissionbypassจากlocalbuildapproval. เก็บschema/volume/processstateให้toolถัดไปทำต่อได้.

## Output / checkpoint / stop
Task=`C1-LOCAL-BUILD`; ใช้runว่างจริงตามINDEX แม้สลับtoolก็ไม่resettask/caseIDsหรือoverwriteR01. บันทึก `docs/results/C1-LOCAL-BUILD/<RUN>/result.md`, `result.json`, sanitizedactualevidence และ `docs/implementation/C1-REPORT.md` เป็นexecutivesummaryชี้run; อัปเดตINDEXlast. ทุกC1-01–C1-16มีModeA/Bstatus/expected/actual/actualcommand+exit/evidence/limitations. ขาดexecutionเป็นNOTRUN/BLOCKEDไม่แต่งPASS; self-reportไม่ใช่independentQAหรือhumanacceptance.

บอกproducer/toolที่ใช้จริง Modelไม่ทราบใช้null/UNVERIFIED. Skillusageรายงานตามhostที่พิสูจน์ได้ ไม่รับรองactivationจากชื่อtool. Commitownedworkเป็นmeaningfulfullhistory ไม่git add . / stageprotecteddirtydocs / reset / squash / push.

เมื่อใกล้budgetหมด ให้หยุดและทำtransfercheckpointตามCODING-WORKFLOWก่อนเริ่มAntigravity: writerSTOPPED, task/branch/HEAD/diff/dirtypaths, lastactualcommands/results, nextfailingcase, migration/services/volumesstateและlatestresultpath. WIPcommitไม่ใช่greenbuild. Budgetหมดก่อนsaveให้รายงานunknownตามจริงและให้ผู้ใช้/Coordinatorเก็บsnapshot ไม่ปลอมผลเก่า. Incomingtoolอ่านdiff/notesแล้วเริ่มต่อเมื่อผู้ใช้ยืนยันเท่านั้น.

DeepSeekprimaryเป็นuser-operatedในworkflowนี้. AntigravityOperatorstandbyไม่autoSTART; OP01/GUIblockerเดิมเก็บเป็นfallbackhistory ไม่ขวางprimary. เมื่อผู้ใช้เลือกfallbackจึงยืนยันchannel/model/workspace/oldwriterstop/readbackตามกฎเดิม.

Exit: current-buildexecutionevidenceพร้อม → Coordinator/SeniorQAตรวจอิสระ → ผู้ใช้ทดลอง/รับimplementation. ขณะออกhandoffนี้ยังไม่ได้runapp/testsจากการปรับเอกสารและไม่มีclaimC1PASS.
