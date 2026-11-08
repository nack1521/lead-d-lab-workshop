# C1 WebSocket authorization / send boundary

Status: documented implementation boundary for C1 (local tracer bullet), with executed evidence in `docs/results/C1-LOCAL-BUILD/R04/`. This is not a zero-network-race guarantee and does not change the approved grant-lifetime policy.

## Approved lifetime semantics as implemented

| Condition | Decision | Equality case |
|---|---|---|
| Grant hard TTL reached | Renewed use is refused (`401 UNAUTHORIZED`) | Valid only while `now < expires_at`; at `now == expires_at` it is **expired** |
| Session ended normally (participant) | Read-only access stays usable for the approved 15-minute grace (`RECEIPT_READ_GRACE_SECONDS`) | Readable while `now <= ended_at + grace`; one millisecond later it is `GRACE_EXPIRED` |
| Hard TTL vs grace | Hard TTL always wins; grace never extends expiry | At any instant past `expires_at` the grant is invalid even inside grace |
| Revocation | Immediate, read and write | Applies at any instant, including inside grace |
| Facilitator grant | Hard TTL only (8h), no session-end grace | Same exclusive equality at `expires_at` |

These equality cases are the current behavior and are recorded as the interpretation of the approved policy, not a policy change. If the product wants an inclusive hard-TTL instant or a non-inclusive grace instant, that must be an explicit approval decision.

## Send path and linearization boundary

1. The hub builds the payload for the socket (`buildSnapshot` for facilitator, `buildParticipantView` for participant — one repeatable-read transaction).
2. The socket's grant token is re-authenticated against the database (`authenticate`: expiry, session-end grace, revocation, role).
3. If the decision is "invalid", the socket receives `{type:'error', code:'UNAUTHORIZED'}` and is closed with 4401; no data frame is sent.
4. If the decision is "valid", the already-built payload is written.

The **per-socket re-authentication in step 2 is the authorization/send linearization point**. A revoke or expiry that commits after that point can interleave with any send already admitted by a concurrent resync/broadcast. Under concurrent sends, several already-admitted frames (one per in-flight send) can therefore be delivered; there is no proven one-frame bound. After them:

- explicit participant revocation also closes matching sockets immediately (`disconnectParticipant`), typically before the blocked send;
- no send that reaches revalidation after the revoke/expiry is admitted; the next send/resync fails revalidation (error + 4401);
- the idle sweep (`WS_SWEEP_INTERVAL_MS`, default 30 s) closes sockets whose grants stop being valid without any client action.

No claim is made that a revoke can never race frames in flight, and the earlier one-in-flight-frame wording is corrected: concurrent sends may each deliver one already-admitted frame. No stricter retention or expiry policy was introduced.

## Executed evidence (R04)

- `tests/evidence-gates.test.ts` — equality cases at the real `authenticate` seam with real PostgreSQL rows.
- Same file — a test-only `beforeSend` hook (production never passes hooks) pauses exactly between revalidation and send:
  - expiry inside the window admits exactly the already-built in-flight frame, then `resync` returns `UNAUTHORIZED` and closes 4401 with no further data;
  - revocation inside the window is covered by the explicit disconnect: the revoked socket receives no state frame and closes;
  - the valid side delivers the broadcast frame normally.
- `tests/findings-r02.test.ts` — resync/broadcast/sweep lifetime regressions retained.
