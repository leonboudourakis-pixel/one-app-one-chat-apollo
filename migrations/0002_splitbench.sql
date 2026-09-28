-- Splitbench rooms: shared piece, seats, chat, and a dropped site bundle.

create table if not exists rooms (
  id text primary key,
  code text not null unique,
  name text not null,
  owner_id text not null,
  spec jsonb not null,
  bundle text,
  bundle_label text,
  revision integer not null default 1,
  bundle_revision integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id text not null references rooms (id) on delete cascade,
  user_id text not null,
  display_name text not null,
  aspect text not null,
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, aspect)
);

create table if not exists room_messages (
  id bigserial primary key,
  room_id text not null references rooms (id) on delete cascade,
  user_id text not null,
  display_name text not null,
  kind text not null,
  aspect text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists room_messages_room_idx on room_messages (room_id, id);
create index if not exists room_members_user_idx on room_members (user_id);
