-- Project one-liner, and the admin's typed note for what each account can change.

alter table rooms add column if not exists blurb text not null default '';

create table if not exists account_duties (
  email text primary key,
  brief text not null,
  allowed jsonb not null,
  updated_at timestamptz not null default now()
);
