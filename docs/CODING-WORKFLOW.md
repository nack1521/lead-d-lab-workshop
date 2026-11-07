# Coding workflow — DeepSeek Harness primary / Antigravity fallback

สถานะ: **USER_APPROVED_WORKFLOW** วันที่2026-11-07. ผู้ใช้เลือกเขียนด้วยDeepSeek Harness และสลับไปลุงเมื่อbudgetหมด จากนั้นอนุมัติให้ปรับเอกสาร. เปลี่ยนauthoringtool ไม่เปลี่ยนstack/features/acceptance/securityหรือapprovalให้publish.

## Current authority / single writer
- **Primary:** DeepSeek Harness ที่ผู้ใช้เป็นผู้เปิดและสั่งงาน. นี่เป็นการเลือกเครื่องมือ ไม่ใช่หลักฐานว่าเชื่อม/เริ่มsession/อ่านrepo/เขียนcodeแล้ว.
- **Fallback:** Antigravity IDE (“ลุง”) เมื่อผู้ใช้เลือกสลับ เช่นbudgetหมด. ไม่auto-detectquotaหรือเปลี่ยนmodel/providerเพียงเพราะerror และไม่รับรองว่ากู้contextได้อัตโนมัติ.
- **Hermes:** analysis/spec/handoff/verification/QA coordinationเท่านั้น ไม่เขียนapp/test/migration/CI/deployconfig ไม่ใช้การเปลี่ยนเครื่องมือเป็นเหตุขยายcodingrole.
- **หนึ่งactive writerต่อtask/workspace.** เลือกDeepSeekเป็นหลักไม่อนุญาตให้Operatorส่งSTARTเข้าลุงพร้อมกัน. AntigravityOperator=`lead-d-impl` อยู่standby/ห้ามauto-dispatchจนผู้ใช้ยืนยันfallbackและผู้เขียนเดิมหยุดแล้ว.
- ผู้ใช้ควบคุมเครื่องมือcodingเองเป็นค่าเริ่มต้น. การอนุมัติปรับเอกสารไม่ใช่การสั่งHermesเปิด/ติดตั้ง/ควบคุมDeepSeek Harnessหรือเริ่มrunแทน. หากจะdelegatecontrolต้องกำหนดscope/channelก่อน.

## Communication
Follow the **Communication language** section in `AGENTS.md`: concise English between tools/agents, Thai for the user and approved Thai product copy. Use the English [C1 starter](handoffs/C1-START-EN.txt) for a user-operated initial run; it references the existing handoff rather than replacing its requirements. Language-only changes do not authorize dispatch, change the active writer, or prove token savings.

## Sources / precedence
1. `AGENTS.md` และเอกสารนี้เป็นcurrent authoring policy แทนwording “Antigravityเท่านั้น” ในhistoricalhandoff/review/results.
2. Current C1 entry point: [C1 local build handoff](handoffs/C1-LOCAL-BUILD.md). UI05R02 acceptedและC1 local-build approvalเดิมยังมีผลตามscopeเดิม ไม่ต้องขอรับUIใหม่เพียงเพราะเปลี่ยนtool.
3. [Original C1 approval](implementation/C1-LOCAL-BUILD-APPROVAL-R01.md) เก็บhuman quote/approvedscope/securityตั้งต้นตามประวัติ; author/channelส่วนเดิมถูกamendโดยworkflowนี้. [UI05 R02](product/UI-05-R02-TARGETED-FIXES.md) ยังคงเป็นfresh-attemptpolicyปัจจุบัน.
4. `docs/handoffs/ANTIGRAVITY-C1.md` เป็นprotected scope/matrixเก่าให้อ่านC1-01–C1-16/permittedpaths/dualsetupโดยไม่แก้dirtyเดิม. ไม่ใช้edited-only/preflight-hold/tool-onlywordingเก่าต้านapprovedamendments.
5. [Result protocol](ANTIGRAVITY-RESULT-PROTOCOL.md) ใช้ได้กับทั้งสองtoolโดยเก็บfilenameเดิมเพื่อรักษาreferences/history. ไม่renameผลเก่าหรือเปลี่ยนproducerย้อนหลัง.

## Checkpoint ก่อน budget หมดหรือสลับเครื่องมือ
1. ขอให้ผู้เขียนเดิมหยุดงานและsavebuffersก่อน; ต้องยืนยันว่าไม่มีกระบวนการcoding/applydiff/migrationที่ยังค้าง. ถ้าหยุดไม่ได้หรือไม่ทราบ ให้ระบุwriterstate=UNKNOWNและยังไม่เริ่มอีกtool. ห้ามforcequit/resetเพื่อให้ดูหยุดแล้ว.
2. ตรวจbranch/HEAD/statusและdiffที่เกี่ยวข้อง รวมuntrackedpaths. Commitเฉพาะownedchangesเมื่อปลอดภัยเป็นmeaningfulcheckpoint; WIPต้องระบุยังไม่เสร็จ ไม่อ้างgreen. ไม่ใช้git add . ไม่เก็บsecrets/PDF/rawauthlogs ไม่stash/reset/checkoutทับuserwork.
3. บันทึกtransfer noteใน `docs/handoffs/<TASK-ID>-TRANSFER-<ID>.md` โดยเลือกIDว่างจริง ไม่overwriteรอบเก่า. เก็บpathในผลpartialเมื่อทำได้. เก็บtask/runเดิมแม้เปลี่ยนtool; เปลี่ยนrunถัดไปตามprotocol ไม่เริ่มR01ใหม่ให้ทับ.
4. ถ้าtoolหมดbudgetก่อนเขียนnote ผู้ใช้หรือCoordinatorเก็บsnapshotจากGit/files/คำสั่งที่ตรวจจริงได้ แต่ต้องติดป้ายprovenanceเป็นCoordinator/user snapshot ไม่ปลอมเป็นรายงานproducerที่toolไม่ได้เขียน. สิ่งที่ไม่ทราบเป็นunknown/NOTRUN.
5. เครื่องมือรับช่วงอ่านAGENTS/workflow/currenthandoff/latestresult/transfernoteและdiffจริงก่อนทำต่อ. ยืนยันworkspace/task/branch/commit/dirtyownership; อ่านทวนเมื่อworkspaceเปลี่ยน ไม่เชื่อว่าchatmemoryย้ายตามมา.
6. ผู้ใช้ยืนยันincomingwriterแล้วจึงเริ่มต่อจากnextfailingcase/nextstep. ตรวจtestsของcurrentbuildใหม่ตามส่วนที่เปลี่ยน ไม่copyPASSเก่ามาอ้างbuildใหม่. Database/volumes/processesคงเดิมตามsafe-stop ไม่ลบเพื่อเริ่มใหม่โดยปริยาย.

### Transfer note — required fields
- task_id / outgoing_tool / incoming_tool / ผู้ยืนยันhandover
- outgoing_writer_state: STOPPEDหรือUNKNOWN พร้อมหลักฐาน/คำยืนยัน; incoming_state: NOT_STARTEDหรือสถานะที่พิสูจน์ได้
- branch / observed_HEAD / optionalWIPcommit / เวลา+timezoneที่ตรวจจริง
- ownedchangedpaths / uncommittedและuntrackedpaths / buffersที่ยังไม่saveถ้าทราบ
- สิ่งที่เสร็จ/ค้างและnextfailingcase หรือระบุว่ายังไม่มีtests
- คำสั่งล่าสุดที่รันจริง+exitcode+evidencepaths; แยกself-report/verified/NOTRUN ห้ามแต่งRED/GREEN
- localservices/ports/volumesที่เริ่มไว้และsafe-stop/restartinstructionsตามจริง; ไม่ใส่credential/connectionstring/tokenหรือprocessargvที่อาจมีsecret
- migration/schema/stateที่applyแล้ว/ยังไม่apply ไม่รันซ้ำโดยเดา
- latestresulttask/run/paths และrisks/blockers/nextapproval

## Output / review invariant
ทั้งDeepSeek HarnessและAntigravityใช้ `docs/results/<TASK>/<RUN>/result.md`, `result.json`, sanitizedevidence และอัปเดตINDEXlast. Producer/tool/modelต้องเป็นสิ่งที่รู้จริง Modelไม่ทราบให้null/UNVERIFIED ไม่อนุมานจากชื่อHarness; same taskไม่เปลี่ยนcaseIDsหรือModeA/Bcoverageเมื่อสลับ.

เมื่อผู้ใช้แจ้ง “DeepSeekทำเสร็จแล้ว”, “ลุงทำเสร็จแล้ว” หรือ “ตัวเขียนโค้ดทำเสร็จแล้ว” Coordinatorอ่านINDEX/latestsummaryและตรวจevidenceก่อน ไม่ต้องแปะchatทั้งหมด. Self-reportไม่เท่ากับQA PASS. CanonicalQAตรวจcurrentbuildจริง แล้วผู้ใช้รับงาน.

Skillsที่projectเก็บไว้ยังต้องอ่านตามrelevanceและรายงานREAD_LOADED/APPLIED/activationevidenceตามที่hostทำได้จริง. ไม่มีการรับรองว่าDeepSeek HarnessรองรับAntigravityCustomizations/hooks/pluginsหรือใช้skillsเหมือนกัน; ไม่installhelpers/globalconfigเพื่อฝืนให้ครบชื่อ.

## Antigravity fallback specifics
ใช้เมื่อผู้ใช้ยืนยันเปลี่ยนwriterหลังcheckpointเท่านั้น. ExistingIDEconversation/CLIbindingblockerเป็นเงื่อนไขเฉพาะfallback ไม่blockผู้ใช้ทำงานในDeepSeek. ถ้าใช้agyให้ใช้ `gemini-3.8-flash-high` ตามที่อนุมัติ; ข้อนี้ไม่ใช่modelsettingสำหรับDeepSeek Harness. ห้ามเดาlatest/newconversation/importauth/appdata; ต้องverifychannel/readbackก่อนอ้างSTARTreceived. ไม่dispatchซ้ำขณะมีwriterอื่นทำงาน.

## Unchanged gates / progress
C1 localbuildยังauthorizedตามscopeเดิม: React/ElysiaBun/PostgreSQLจริง/nativeWS/ModeA-B/C1-01–C1-16. Push/deploy/publictunnel/paidservices/globalconfiguration/destructiveresetยังต้องapprovalแยก. Stack/UIaccepted/privacy/atomicity/idempotency/fresh-attemptpolicyไม่เปลี่ยน. RuntimeยังNOTRUNจนมีevidenceจากbuildจริง.

รอบนี้Coordinatorปรับdocsเท่านั้น ไม่เปิดDeepSeek/Antigravity ไม่ส่งSTART ไม่installหรือแก้app/config/tests. รักษาprotecteddirtyAI-PROGRESS/C1handoffเดิมและเก็บAIprogressในworkflowนี้. HistoricalOP01/dispatchBLOCKEDreportsคงตามจริง ไม่rewriteว่าเชื่อมสำเร็จ. ใช้lead-d-workshop-cycleและwriting-for-agentsสำหรับroles/precedence/checkpoint/resultcontinuity.
