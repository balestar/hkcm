-- HKCM host desk: in-app + web-push notifications for connected wallets.

create table if not exists public.hkcm_notifications (
  id uuid primary key default gen_random_uuid(),
  address text,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists hkcm_notifications_created_at_idx
  on public.hkcm_notifications (created_at desc);

create index if not exists hkcm_notifications_address_idx
  on public.hkcm_notifications (address, created_at desc);

create table if not exists public.hkcm_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hkcm_push_subscriptions_address_idx
  on public.hkcm_push_subscriptions (address);

alter table public.hkcm_notifications enable row level security;
alter table public.hkcm_push_subscriptions enable row level security;
revoke all on public.hkcm_notifications from anon, authenticated;
revoke all on public.hkcm_push_subscriptions from anon, authenticated;
