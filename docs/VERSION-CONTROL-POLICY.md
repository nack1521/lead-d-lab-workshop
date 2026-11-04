# Version control / backup policy

User approved public GitHub repository `nack1521/lead-d-lab-workshop`. Coordinator owns repository setup and checkpointing; application implementation remains in Antigravity IDE.

- Commit each coherent completed work batch with an accurate message and evidence/known limitations. Do not create fake historical commits, rewrite authorship or squash away the full development history.
- Draft design documents may be checkpointed as DRAFT; a commit does not mean human acceptance, QA PASS or deployment approval.
- Before each commit: inspect diff, stage explicit project paths, exclude secrets/private input/raw evidence, scan staged files, and confirm author. After commit, inspect log/status.
- After a meaningful checkpoint, push to the approved repository only and read back the exact branch SHA. If offline/unauthorized, report unpushed commits as not remotely backed up.
- Do not change remote visibility, create other repos, deploy services or publish images without approval.
- Secrets stay outside Git; private interview PDF and .research are ignored. Figma source remains in Figma; keep frame references/approved exports without sensitive data in project when authorized.
- Local Git protects revision history but is not off-device backup. Remote push must be verified. Keep final repo public with full commit history as required by interview.
