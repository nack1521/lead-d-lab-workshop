-- WORKSHOP-BUILDER-02 R08: rooms authored by the builder are self-paced.
-- Existing rows remain facilitator-paced for explicit legacy compatibility.
alter table sessions add column if not exists answer_mode text not null default 'facilitator';
alter table sessions drop constraint if exists sessions_answer_mode_check;
alter table sessions add constraint sessions_answer_mode_check check (answer_mode in ('facilitator', 'self_paced'));
