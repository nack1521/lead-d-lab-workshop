-- C1-RV-01: durable per-attempt terminal outcomes.
-- Rejected attempts keep a stable receipt (fingerprint + code) so the same key
-- replays the same outcome and a changed payload is a clear conflict.
alter table submission_receipts drop constraint if exists submission_receipts_outcome_check;
alter table submission_receipts
  add constraint submission_receipts_outcome_check check (outcome in ('accepted', 'rejected'));
alter table submission_receipts add column if not exists code text;
alter table submission_receipts add column if not exists message text;
