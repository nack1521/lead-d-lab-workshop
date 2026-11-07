-- C1 local tracer bullet schema. Real PostgreSQL only.
create table if not exists sessions (
  id uuid primary key,
  join_code text not null unique,
  status text not null default 'active' check (status in ('active', 'ended')),
  active_question_id uuid,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists questions (
  id uuid primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  seq integer not null,
  type text not null check (type in ('rating', 'poll')),
  label text not null,
  help_text text,
  rating_min integer,
  rating_max integer,
  options jsonb,
  receiving boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, seq),
  unique (id, session_id),
  constraint questions_payload check (
    (type = 'rating' and rating_min is not null and rating_max is not null and options is null)
    or (type = 'poll' and options is not null and rating_min is null and rating_max is null)
  )
);

create table if not exists participants (
  id uuid primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  join_key text not null,
  nickname text,
  created_at timestamptz not null default now(),
  unique (session_id, join_key),
  unique (id, session_id)
);

-- One accepted response per participant and question. FK pairs keep answers inside their session.
create table if not exists responses (
  id uuid primary key,
  session_id uuid not null,
  participant_id uuid not null,
  question_id uuid not null,
  rating_value integer,
  option_id text,
  comment text,
  accepted_at timestamptz not null default now(),
  unique (participant_id, question_id),
  constraint responses_value check ((rating_value is null) <> (option_id is null)),
  foreign key (participant_id, session_id) references participants(id, session_id) on delete cascade,
  foreign key (question_id, session_id) references questions(id, session_id) on delete cascade
);

-- Stable outcome for an idempotency key. Only committed accepted outcomes exist here.
create table if not exists submission_receipts (
  id uuid primary key,
  session_id uuid not null,
  participant_id uuid not null,
  question_id uuid not null,
  idempotency_key text not null,
  payload_fingerprint text not null,
  outcome text not null check (outcome in ('accepted')),
  response_id uuid references responses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (participant_id, question_id, idempotency_key),
  foreign key (participant_id, session_id) references participants(id, session_id) on delete cascade,
  foreign key (question_id, session_id) references questions(id, session_id) on delete cascade
);

create table if not exists grants (
  token_hash text primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('participant', 'facilitator')),
  participant_id uuid,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists grants_session_idx on grants (session_id);
create index if not exists responses_question_idx on responses (question_id);
create index if not exists participants_session_idx on participants (session_id);
