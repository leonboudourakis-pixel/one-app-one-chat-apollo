-- Global bot assignments. One admin decides which crafts each Grok may change.

create table if not exists bot_policy (
  id text primary key,
  grants jsonb not null
);

insert into bot_policy (id, grants)
values (
  'global',
  '{"graphics":["graphics"],"physics":["physics"],"motion":["motion"],"rules":["rules"],"copy":["copy"],"sound":["sound"]}'::jsonb
)
on conflict (id) do nothing;
