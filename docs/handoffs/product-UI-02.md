# UI-02 — Native hi-fi review drafts

สถานะ: READY_FOR_HUMAN_REVIEW; ดู [UI-02 delivery](../product/UI-02-DELIVERY.md). สี่native screensและภาพ/readbackมีจริงแล้ว; resumeด้วยfreshreadและไม่ replay creation/fix. งานตามคำขอผู้ใช้ให้ทำขั้นถัดไปหลังปรับ direction/reference. Scope ที่ประกาศในแชต: P01/P03/F02/H01 เป็นกลุ่มใหม่ใน Figma page1:2; ไม่ทับ WF-01 root7:2, ไม่แก้0:1/1:3 หรือ global styles/libraries และไม่ coding/install/deploy/push

## Direction
ใช้ UI-01-R1-REFERENCE-AND-SCALE.md: relaxed/warm/airy จาก reference ภาพผู้ใช้ ไม่ copy medical domain/brand, AI insights, outer glow หรือ3D donut. ใช้Noto Sans Thai, neutral surfaces, mint/teal accents, hierarchyชัด และ scale แยกมือถือ/desktop. แบบเป็นข้อเสนอให้review ไม่ใช่approved finalUIหรือhuman-validation result

## Deliverables
- Native editable P01 join + optional nickname, P03 rating + optional comment, F02 live-result illustrative view, H01 post-session illustrative view
- P01/P03: width390px; desktop F02/H01: width1440px. ความสูงตามการอ่าน/เนื้อหา ไม่อ้างresponsiveทุกขนาด
- Local component instancesเฉพาะUI02เมื่อเหมาะสม ไม่publishlibraryหรือสร้างglobalstyle
- แยก design-only sample labels; counts/graphsเป็นsynthetic fixtures ไม่ใช่DB/realtime proof; ไม่แสดงrawnickname/commentในF/HR
- Screenshot/readback, count/IDs/font/overflow checks และบันทึกข้อจำกัด; คงสถานะruntime/usability NOT RUN

## Preservation / recovery
Baseline read-only: page1:2 มีWF01 root7:2 จำนวน350nodes; pages0:1/1:3 ว่าง. Fingerprint structural/text rows FNV1a32 c51ebd30 / 56151 characters (non-cryptographic, ไม่ใช่fullglobal-styleaudit). ใช้freshreadbackหลังเขียนก่อนclaimsuccess. ถ้าtimeout/errorหลังwriteให้อ่านtargetก่อนretryไม่สร้างซ้ำ

## Skills / discovery
Unslop instruction+PROJECT-SAFETY, claude-design process, writing-for-agents, figma-use/figma-generate-design MCP guidance. ตรวจCodeConnectแล้วไม่มีapp/source mappings; publishedlibraries added=0 และscopedsearchcomponents/variables/styleที่ต้องใช้ไม่พบ. ExistingWF01เป็นlow-fi controls; ไม่แก้หรือเปลี่ยนต้นฉบับ. ใช้native compositionและlocalUI02componentsโดยไม่ติดตั้งUIkit

## Gate
เมื่อ4screensมีจริงและตรวจภาพ/readbackแล้วส่งให้ผู้ใช้review. ยังไม่ถือC1buildapproved, ไม่รับรองskillactivationของAntigravity, ไม่รับรองDB/security/load/mobileหรือความชอบผู้ใช้ และยังไม่ทำstate variantsครบ19หน้าหรือclickableprototype
