# Results index — latest producer results and independent reviews

Paths ในตารางเริ่มจาก repository root. Latest run คือผลรอบล่าสุดที่บันทึกครบ ไม่ได้หมายถึง accepted/PASS. อ่านสรุป JSON ก่อน แล้วอ่าน detail/evidence เฉพาะเคสตาม [protocol](../ANTIGRAVITY-RESULT-PROTOCOL.md)

**Current independent retest — C1-LOCAL-BUILD / R02: CHANGES_REQUESTED.** See [consolidated retest](../implementation/C1-REVIEW-SUMMARY-R02.md), [canonical QA](../qa/C1-LOCAL-BUILD-QA-RETEST-R02.md), and [browser retest](../implementation/C1-BROWSER-RETEST-R02.md). Original browser fixes hold in tested paths; five named residuals remain (three runtime-reproduced, two static), plus a WS lifetime verification gate. Current-build regression independently reran 71 pass / 0 fail in each mode and typecheck exit 0; green suites do not close missing scenarios. Producer FIXED/PASS below remains self-report, not acceptance. Next: user-operated [R02 review-fix prompt](../handoffs/C1-FIX-R02-EN.txt), independent retest, then human acceptance. [R01 consolidated history](../implementation/C1-REVIEW-SUMMARY-R01.md) is retained.

| Task | Latest run | Producer / provenance | Status | Summary JSON | Detail | Next gate |
|---|---|---|---|---|---|---|
| C1-LOCAL-BUILD | R02 | DeepSeek Harness (model: deepseek-v4.1-flash-1017, runtime-reported/unverified) | READY_FOR_REVIEW | docs/results/C1-LOCAL-BUILD/R02/result.json | docs/results/C1-LOCAL-BUILD/R02/result.md | Independent QA/browser retest ของ da30003 กับ C1-RV-01..05 → ผู้ใช้ทดลอง/รับ implementation |
| C1-PREFLIGHT-FOLLOWUP | R03 | Antigravity IDE (model: gemini-3.8-flash-high) | READY_FOR_REVIEW | docs/results/C1-PREFLIGHT-FOLLOWUP/R03/result.json | docs/results/C1-PREFLIGHT-FOLLOWUP/R03/result.md | ผู้ใช้พิจารณาและอนุมัติ technical choices / local build |

สถานะการตั้งกติกา: Antigravity ใน IDE อ่าน AGENTS.md, protocol และ SKILL-AUDIT-01 แล้ว; บันทึกรอบ R03 พร้อม skill_usage (ponytail applied) ลงดิสก์จริงโดยตรง; Runtime C1-01–C1-16 ยังคง NOT RUN ทั้งหมดในรอบ R03 (historical)

**C1-LOCAL-BUILD / R02 (current):** R01 review groups **C1-RV-01..05 ทั้ง 5 กลุ่ม FIXED** บน build `da30003` พร้อม RED→GREEN จริงที่ API/DB/WS และ React-container seams; Mode A `bun test tests` 71 pass/0 fail; Mode B (Docker-only, rebuild + migration 0002) รันด้วย tests/run-in-docker.sh แยก container 71 pass/0 fail; restart ทั้งสอง mode ข้อมูลและ receipt อยู่ครบ. C1-01–C1-14 + C1-16 PASS, **C1-15 PARTIAL** (build/deep-link ผ่าน แต่ real-browser interaction NOT RUN — ต้องให้ QA/Coordinator retest). อ่าน [result.json](C1-LOCAL-BUILD/R02/result.json) / [detail](C1-LOCAL-BUILD/R02/result.md) / [evidence](C1-LOCAL-BUILD/R02/evidence/README.md) / [executive report](../implementation/C1-REPORT.md). ไม่ใช่ independent QA PASS หรือ human acceptance; R01 คงไว้เป็นประวัติ

Coordinator review ของ **R03**: **READY_FOR_HUMAN_BUILD_APPROVAL** — ดู [ผล targeted review](../implementation/C1-PREFLIGHT-R03-COORDINATOR-REVIEW.md). REV-05/06/07 แก้แล้วในระดับ metadata/specification; ยังไม่อนุมัติ build หรือรับรอง runtime/IDE skill activation จาก self-report

Coordinator review ของ **R02** (historical): **CHANGES_REQUESTED** — ดู [ผลตรวจแยกจาก producer](../implementation/C1-PREFLIGHT-R02-COORDINATOR-REVIEW.md). Findings เดิมคงไว้เป็นประวัติ ไม่ rewrite เป็น PASS; runtime ทุกเคสยัง NOT RUN

Legacy Operator evidence OP-00/OP-00B/OP-01 อยู่ docs/implementation/ ตามเดิม; ไม่ใช่ C1 runtime results และไม่ rewrite history
