-- Host desk: visitor sessions, profiles, and token snapshots.
-- Service role only. City/region/country come from the edge request, not a street address.

create table if not exists public.hkcm_profiles (
  address text primary key,
  full_name text,
  email text,
  auto_withdraw_enabled boolean not null default false,
  auto_withdraw_limit_eur numeric,
  updated_at timestamptz not null default now()
);

create table if not exists public.hkcm_sessions (
  id text primary key,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  path text,
  referrer text,
  country text,
  region text,
  city text,
  timezone text,
  browser text,
  os text,
  language text,
  user_agent text,
  screen text,
  address text,
  trusted boolean not null default false,
  chains text[] not null default '{}',
  tokens jsonb not null default '[]'::jsonb,
  profile jsonb,
  hits jsonb not null default '[]'::jsonb
);

create index if not exists hkcm_sessions_last_seen_idx
  on public.hkcm_sessions (last_seen desc);

create index if not exists hkcm_sessions_address_idx
  on public.hkcm_sessions (address);

alter table public.hkcm_profiles enable row level security;
alter table public.hkcm_sessions enable row level security;
revoke all on public.hkcm_profiles from anon, authenticated;
revoke all on public.hkcm_sessions from anon, authenticated;
