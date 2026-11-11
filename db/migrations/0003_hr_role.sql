-- HR-SUMMARY-01: additive role for a session-scoped, read-only HR summary.
-- Applied migrations are not rewritten; existing grants keep their roles.
alter table grants drop constraint if exists grants_role_check;
alter table grants add constraint grants_role_check check (role in ('participant', 'facilitator', 'hr'));
