# เริ่ม Bun และ Figma — คู่มือเตรียมเครื่อง

สถานะ 2026-11-04: ผู้ใช้จะติดตั้ง Docker เอง; ยังไม่ได้เลือก native Bun หรือ container-only และยังไม่ได้สร้าง Figma file จาก Hermes

## Bun choices
ใช้ official image `oven/bun` ได้โดยไม่ติดตั้ง Bun บน macOS. Image รองรับ Linux arm64/x64 ตามเอกสาร Bun.
หลัง Docker Desktop เริ่มทำงาน ให้ตรวจ `docker version` และ `docker compose version` แล้วลอง:

```sh
docker run --rm oven/bun:1 --version
```

คำสั่งนี้อาจดาวน์โหลด image และเป็นเพียง runtime smoke check ไม่ใช่การทดสอบแอป; tag :1 เปลี่ยนได้ ให้ pin exact version/digest หลังเลือก version สำหรับโปรเจกต์
Bun ใน container ไม่ทำให้ `bun` ใช้บน host ได้ ต้องสั่งผ่าน Docker หรือใช้ IDE container setup

Native installation (ทางเลือก ไม่จำเป็นหาก container-only):
```sh
curl -fsSL https://bun.sh/install | bash
```
เป็นการดาวน์โหลดและรัน official installer ในเครื่อง; ผู้ใช้ควรตรวจแหล่งและผลต่อ PATH ก่อนรัน เปิด terminal ใหม่แล้วตรวจ `bun --version` และ `bun --revision`

Recommendation: native Bun + Docker PostgreSQL ช่วย hot reload/debug คล่อง; container-only ทำได้ถ้าต้องการไม่ติด runtime บน host แต่ต้องให้ Antigravity จัด Compose/dev environment, volume แยก node_modules, file watching และ debugger paths
ห้ามใช้ node_modules ที่มี native binaries ปะปนข้าม macOS/Linux. Container networking ใช้ชื่อ service ไม่ใช่ localhost สำหรับต่อ Postgres คนละ container; listen 0.0.0.0 ภายใน container แต่ publish dev ports ที่ 127.0.0.1
Dockerfile/Compose/scripts เป็น coding จึงให้ Antigravity สร้างหลังอนุมัติ ไม่เขียนในรอบคู่มือนี้

## Figma starter
1. ลงชื่อเข้าใช้ https://www.figma.com/ แล้วเปิด https://figma.new หรือ Drafts → Design/New design file
2. เลือก Figma Design ไม่ใช่ FigJam, Slides หรือ Make สำหรับ editable UI design ที่เราจะส่งต่อ
3. ตั้งชื่อ `Lead+D Lab — Workshop MVP` เก็บ Drafts ก่อน ไม่เปิด public ไม่ใส่ secrets/PDF ส่วนตัว
4. เริ่ม 3 pages เพื่อใช้ได้ง่ายกับข้อจำกัด Starter team files: `01 Brief & Foundations`, `02 Wireframes & Flows`, `03 UI & Handoff`. ถ้า plan เพิ่ม pages ได้ ค่อยแยก Participant/Facilitator/HR
5. ใน Wireframes ใช้ Frame tool (F) สร้าง phone preset สำหรับ participant และ desktop preset สำหรับ facilitator/HR. ใช้ Sections แยกบทบาทในหน้าเดียว
6. เริ่มหน้าขาวดำ: Join, Waiting, Rating/Poll, Sending/Saved/Error/Reconnect/Closed, Facilitator Lobby/Control/Live Result, HR Summary/Empty. ใช้ข้อมูลตัวอย่างที่ระบุชัด ไม่อ้างผลจริง
7. Auto Layout สำหรับฟอร์ม/ปุ่ม/การ์ด, ข้อความไทยอ่านง่าย, component states และ clickable flow. ยังไม่ต้องซื้อ UI kit หรือ paid AI plan
8. กด Share → Copy link ส่ง file URL มา โดยไม่เปลี่ยน Anyone-with-link edit. ลิงก์อย่างเดียวไม่ให้ Hermes สิทธิ์เข้าถึงไฟล์ส่วนตัว ต้องเชื่อมบัญชี/client ที่รองรับหรือส่ง screenshot/export เพิ่มเมื่อถึงขั้น review

MCP connection ยังไม่ได้ทำ. การสร้างไฟล์เอง/การ design แบบ manual ไม่ต้องรอ MCP. Official remote canvas writing ต้องตรวจ supported client, plan/seat/edit permissions และเครื่องมือที่เปิดให้จริงก่อน

## Verification status
ในรอบนี้ docker/bun ยังไม่พบใน PATH; ไม่รัน installer ไม่ pull image ไม่สร้าง container/DB และไม่สร้าง/แก้ Figma file. คู่มือนี้เป็นคำแนะนำ ไม่ใช่รายงานติดตั้งสำเร็จ

Sources:
- https://bun.com/docs/installation
- https://bun.com/docs/guides/ecosystem/docker
- https://help.figma.com/hc/en-us/articles/30926129986199-FD4B-Create-your-first-design-file
- https://help.figma.com/hc/en-us/articles/360038511293-Create-and-manage-pages
- https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design
