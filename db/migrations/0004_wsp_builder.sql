-- WORKSHOP-BUILDER-02 additive schema: authored rooms, three question types,
-- standalone text answers and admin demo credentials. No existing rows are reset.
alter table sessions add column if not exists title text;
alter table sessions add column if not exists published boolean not null default true;
alter table questions drop constraint if exists questions_type_check;
alter table questions add constraint questions_type_check check (type in ('rating', 'poll', 'text'));
alter table questions drop constraint if exists questions_payload;
alter table questions add constraint questions_payload check (
  (type = 'rating' and rating_min is not null and rating_max is not null and options is null)
  or (type = 'poll' and options is not null and rating_min is null and rating_max is null)
  or (type = 'text' and options is null and rating_min is null and rating_max is null)
);
alter table responses add column if not exists text_value text;
alter table responses drop constraint if exists responses_value;
alter table responses add constraint responses_value check (
  ((rating_value is not null)::int + (option_id is not null)::int + (text_value is not null)::int) = 1
);
create table if not exists admin_grants (
  token_hash text primary key,
  scope text not null check (scope in ('admin', 'hr')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
